import { NextRequest, NextResponse } from 'next/server';

const FORMS_API_BASE = 'https://forms.googleapis.com/v1/forms';

type FormTemplateKind = 'direct_booking' | 'digital_checkin';

interface QuestionSeed {
  title: string;
  description?: string;
  required?: boolean;
  kind: 'text' | 'paragraph' | 'date' | 'choice';
  options?: string[];
}

function getTemplateConfig(kind: FormTemplateKind): {
  title: string;
  documentTitle: string;
  description: string;
  questions: QuestionSeed[];
} {
  if (kind === 'direct_booking') {
    return {
      title: "Vanny's Peaceful Guesthouse — Direct Nomad Booking Request",
      documentTitle: 'Vannys Guesthouse Direct Booking Request',
      description:
        'Book directly in Toul Tom Pong, Phnom Penh and save 12% vs. OTA platforms. After submitting, message us on Telegram to confirm your 1-night ABA Pay / KHQR deposit.',
      questions: [
        {
          title: 'Full Name (as on Passport)',
          required: true,
          kind: 'text',
        },
        {
          title: 'Telegram Handle or WhatsApp Number',
          description: 'Used for instant room confirmation, Wi-Fi speed proof, and ABA KHQR receipt.',
          required: true,
          kind: 'text',
        },
        {
          title: 'Email Address',
          required: true,
          kind: 'text',
        },
        {
          title: 'Preferred Check-In Date',
          required: true,
          kind: 'date',
        },
        {
          title: 'Preferred Check-Out Date',
          required: true,
          kind: 'date',
        },
        {
          title: 'Room & Workspace Preference',
          required: true,
          kind: 'choice',
          options: [
            'Standard Quiet Room (Teak Work Desk + Fiber Wi-Fi)',
            'Courtyard Desk Suite (Extra Quiet + Balcony)',
            'Weekly Nomad Package (7+ Nights Direct Discount)',
            'Monthly Remote-Worker Stay (28+ Nights)',
          ],
        },
        {
          title: 'Airport Tuk-Tuk Pickup Needed?',
          required: true,
          kind: 'choice',
          options: [
            'Yes — Phnom Penh / Techo Airport Pickup',
            'No — Arriving Independently in Toul Tom Pong',
          ],
        },
        {
          title: 'Remote Work & Deposit Notes',
          description: 'Any video call schedule, ergonomic chair/monitor needs, or ABA KHQR deposit questions.',
          required: false,
          kind: 'paragraph',
        },
      ],
    };
  }

  return {
    title: "Vanny's Peaceful Guesthouse — Digital Pre-Arrival Check-In",
    documentTitle: 'Vannys Guesthouse Digital Pre-Arrival Check-In',
    description:
      'Complete this 60-second check-in before arriving in Toul Tom Pong so your room key, fiber Wi-Fi credentials, and tuk-tuk pickup are ready.',
    questions: [
      {
        title: 'Guest Full Name',
        required: true,
        kind: 'text',
      },
      {
        title: 'Passport Number & Nationality',
        description: 'Required for Cambodian hospitality guest registration.',
        required: true,
        kind: 'text',
      },
      {
        title: 'Telegram Handle / WhatsApp for Arrival Updates',
        required: true,
        kind: 'text',
      },
      {
        title: 'Arrival Date',
        required: true,
        kind: 'date',
      },
      {
        title: 'Estimated Arrival Time in Phnom Penh',
        description: 'Include flight number if requesting airport tuk-tuk pickup.',
        required: true,
        kind: 'text',
      },
      {
        title: 'Workspace & Quiet Room Preferences',
        required: false,
        kind: 'choice',
        options: [
          'Upper floor quiet room (away from street)',
          'Near courtyard work table',
          'Early morning check-in / luggage drop requested',
          'Standard arrival (14:00 onwards)',
        ],
      },
      {
        title: 'Payment Method at Check-In / Deposit Status',
        required: true,
        kind: 'choice',
        options: [
          'ABA Pay / KHQR Deposit Already Sent via Telegram',
          'Paying Balance via ABA Pay / KHQR on Arrival',
          'Paying Cash (USD) on Arrival',
        ],
      },
    ],
  };
}

function buildCreateItemRequest(q: QuestionSeed, index: number) {
  let questionPayload: Record<string, unknown>;

  if (q.kind === 'date') {
    questionPayload = {
      required: Boolean(q.required),
      dateQuestion: { includeTime: false, includeYear: true },
    };
  } else if (q.kind === 'choice') {
    questionPayload = {
      required: Boolean(q.required),
      choiceQuestion: {
        type: 'RADIO',
        options: (q.options ?? []).map((value) => ({ value })),
      },
    };
  } else {
    questionPayload = {
      required: Boolean(q.required),
      textQuestion: { paragraph: q.kind === 'paragraph' },
    };
  }

  return {
    createItem: {
      item: {
        title: q.title,
        ...(q.description ? { description: q.description } : {}),
        questionItem: {
          question: questionPayload,
        },
      },
      location: { index },
    },
  };
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
  const res = await fetch(`${FORMS_API_BASE}/${safeFormId}`, {
    headers: { Authorization: authHeader },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.message || 'Failed to retrieve Google Form' },
      { status: res.status }
    );
  }

  return NextResponse.json({
    formId: data.formId,
    title: data.info?.title ?? 'Untitled Form',
    description: data.info?.description ?? '',
    responderUri: data.responderUri ?? '',
    itemsCount: Array.isArray(data.items) ? data.items.length : 0,
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing Google OAuth Bearer token' }, { status: 401 });
  }

  let body: { template?: FormTemplateKind };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  if (body.template !== 'direct_booking' && body.template !== 'digital_checkin') {
    return NextResponse.json(
      { error: 'template must be "direct_booking" or "digital_checkin"' },
      { status: 400 }
    );
  }

  const config = getTemplateConfig(body.template);

  // Step 1: Create the base Google Form
  const createRes = await fetch(FORMS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: config.title,
        documentTitle: config.documentTitle,
      },
    }),
  });

  const createdForm = await createRes.json();
  if (!createRes.ok || !createdForm.formId) {
    return NextResponse.json(
      { error: createdForm?.error?.message || 'Failed to create Google Form' },
      { status: createRes.status || 500 }
    );
  }

  const safeFormId = encodeURIComponent(String(createdForm.formId).trim());

  // Step 2: Populate description and hospitality questions via batchUpdate
  const requests = [
    {
      updateFormInfo: {
        info: {
          description: config.description,
        },
        updateMask: 'description',
      },
    },
    ...config.questions.map((q, idx) => buildCreateItemRequest(q, idx)),
  ];

  const batchRes = await fetch(`${FORMS_API_BASE}/${safeFormId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeFormInResponse: true,
      requests,
    }),
  });

  const updatedPayload = await batchRes.json();
  if (!batchRes.ok) {
    return NextResponse.json(
      {
        error:
          updatedPayload?.error?.message ||
          'Form created, but failed to add questions via batchUpdate.',
        formId: createdForm.formId,
      },
      { status: batchRes.status }
    );
  }

  const finalForm = updatedPayload.form ?? createdForm;
  return NextResponse.json({
    formId: finalForm.formId,
    title: finalForm.info?.title ?? config.title,
    description: finalForm.info?.description ?? config.description,
    responderUri: finalForm.responderUri ?? createdForm.responderUri ?? '',
    itemsCount: Array.isArray(finalForm.items) ? finalForm.items.length : config.questions.length,
  });
}
