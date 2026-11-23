'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageSquare,
  X,
} from 'lucide-react';
import { ACTION_PLAN_DAYS } from '@/lib/action-plan-data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import PlanOverviewView, { NavTab } from './PlanOverviewView';
import DailyPlanView from './DailyPlanView';
import ScriptVaultView from './ScriptVaultView';
import TtpMapExplorer from './TtpMapExplorer';
import FormsHubView, { ConnectedFormMeta } from './FormsHubView';
import GoogleFormModal, { GoogleFormModalType } from './GoogleFormModal';

const STORAGE_PROGRESS_KEY = 'vanny_ops_completed_tasks_v1';
const STORAGE_BOOKING_FORM_KEY = 'vanny_ops_booking_form_v1';
const STORAGE_CHECKIN_FORM_KEY = 'vanny_ops_checkin_form_v1';
const EMPTY_TASK_IDS: string[] = [];

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'plan', label: '7-Day Launch Plan', icon: CalendarCheck2 },
  { id: 'scripts', label: 'Script Vault', icon: MessageSquare },
  { id: 'map', label: 'TTP Map & Routes', icon: MapPin },
  { id: 'forms', label: 'Booking & Check-In', icon: FileSpreadsheet },
];

export default function DashboardShell({
  initialMapsApiKey,
}: {
  initialMapsApiKey: string;
}) {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [storedTaskIds, setStoredTaskIds, resetStoredTaskIds] =
    useLocalStorage<string[]>(STORAGE_PROGRESS_KEY, EMPTY_TASK_IDS);
  const [bookingForm, setBookingForm] =
    useLocalStorage<ConnectedFormMeta | null>(STORAGE_BOOKING_FORM_KEY, null);
  const [checkInForm, setCheckInForm] =
    useLocalStorage<ConnectedFormMeta | null>(STORAGE_CHECKIN_FORM_KEY, null);
  const [isGoogleAuthed, setIsGoogleAuthed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalType, setFormModalType] =
    useState<GoogleFormModalType>('direct_booking');

  const completedTaskIds = Array.isArray(storedTaskIds)
    ? storedTaskIds
    : EMPTY_TASK_IDS;

  const effectiveMapsApiKey =
    initialMapsApiKey ||
    (typeof globalThis !== 'undefined'
      ? ((globalThis as { GOOGLE_MAPS_API_KEY?: string }).GOOGLE_MAPS_API_KEY ?? '')
      : '');

  // Tier 1 Demo Key Quota Defense
  useEffect(() => {
    const win = window as unknown as { gm_authFailure?: () => void };
    win.gm_authFailure = () => {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    };

    const origError = console.error;
    console.error = (...args: unknown[]) => {
      origError.apply(console, args);
      const msg = args.map((a) => String(a)).join(' ');
      if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    };

    const handleQuotaEvent = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaEvent);

    return () => {
      console.error = origError;
      window.removeEventListener('gmp-quota-exceeded', handleQuotaEvent);
    };
  }, []);

  const handleToggleTask = (taskId: string) => {
    setStoredTaskIds((prev) => {
      const list = Array.isArray(prev) ? prev : EMPTY_TASK_IDS;
      return list.includes(taskId)
        ? list.filter((id) => id !== taskId)
        : [...list, taskId];
    });
  };

  const handleConfirmResetProgress = () => {
    resetStoredTaskIds();
    setShowResetModal(false);
  };

  const handleSaveBookingForm = (form: ConnectedFormMeta | null) => {
    setBookingForm(form);
  };

  const handleSaveCheckInForm = (form: ConnectedFormMeta | null) => {
    setCheckInForm(form);
  };

  const handleExportPlaybook = () => {
    const lines: string[] = [
      "# Vanny's Peaceful Guesthouse — 7-Day Digital Marketing & Operations Playbook",
      'Location: Toul Tom Pong (Russian Market), Phnom Penh, Cambodia',
      'Target Segment: Digital Nomads & Remote Workers',
      '',
    ];

    for (const day of ACTION_PLAN_DAYS) {
      lines.push(`## Day ${day.day}: ${day.title}`);
      lines.push(`**Primary Focus:** ${day.primaryFocus}`);
      lines.push(`**Channels:** ${day.targetChannel}`);
      lines.push('');
      lines.push('### Tasks');
      for (const task of day.tasks) {
        const mark = completedTaskIds.includes(task.id) ? '[x]' : '[ ]';
        lines.push(
          `- ${mark} (${task.category.toUpperCase()}) **${task.title}** — *${task.toolOrSetting}*: ${task.instructions}`
        );
      }
      lines.push('');
      lines.push(`**KPI / Deliverable:** ${day.kpiDeliverable}`);
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vannys-guesthouse-7-day-plan.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];
  const activeDayMeta =
    ACTION_PLAN_DAYS.find((d) => d.day === selectedDay) ?? ACTION_PLAN_DAYS[0];
  const formsConnectedCount = (bookingForm ? 1 : 0) + (checkInForm ? 1 : 0);

  const handleSelectPlanDay = (day: number) => {
    setSelectedDay(day);
    setActiveTab('plan');
    setMobileMenuOpen(false);
  };

  const openFormModal = (kind: GoogleFormModalType = 'direct_booking') => {
    setFormModalType(kind);
    setFormModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Required Demo Key Quota Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar (272px) */}
        <aside className="hidden lg:flex lg:w-[272px] lg:shrink-0 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3 h-16">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-display text-xs font-bold tracking-tight shrink-0">
              VP
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold tracking-tight text-slate-900 block truncate">
                Vanny&apos;s Guesthouse
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                Toul Tom Pong · Phnom Penh
              </span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-5 overflow-y-auto" aria-label="Dashboard sections">
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-medium text-slate-400">
                Workspace
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-teal-50/90 text-teal-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === 'overview' ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <span>Overview</span>
              </button>
            </div>

            {/* 7-Day Plan Sidebar Navigation */}
            <div className="space-y-1">
              <div className="px-3 pb-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>7-Day Launch Plan</span>
                </button>
                <span className="text-[10px] font-mono tabular-nums text-slate-400">
                  D1–D7
                </span>
              </div>
              <div className="space-y-0.5" role="list" aria-label="7-Day Plan Days">
                {ACTION_PLAN_DAYS.map((dayItem) => {
                  const isCurrentDay = activeTab === 'plan' && selectedDay === dayItem.day;
                  const doneCount = dayItem.tasks.filter((t) =>
                    completedTaskIds.includes(t.id)
                  ).length;
                  const totalCount = dayItem.tasks.length;
                  const allDone = doneCount === totalCount && totalCount > 0;

                  return (
                    <button
                      key={dayItem.day}
                      type="button"
                      onClick={() => handleSelectPlanDay(dayItem.day)}
                      aria-current={isCurrentDay ? 'page' : undefined}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer group ${
                        isCurrentDay
                          ? 'bg-teal-50/90 text-teal-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`font-mono tabular-nums text-[11px] font-semibold shrink-0 ${
                            isCurrentDay
                              ? 'text-teal-700'
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        >
                          D{dayItem.day}
                        </span>
                        <span className="text-xs font-medium truncate">
                          {dayItem.primaryFocus}
                        </span>
                      </div>
                      {allDone ? (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isCurrentDay ? 'text-teal-700' : 'text-emerald-600'
                          }`}
                        />
                      ) : (
                        <span
                          className={`font-mono tabular-nums text-[11px] shrink-0 ${
                            isCurrentDay ? 'text-teal-700' : 'text-slate-400'
                          }`}
                        >
                          {doneCount}/{totalCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-medium text-slate-400">
                Operations &amp; Tools
              </p>
              {NAV_ITEMS.slice(2).map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-teal-50/90 text-teal-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-teal-700' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => openFormModal('direct_booking')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium text-teal-800 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/70 transition-colors cursor-pointer whitespace-nowrap mt-2"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 shrink-0 text-teal-700" />
                  <span className="truncate">Open Guest Forms</span>
                </span>
                <span className="font-mono tabular-nums text-[11px] text-teal-700 shrink-0">
                  {formsConnectedCount}/2
                </span>
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-3 text-xs text-slate-600 bg-slate-50/60">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">7-Day Progress</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {completedTaskIds.length}/
                  {ACTION_PLAN_DAYS.reduce((s, d) => s + d.tasks.length, 0)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-700 transition-all duration-200"
                  style={{
                    width: `${Math.round(
                      (completedTaskIds.length /
                        Math.max(
                          1,
                          ACTION_PLAN_DAYS.reduce((s, d) => s + d.tasks.length, 0)
                        )) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
              <span>Google Forms</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {formsConnectedCount}/2 active
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col z-10 overflow-y-auto">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-teal-700 text-white flex items-center justify-center font-display text-xs font-bold">
                    VP
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    Vanny&apos;s Guesthouse
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="p-3 space-y-5 flex-1">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('overview');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      activeTab === 'overview'
                        ? 'bg-teal-50 text-teal-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Overview</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="px-3 pb-1 text-[11px] font-medium text-slate-400">
                    7-Day Launch Plan
                  </p>
                  {ACTION_PLAN_DAYS.map((dayItem) => {
                    const isCurrentDay =
                      activeTab === 'plan' && selectedDay === dayItem.day;
                    const doneCount = dayItem.tasks.filter((t) =>
                      completedTaskIds.includes(t.id)
                    ).length;
                    return (
                      <button
                        key={dayItem.day}
                        type="button"
                        onClick={() => handleSelectPlanDay(dayItem.day)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isCurrentDay
                            ? 'bg-teal-50 text-teal-900'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono tabular-nums text-[11px] font-semibold text-teal-700 shrink-0">
                            D{dayItem.day}
                          </span>
                          <span className="text-xs font-medium truncate">
                            {dayItem.primaryFocus}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                          {doneCount}/{dayItem.tasks.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <p className="px-3 pb-1 text-[11px] font-medium text-slate-400">
                    Operations &amp; Tools
                  </p>
                  {NAV_ITEMS.slice(2).map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-teal-50 text-teal-800'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => openFormModal('direct_booking')}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium text-teal-800 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200/70 transition-colors cursor-pointer mt-2"
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="w-4 h-4 shrink-0 text-teal-700" />
                      <span>Open Guest Forms</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-teal-700">
                      {formsConnectedCount}/2
                    </span>
                  </button>
                </div>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm truncate">
                <span className="text-slate-500 hidden sm:inline">
                  Vanny&apos;s Peaceful Guesthouse
                </span>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <span className="font-medium text-slate-900 truncate">
                  {activeTab === 'plan'
                    ? `Day 0${activeDayMeta.day}: ${activeDayMeta.primaryFocus}`
                    : activeNavMeta.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => openFormModal('direct_booking')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Guest Forms Modal</span>
              </button>
              <button
                type="button"
                onClick={handleExportPlaybook}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">Export Playbook</span>
              </button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab === 'plan' ? `plan-day-${selectedDay}` : activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'overview' && (
                  <PlanOverviewView
                    completedTaskIds={completedTaskIds}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                    onNavigate={setActiveTab}
                    formsConnectedCount={formsConnectedCount}
                    isGoogleAuthed={isGoogleAuthed}
                  />
                )}

                {activeTab === 'plan' && (
                  <DailyPlanView
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                    completedTaskIds={completedTaskIds}
                    onToggleTask={handleToggleTask}
                    onRequestReset={() => setShowResetModal(true)}
                  />
                )}

                {activeTab === 'scripts' && <ScriptVaultView />}

                {activeTab === 'map' && <TtpMapExplorer apiKey={effectiveMapsApiKey} />}

                {activeTab === 'forms' && (
                  <FormsHubView
                    bookingForm={bookingForm}
                    checkInForm={checkInForm}
                    onSaveBookingForm={handleSaveBookingForm}
                    onSaveCheckInForm={handleSaveCheckInForm}
                    onAuthChange={setIsGoogleAuthed}
                    onOpenFormModal={openFormModal}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Confirm Progress Reset Modal */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2.5 text-slate-900">
              <ClipboardList className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-semibold">Reset 7-Day Task Progress?</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This clears all completed checkmarks across Day 1 through Day 7 on this browser.
              Your connected Google Forms and responses remain untouched.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetProgress}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer"
              >
                Reset Checkmarks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Google Form Modal (Direct Booking & Digital Check-in) */}
      <GoogleFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        initialFormType={formModalType}
        bookingForm={bookingForm}
        checkInForm={checkInForm}
        onConfigureForms={() => setActiveTab('forms')}
      />
    </div>
  );
}
