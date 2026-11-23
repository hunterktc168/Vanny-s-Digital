'use client';

import React, { useMemo, useState } from 'react';
import { Check, Copy, Search, SlidersHorizontal } from 'lucide-react';
import { ChannelType, SCRIPT_TEMPLATES, ScriptTemplate } from '@/lib/action-plan-data';

const CHANNELS: Array<'All' | ChannelType> = [
  'All',
  'Telegram',
  'Facebook',
  'Instagram/TikTok',
  'Google Business',
  'OTA Follow-up',
];

export default function ScriptVaultView() {
  const [activeChannel, setActiveChannel] = useState<'All' | ChannelType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(SCRIPT_TEMPLATES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live merge variables for one-click personalized copy-paste
  const [guestName, setGuestName] = useState('');
  const [nightlyRate, setNightlyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');

  const filteredScripts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SCRIPT_TEMPLATES.filter((s) => {
      const matchesChannel = activeChannel === 'All' || s.channel === activeChannel;
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.hookAngle.toLowerCase().includes(q) ||
        s.bodyText.toLowerCase().includes(q);
      return matchesChannel && matchesQuery;
    });
  }, [activeChannel, searchQuery]);

  const activeScript: ScriptTemplate | undefined =
    filteredScripts.find((s) => s.id === selectedId) ?? filteredScripts[0];

  const renderInterpolatedBody = (raw: string): string => {
    let text = raw;
    if (guestName.trim()) {
      text = text.replaceAll('[Guest Name]', guestName.trim());
    }
    if (nightlyRate.trim()) {
      text = text.replaceAll('$[XX]', `$${nightlyRate.trim().replace(/^\$/, '')}`);
    }
    if (weeklyRate.trim()) {
      text = text.replaceAll('$[XXX]', `$${weeklyRate.trim().replace(/^\$/, '')}`);
    }
    if (bookingUrl.trim()) {
      text = text.replaceAll('[PASTE YOUR DIRECT BOOKING FORM LINK]', bookingUrl.trim());
    }
    return text;
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Hospitality Script &amp; Caption Workbench
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Select a script on the left, optionally personalize guest name or rates, and copy
              ready-to-send Telegram, Facebook, or OTA messages.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
            {filteredScripts.length} of {SCRIPT_TEMPLATES.length} templates
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {CHANNELS.map((channel) => {
              const active = activeChannel === channel;
              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setActiveChannel(channel)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {channel}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scripts, KHQR, Wi-Fi..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
            />
          </div>
        </div>
      </section>

      {filteredScripts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <p className="text-sm font-medium text-slate-900">No matching scripts found</p>
          <p className="text-xs text-slate-500">
            Try clearing your search filter or switching to &ldquo;All&rdquo; channels.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveChannel('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Master-Detail Split Workbench */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
          {/* Left Directory */}
          <aside className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 divide-y divide-slate-100 max-h-[540px] lg:max-h-[680px] overflow-y-auto">
            {filteredScripts.map((script) => {
              const isSelected = activeScript?.id === script.id;
              return (
                <button
                  key={script.id}
                  type="button"
                  onClick={() => setSelectedId(script.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer block ${
                    isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-teal-700">{script.channel}</span>
                    <span className="font-mono tabular-nums">Day 0{script.dayRef}</span>
                  </div>
                  <h2
                    className={`mt-1 text-sm font-semibold ${
                      isSelected ? 'text-teal-950' : 'text-slate-900'
                    }`}
                  >
                    {script.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {script.hookAngle}
                  </p>
                </button>
              );
            })}
          </aside>

          {/* Right Live Preview & Quick Personalization */}
          <div className="lg:col-span-7 flex flex-col">
            {activeScript && (
              <>
                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono tabular-nums font-medium text-slate-700">
                        Day 0{activeScript.dayRef}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-teal-700">{activeScript.channel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeScript.hookAngle}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {activeScript.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleCopy(
                        activeScript.id,
                        renderInterpolatedBody(activeScript.bodyText)
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start"
                  >
                    {copiedId === activeScript.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Ready Message</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Placeholder Fill Bar */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
                    <span>Optional Live Fill (auto-replaces placeholders below)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Guest name (e.g. Alex)"
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
                    />
                    <input
                      type="text"
                      value={nightlyRate}
                      onChange={(e) => setNightlyRate(e.target.value)}
                      placeholder="Nightly USD (e.g. 22)"
                      className="px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
                    />
                    <input
                      type="text"
                      value={weeklyRate}
                      onChange={(e) => setWeeklyRate(e.target.value)}
                      placeholder="Weekly/Mo USD (e.g. 140)"
                      className="px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
                    />
                    <input
                      type="text"
                      value={bookingUrl}
                      onChange={(e) => setBookingUrl(e.target.value)}
                      placeholder="Booking Form URL"
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
                    />
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800 block">Visual / Asset</span>
                      <span className="mt-0.5 block">{activeScript.visualInstruction}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Platform Setting / CTA
                      </span>
                      <span className="mt-0.5 block">{activeScript.settingOrButton}</span>
                    </div>
                  </div>

                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-5 leading-relaxed">
                    {renderInterpolatedBody(activeScript.bodyText)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
