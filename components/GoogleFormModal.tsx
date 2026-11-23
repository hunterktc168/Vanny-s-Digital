'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Copy,
  ExternalLink,
  FilePlus2,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import type { ConnectedFormMeta } from './FormsHubView';

export type GoogleFormModalType = 'direct_booking' | 'digital_checkin';

interface GoogleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormType?: GoogleFormModalType;
  bookingForm: ConnectedFormMeta | null;
  checkInForm: ConnectedFormMeta | null;
  onConfigureForms?: () => void;
}

function buildEmbeddedFormUrl(rawUri?: string | null): string | null {
  if (!rawUri) return null;
  try {
    const parsed = new URL(rawUri.trim());
    if (parsed.protocol !== 'https:') return null;
    if (
      parsed.hostname !== 'docs.google.com' &&
      !parsed.hostname.endsWith('.google.com')
    ) {
      return null;
    }
    parsed.searchParams.set('embedded', 'true');
    return parsed.toString();
  } catch {
    return null;
  }
}

function GoogleFormModalInner({
  onClose,
  initialFormType = 'direct_booking',
  bookingForm,
  checkInForm,
  onConfigureForms,
}: Omit<GoogleFormModalProps, 'isOpen'>) {
  const [selectedType, setSelectedType] =
    useState<GoogleFormModalType>(initialFormType);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const activeForm =
    selectedType === 'direct_booking' ? bookingForm : checkInForm;
  const activeLabel =
    selectedType === 'direct_booking' ? 'Direct Booking' : 'Digital Check-in';
  const embeddedUrl = buildEmbeddedFormUrl(activeForm?.responderUri);
  const isIframeLoading = Boolean(embeddedUrl && loadedUrl !== embeddedUrl);

  const handleCopyUrl = async () => {
    if (!activeForm?.responderUri) return;
    try {
      await navigator.clipboard.writeText(activeForm.responderUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-form-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-4xl h-[86vh] max-h-[820px] bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="google-form-modal-title"
                className="text-sm font-semibold text-slate-900 truncate"
              >
                {activeForm?.title || `Vanny's Guesthouse — ${activeLabel}`}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {activeForm
                  ? `${activeLabel} · ${activeForm.itemsCount} questions · Embedded Google Form`
                  : `${activeLabel} · Google Form not provisioned yet`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 shrink-0">
            {/* Switcher between Direct Booking & Digital Check-in */}
            <div
              role="tablist"
              aria-label="Google Form type"
              className="inline-flex items-center bg-slate-100 p-1 rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedType === 'direct_booking'}
                onClick={() => setSelectedType('direct_booking')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedType === 'direct_booking'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Direct Booking
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedType === 'digital_checkin'}
                onClick={() => setSelectedType('digital_checkin')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedType === 'digital_checkin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Digital Check-in
              </button>
            </div>

            {activeForm?.responderUri && (
              <>
                <button
                  type="button"
                  onClick={() => void handleCopyUrl()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
                <a
                  href={activeForm.responderUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <span>New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Google Form modal"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Google Form Iframe or Provisioning Empty State */}
        <div className="flex-1 min-h-0 relative bg-slate-50">
          {embeddedUrl ? (
            <>
              {isIframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/90 z-10 pointer-events-none">
                  <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />
                  <span className="text-xs font-medium text-slate-600">
                    Loading {activeLabel} Google Form...
                  </span>
                </div>
              )}
              <iframe
                key={embeddedUrl}
                src={embeddedUrl}
                title={`Vanny's Peaceful Guesthouse ${activeLabel} Google Form`}
                className="w-full h-full border-0 bg-white"
                onLoad={() => setLoadedUrl(embeddedUrl)}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-4 bg-white border border-slate-200 rounded-xl p-8">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-slate-900">
                    {activeLabel} Form Not Connected Yet
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedType === 'direct_booking'
                      ? 'Create or link your Direct Nomad Booking Request Google Form in the Booking & Check-In Hub to embed and test submissions right here.'
                      : 'Create or link your Digital Pre-Arrival Check-In Google Form in the Booking & Check-In Hub to preview and launch check-ins from anywhere.'}
                  </p>
                </div>
                {onConfigureForms && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onConfigureForms();
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    <span>Set Up in Booking &amp; Check-In Hub</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500 shrink-0">
          <span className="font-mono truncate">
            {activeForm?.responderUri || 'No responder URL configured yet'}
          </span>
          <span className="shrink-0">
            Tip: Use <span className="font-medium text-slate-700">New Tab</span>{' '}
            if your Google Workspace policy restricts iframe embedding.
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default function GoogleFormModal({
  isOpen,
  onClose,
  initialFormType = 'direct_booking',
  bookingForm,
  checkInForm,
  onConfigureForms,
}: GoogleFormModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <GoogleFormModalInner
          key={initialFormType}
          onClose={onClose}
          initialFormType={initialFormType}
          bookingForm={bookingForm}
          checkInForm={checkInForm}
          onConfigureForms={onConfigureForms}
        />
      )}
    </AnimatePresence>
  );
}
