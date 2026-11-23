import { NextRequest, NextResponse } from 'next/server';

const FORMS_API_BASE = 'https://forms.googleapis.com/v1/forms';

interface GoogleFormItem {
  title?: string;
  questionItem?: {
    question?: {
      questionId?: string;
    };
  };
}

interface GoogleFormResponseItem {
  responseId?: string;
  createTime?: string;
  lastSubmittedTime?: string;
  respondentEmail?: string;
  answers?: Record<
    string,
    {
      questionId?: string;
      textAnswers?: {
        answers?: Array<{ value?: string }>;
      };
    }
  >;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing Google OAuth Bearer token' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawFormId = searchParams.get('formId') ?? '';
  const trimmedFormId = rawFormId.trim();
  if (!trimmedFormId) {
    return NextResponse.json({ error: 'Missing formId query parameter' }, { status: 400 });
  }

  const safeFormId = encodeURIComponent(trimmedFormId);

  const [formRes, responsesRes] = await Promise.all([
    fetch(`${FORMS_API_BASE}/${safeFormId}`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    }),
    fetch(`${FORMS_API_BASE}/${safeFormId}/responses`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    }),
  ]);

  const formJson = await formRes.json();
  if (!formRes.ok) {
    return NextResponse.json(
      { error: formJson?.error?.message || 'Unable to load Google Form definition' },
      { status: formRes.status }
    );
  }

  const responsesJson = await responsesRes.json();
  if (!responsesRes.ok) {
    return NextResponse.json(
      { error: responsesJson?.error?.message || 'Unable to load Google Form responses' },
      { status: responsesRes.status }
    );
  }

  // Build ordered question list mapping questionId -> title
  const questions: Array<{ questionId: string; title: string }> = [];
  const items: GoogleFormItem[] = Array.isArray(formJson.items) ? formJson.items : [];
  for (const item of items) {
    const qId = item.questionItem?.question?.questionId;
    if (qId) {
      questions.push({
        questionId: qId,
        title: item.title ?? 'Question',
      });
    }
  }

  const rawResponses: GoogleFormResponseItem[] = Array.isArray(responsesJson.responses)
    ? responsesJson.responses
    : [];

  const normalizedResponses = rawResponses.map((resp) => {
    const fieldValues: Record<string, string> = {};
    const answers = resp.answers ?? {};
    for (const q of questions) {
      const answerEntry = answers[q.questionId];
      const textValues =
        answerEntry?.textAnswers?.answers
          ?.map((a) => a.value ?? '')
          .filter(Boolean) ?? [];
      fieldValues[q.questionId] = textValues.join(', ');
    }

    return {
      responseId: resp.responseId ?? '',
      submittedAt: resp.lastSubmittedTime ?? resp.createTime ?? '',
      respondentEmail: resp.respondentEmail ?? '',
      fieldValues,
    };
  });

  // Sort newest first
  normalizedResponses.sort((a, b) =>
    (b.submittedAt || '').localeCompare(a.submittedAt || '')
  );

  return NextResponse.json({
    formId: formJson.formId,
    title: formJson.info?.title ?? 'Google Form',
    responderUri: formJson.responderUri ?? '',
    questions,
    responses: normalizedResponses,
  });
}
