'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  Copy,
  ExternalLink,
  FilePlus2,
  FileText,
  Link2,
  LogOut,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  getFormsAccessToken,
  initFormsAuth,
  signInWithGoogleForms,
  signOutGoogleForms,
} from '@/lib/firebase-forms-auth';

export interface ConnectedFormMeta {
  formId: string;
  title: string;
  description: string;
  responderUri: string;
  itemsCount: number;
}

interface NormalizedResponseRow {
  responseId: string;
  submittedAt: string;
  respondentEmail: string;
  fieldValues: Record<string, string>;
}

interface FormResponsesPayload {
  formId: string;
  title: string;
  responderUri: string;
  questions: Array<{ questionId: string; title: string }>;
  responses: NormalizedResponseRow[];
}

interface FormsHubViewProps {
  bookingForm: ConnectedFormMeta | null;
  checkInForm: ConnectedFormMeta | null;
  onSaveBookingForm: (form: ConnectedFormMeta | null) => void;
  onSaveCheckInForm: (form: ConnectedFormMeta | null) => void;
  onAuthChange: (authed: boolean) => void;
  onOpenFormModal?: (kind: 'direct_booking' | 'digital_checkin') => void;
}

export default function FormsHubView({
  bookingForm,
  checkInForm,
  onSaveBookingForm,
  onSaveCheckInForm,
  onAuthChange,
  onOpenFormModal,
}: FormsHubViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [pendingCreateKind, setPendingCreateKind] = useState<
    'direct_booking' | 'digital_checkin' | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [manualSlot, setManualSlot] = useState<'direct_booking' | 'digital_checkin'>(
    'direct_booking'
  );
  const [manualFormId, setManualFormId] = useState('');
  const [isConnectingManual, setIsConnectingManual] = useState(false);

  const [activeResponseTab, setActiveResponseTab] = useState<
    'direct_booking' | 'digital_checkin'
  >('direct_booking');
  const [responsesData, setResponsesData] = useState<FormResponsesPayload | null>(null);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [responsesError, setResponsesError] = useState<string | null>(null);
  const [responseSearch, setResponseSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [otaNightlyUsd, setOtaNightlyUsd] = useState<string>('25');
  const [stayNights, setStayNights] = useState<string>('7');

  useEffect(() => {
    const unsub = initFormsAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
        onAuthChange(true);
      },
      (maybeUser) => {
        setUser(maybeUser);
        setNeedsAuth(true);
        onAuthChange(false);
      }
    );
    return () => unsub();
  }, [onAuthChange]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogleForms();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        onAuthChange(true);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleForms();
    setUser(null);
    setNeedsAuth(true);
    setResponsesData(null);
    onAuthChange(false);
  };

  const latestResponsesReqRef = useRef(0);

  const parseResponseJson = async (res: Response) => {
    const raw = await res.text();
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const loadResponses = useCallback(async (formId: string) => {
    const token = getFormsAccessToken();
    if (!token || !formId) return;

    const reqId = ++latestResponsesReqRef.current;
    setIsLoadingResponses(true);
    setResponsesError(null);
    try {
      const res = await fetch(
        `/api/forms/responses?formId=${encodeURIComponent(formId.trim())}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await parseResponseJson(res);
      if (reqId !== latestResponsesReqRef.current) return;

      if (!res.ok) {
        if (res.status === 401) {
          setNeedsAuth(true);
          onAuthChange(false);
        }
        throw new Error(data.error || 'Could not load responses.');
      }
      setResponsesData(data as FormResponsesPayload);
    } catch (err) {
      if (reqId !== latestResponsesReqRef.current) return;
      setResponsesError(
        err instanceof Error ? err.message : 'Failed to load form submissions.'
      );
    } finally {
      if (reqId === latestResponsesReqRef.current) {
        setIsLoadingResponses(false);
      }
    }
  }, [onAuthChange]);

  const activeForm =
    activeResponseTab === 'direct_booking' ? bookingForm : checkInForm;

  useEffect(() => {
    let active = true;
    const formId = activeForm?.formId;
    queueMicrotask(() => {
      if (!active) return;
      if (!needsAuth && formId) {
        void loadResponses(formId);
      } else {
        setResponsesData(null);
      }
    });
    return () => {
      active = false;
    };
  }, [needsAuth, activeForm?.formId, loadResponses]);

  const handleConfirmCreateForm = async () => {
    if (!pendingCreateKind) return;
    const token = getFormsAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setPendingCreateKind(null);
      return;
    }

    setIsCreating(true);
    setActionError(null);
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template: pendingCreateKind }),
      });
      const data = await parseResponseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create Google Form.');
      }

      if (pendingCreateKind === 'direct_booking') {
        onSaveBookingForm(data as ConnectedFormMeta);
        setActiveResponseTab('direct_booking');
      } else {
        onSaveCheckInForm(data as ConnectedFormMeta);
        setActiveResponseTab('digital_checkin');
      }
      setPendingCreateKind(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Error creating Google Form.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectExistingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getFormsAccessToken();
    const trimmed = manualFormId.trim();
    if (!token || !trimmed) return;

    setIsConnectingManual(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/forms?formId=${encodeURIComponent(trimmed)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await parseResponseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Could not locate form with that ID.');
      }

      if (manualSlot === 'direct_booking') {
        onSaveBookingForm(data as ConnectedFormMeta);
        setActiveResponseTab('direct_booking');
      } else {
        onSaveCheckInForm(data as ConnectedFormMeta);
        setActiveResponseTab('digital_checkin');
      }
      setManualFormId('');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to connect existing form.'
      );
    } finally {
      setIsConnectingManual(false);
    }
  };

  const handleCopyLink = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const parsedOtaRate = Math.max(1, Number.parseFloat(otaNightlyUsd) || 0);
  const parsedNights = Math.max(1, Number.parseInt(stayNights, 10) || 1);
  const directNightlyUsd = Math.round(parsedOtaRate * 0.88 * 100) / 100;
  const otaTotalUsd = Math.round(parsedOtaRate * parsedNights * 100) / 100;
  const directTotalUsd = Math.round(directNightlyUsd * parsedNights * 100) / 100;
  const guestSavingsUsd = Math.round((otaTotalUsd - directTotalUsd) * 100) / 100;
  const depositUsd = directNightlyUsd;
  const depositKhr = Math.round(depositUsd * 4050);

  const khqrQuoteText = [
    `Vanny's Peaceful Guesthouse (Toul Tom Pong) — Direct Nomad Quote`,
    `• Stay: ${parsedNights} night${parsedNights === 1 ? '' : 's'}`,
    `• Direct Rate (12% off OTA $${parsedOtaRate.toFixed(0)}/nt): $${directNightlyUsd.toFixed(2)}/night`,
    `• Direct Total: $${directTotalUsd.toFixed(2)} (You save $${guestSavingsUsd.toFixed(2)} vs. OTA $${otaTotalUsd.toFixed(2)})`,
    `• 1-Night ABA Pay / KHQR Deposit: $${depositUsd.toFixed(2)} (~${depositKhr.toLocaleString('en-US')} KHR)`,
    bookingForm?.responderUri
      ? `• Direct Booking Form: ${bookingForm.responderUri}`
      : `• Reply here on Telegram with your dates & room preference to receive our ABA KHQR code.`,
  ].join('\n');

  const filteredResponses =
    responsesData?.responses.filter((row) => {
      const q = responseSearch.trim().toLowerCase();
      if (!q) return true;
      const allText = [
        row.respondentEmail,
        row.submittedAt,
        ...Object.values(row.fieldValues),
      ]
        .join(' ')
        .toLowerCase();
      return allText.includes(q);
    }) ?? [];

  return (
    <div className="space-y-6">
      {/* Header & Google Sign-In Control */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-teal-700">Direct Booking Funnel</span>
            <span aria-hidden="true">·</span>
            <span>Google Forms &amp; ABA KHQR</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Direct Booking &amp; Digital Check-In Hub
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Quote direct 12%-off nomad rates with 1-night ABA Pay / KHQR deposits, provision live
            Google Forms for booking &amp; pre-arrival check-in, and inspect submissions in real
            time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {needsAuth ? (
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-900">
                  {user?.displayName || 'Google Workspace User'}
                </p>
                <p className="text-[11px] text-emerald-700">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {(authError || actionError) && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-3 text-xs font-medium">
          {authError || actionError}
        </div>
      )}

      {/* ABA Pay / KHQR Direct Savings & Deposit Calculator (Available Offline & Pre-Auth) */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              ABA Pay / KHQR Direct Savings &amp; Deposit Calculator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare Booking.com / Agoda pricing against your 12% direct Telegram quote and
              compute the 1-night KHQR deposit.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyLink('khqr-quote', khqrQuoteText)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            {copiedKey === 'khqr-quote' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied KHQR Quote</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy KHQR Quote</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Inputs */}
          <div className="lg:col-span-4 p-5 grid grid-cols-2 gap-4 bg-slate-50/40">
            <div>
              <label
                htmlFor="ota-nightly-input"
                className="block text-[11px] font-medium text-slate-600 mb-1.5"
              >
                OTA Nightly Rate (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  $
                </span>
                <input
                  id="ota-nightly-input"
                  type="number"
                  min={1}
                  step={1}
                  value={otaNightlyUsd}
                  onChange={(e) => setOtaNightlyUsd(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="stay-nights-input"
                className="block text-[11px] font-medium text-slate-600 mb-1.5"
              >
                Length of Stay (Nights)
              </label>
              <input
                id="stay-nights-input"
                type="number"
                min={1}
                step={1}
                value={stayNights}
                onChange={(e) => setStayNights(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
          </div>

          {/* Hairline-Divided Outputs */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-5">
              <p className="text-[11px] font-medium text-slate-500">
                Direct Nightly Rate (12% Off)
              </p>
              <p className="mt-1.5 text-xl font-semibold font-mono tabular-nums text-slate-900">
                ${directNightlyUsd.toFixed(2)}
                <span className="text-xs font-sans font-normal text-slate-500"> / nt</span>
              </p>
              <p className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
                vs. ${parsedOtaRate.toFixed(2)} on OTA
              </p>
            </div>

            <div className="p-5">
              <p className="text-[11px] font-medium text-slate-500">
                Direct Total ({parsedNights}n) &amp; Savings
              </p>
              <p className="mt-1.5 text-xl font-semibold font-mono tabular-nums text-teal-700">
                ${directTotalUsd.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] font-mono tabular-nums text-emerald-700 font-medium">
                Saves guest ${guestSavingsUsd.toFixed(2)} vs. ${otaTotalUsd.toFixed(2)}
              </p>
            </div>

            <div className="p-5">
              <p className="text-[11px] font-medium text-slate-500">
                1-Night ABA Pay / KHQR Deposit
              </p>
              <p className="mt-1.5 text-xl font-semibold font-mono tabular-nums text-slate-900">
                ${depositUsd.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
                &asymp; {depositKhr.toLocaleString('en-US')} KHR (4,050/$1)
              </p>
            </div>
          </div>
        </div>
      </section>

      {needsAuth ? (
        <section className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4">
          <FilePlus2 className="w-8 h-8 text-teal-700 mx-auto" />
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base font-semibold text-slate-900">
              Connect Google Forms to Provision &amp; Track Reservations
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in with Google above to create your Direct Booking Request and Digital
              Pre-Arrival Check-In forms in your Google account, generate printable QR cards, and
              review incoming guest responses.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Two Form Cards: Direct Booking + Digital Check-In */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Direct Booking Form Card */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-teal-700">Day 02 Deliverable</p>
                  <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                    Direct Nomad Booking Request Form
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Captures check-in/out dates, Telegram handle, room desk choice, airport
                    tuk-tuk, and ABA Pay / KHQR deposit notes.
                  </p>
                </div>
              </div>

              {bookingForm ? (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-700">
                      Connected · {bookingForm.itemsCount} questions
                    </p>
                    <p className="text-xs font-mono text-slate-500 truncate">
                      ID: {bookingForm.formId}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {bookingForm.responderUri && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyLink('booking-uri', bookingForm.responderUri)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 cursor-pointer"
                          >
                            {copiedKey === 'booking-uri' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied Link</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Booking Link</span>
                              </>
                            )}
                          </button>
                          {onOpenFormModal && (
                            <button
                              type="button"
                              onClick={() => onOpenFormModal('direct_booking')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-teal-700" />
                              <span>Preview Modal</span>
                            </button>
                          )}
                          <a
                            href={bookingForm.responderUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <span>Open Form</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onSaveBookingForm(null)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                  {bookingForm.responderUri && (
                    <div className="p-2 bg-white border border-slate-200 rounded-lg shrink-0">
                      <QRCodeSVG value={bookingForm.responderUri} size={84} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPendingCreateKind('direct_booking')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    <span>Create Direct Booking Google Form</span>
                  </button>
                </div>
              )}
            </section>

            {/* Digital Check-In Form Card */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-teal-700">Day 03 Deliverable</p>
                  <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                    Digital Pre-Arrival Check-In Form
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Captures guest passport registration details, arrival flight/ETA, quiet-floor
                    preference, and ABA KHQR balance method.
                  </p>
                </div>
              </div>

              {checkInForm ? (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-700">
                      Connected · {checkInForm.itemsCount} questions
                    </p>
                    <p className="text-xs font-mono text-slate-500 truncate">
                      ID: {checkInForm.formId}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {checkInForm.responderUri && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyLink('checkin-uri', checkInForm.responderUri)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 cursor-pointer"
                          >
                            {copiedKey === 'checkin-uri' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied Link</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Check-In Link</span>
                              </>
                            )}
                          </button>
                          {onOpenFormModal && (
                            <button
                              type="button"
                              onClick={() => onOpenFormModal('digital_checkin')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-teal-700" />
                              <span>Preview Modal</span>
                            </button>
                          )}
                          <a
                            href={checkInForm.responderUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <span>Open Form</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onSaveCheckInForm(null)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                  {checkInForm.responderUri && (
                    <div className="p-2 bg-white border border-slate-200 rounded-lg shrink-0">
                      <QRCodeSVG value={checkInForm.responderUri} size={84} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPendingCreateKind('digital_checkin')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    <span>Create Digital Check-In Google Form</span>
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Connect Existing Google Form by ID */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <form
              onSubmit={handleConnectExistingForm}
              className="flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 shrink-0">
                <Link2 className="w-4 h-4 text-teal-700" />
                <span>Already have a Google Form?</span>
              </div>
              <select
                aria-label="Form slot"
                value={manualSlot}
                onChange={(e) =>
                  setManualSlot(e.target.value as 'direct_booking' | 'digital_checkin')
                }
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="direct_booking">Assign to Direct Booking</option>
                <option value="digital_checkin">Assign to Digital Check-In</option>
              </select>
              <input
                type="text"
                value={manualFormId}
                onChange={(e) => setManualFormId(e.target.value)}
                placeholder="Paste Google Form ID (from /forms/d/<FORM_ID>/edit)"
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
              <button
                type="submit"
                disabled={isConnectingManual || !manualFormId.trim()}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {isConnectingManual ? 'Connecting...' : 'Connect Form ID'}
              </button>
            </form>
          </section>

          {/* Live Responses Table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setActiveResponseTab('direct_booking')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap ${
                    activeResponseTab === 'direct_booking'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Direct Booking Submissions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResponseTab('digital_checkin')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap ${
                    activeResponseTab === 'digital_checkin'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Digital Check-In Submissions
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={responseSearch}
                    onChange={(e) => setResponseSearch(e.target.value)}
                    placeholder="Filter guest responses..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                {activeForm && (
                  <button
                    type="button"
                    onClick={() => void loadResponses(activeForm.formId)}
                    disabled={isLoadingResponses}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoadingResponses ? 'animate-spin' : ''}`}
                    />
                    <span>Refresh</span>
                  </button>
                )}
              </div>
            </div>

            {!activeForm ? (
              <div className="p-10 text-center text-xs text-slate-500">
                Create or connect a{' '}
                {activeResponseTab === 'direct_booking' ? 'Direct Booking' : 'Digital Check-In'}{' '}
                Google Form above to inspect live guest submissions here.
              </div>
            ) : responsesError ? (
              <div className="p-6 text-xs text-red-700">{responsesError}</div>
            ) : isLoadingResponses ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-9 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm font-medium text-slate-800">No guest submissions yet</p>
                <p className="text-xs text-slate-500">
                  Share the form link or QR code in Telegram and Facebook to start receiving{' '}
                  {activeResponseTab === 'direct_booking' ? 'direct booking requests' : 'check-ins'}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                      <th className="py-3 px-4 whitespace-nowrap">Submitted</th>
                      {responsesData?.questions.map((q) => (
                        <th key={q.questionId} className="py-3 px-4 max-w-[200px] truncate whitespace-nowrap">
                          {q.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredResponses.map((resp) => (
                      <tr key={resp.responseId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {resp.submittedAt
                            ? new Date(resp.submittedAt).toLocaleDateString()
                            : '—'}
                        </td>
                        {responsesData?.questions.map((q) => (
                          <td
                            key={q.questionId}
                            className="py-3 px-4 text-slate-800 max-w-[220px] truncate"
                            title={resp.fieldValues[q.questionId] || ''}
                          >
                            {resp.fieldValues[q.questionId] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Explicit Confirmation Modal Before Creating a Google Form */}
      {pendingCreateKind && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">
              Confirm Google Form Creation
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will create a new live Google Form in your connected Google account (
              <span className="font-medium text-slate-900">{user?.email}</span>):
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1">
              <p className="font-semibold text-slate-900">
                {pendingCreateKind === 'direct_booking'
                  ? "Vanny's Peaceful Guesthouse — Direct Nomad Booking Request"
                  : "Vanny's Peaceful Guesthouse — Digital Pre-Arrival Check-In"}
              </p>
              <p className="text-slate-600">
                {pendingCreateKind === 'direct_booking'
                  ? 'Includes 8 tailored questions: Full Name, Telegram/WhatsApp, Email, Check-In/Out Dates, Room & Desk Preference, Airport Tuk-Tuk Pickup, and Remote Work / KHQR Notes.'
                  : 'Includes 7 tailored questions: Guest Name, Passport & Nationality, Telegram Handle, Arrival Date, Estimated Arrival Time, Quiet Room Preferences, and ABA KHQR Payment Status.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingCreateKind(null)}
                disabled={isCreating}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCreateForm()}
                disabled={isCreating}
                className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
              >
                {isCreating ? 'Creating Form...' : 'Confirm & Create Form'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
