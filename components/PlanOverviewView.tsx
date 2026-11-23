'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { ACTION_PLAN_DAYS, SCRIPT_TEMPLATES } from '@/lib/action-plan-data';
import courtyardImg from '@/src/assets/images/guesthouse_courtyard_1795430020156.jpg';

export type NavTab =
  | 'overview'
  | 'plan'
  | 'scripts'
  | 'map'
  | 'neighborhood'
  | 'forms';

interface PlanOverviewViewProps {
  completedTaskIds: string[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onNavigate: (tab: NavTab) => void;
  formsConnectedCount: number;
  isGoogleAuthed: boolean;
}

export default function PlanOverviewView({
  completedTaskIds,
  selectedDay,
  onSelectDay,
  onNavigate,
  formsConnectedCount,
  isGoogleAuthed,
}: PlanOverviewViewProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const allTasks = ACTION_PLAN_DAYS.flatMap((d) => d.tasks);
  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter((t) => completedTaskIds.includes(t.id)).length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const digitizationTasks = allTasks.filter((t) => t.category === 'digitization');
  const digitizationDone = digitizationTasks.filter((t) =>
    completedTaskIds.includes(t.id)
  ).length;

  const marketingTasks = allTasks.filter((t) => t.category === 'marketing');
  const marketingDone = marketingTasks.filter((t) =>
    completedTaskIds.includes(t.id)
  ).length;

  const currentFocusDay =
    ACTION_PLAN_DAYS.find((d) =>
      d.tasks.some((t) => !completedTaskIds.includes(t.id))
    ) ?? ACTION_PLAN_DAYS[0];

  return (
    <div className="space-y-6">
      {/* Asymmetric 2-Column Executive Hero Brief */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-teal-700">Toul Tom Pong, Phnom Penh</span>
              <span aria-hidden="true">·</span>
              <span>Digital Nomads &amp; Remote Workers</span>
              <span aria-hidden="true">·</span>
              <span>Zero-Cost Stack</span>
            </div>

            <h1 className="text-2xl md:text-[30px] font-semibold text-slate-900 tracking-tight leading-tight text-balance">
              Vanny&apos;s Peaceful Guesthouse 7-Day Digital Launch
            </h1>

            <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed max-w-xl">
              Transition guest acquisition from high-commission OTAs to direct Telegram and ABA
              Pay / KHQR bookings—combining verified fiber Wi-Fi proof, Toul Tom Pong map
              discovery, and frictionless Google Forms check-in.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onSelectDay(currentFocusDay.day);
                onNavigate('plan');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>
                {completedCount === totalTasks
                  ? 'Review Day 07'
                  : `Continue Day 0${currentFocusDay.day}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>TTP Map &amp; Routes</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('forms')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-700" />
              <span>Booking Forms</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200">
          {!heroImgFailed ? (
            <Image
              src={courtyardImg}
              alt="Vanny's Peaceful Guesthouse courtyard workspace in Toul Tom Pong"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
              referrerPolicy="no-referrer"
              priority
              onError={() => setHeroImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-500">
              <Building2 className="w-8 h-8 mb-2 text-slate-400" />
              <span className="text-xs font-medium">Vanny&apos;s Peaceful Guesthouse</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-5 right-5 text-white space-y-0.5 pointer-events-none">
            <p className="text-[11px] font-mono uppercase tracking-wider text-teal-200">
              Target Positioning
            </p>
            <p className="text-sm font-medium leading-snug">
              Quiet courtyard refuge &amp; dedicated teak work desks near Russian Market
            </p>
          </div>
        </div>
      </section>

      {/* Unified Hairline-Divided 4-Column Operational KPI Strip */}
      <section className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>7-Day Execution</span>
            <span className="font-mono tabular-nums text-slate-700">
              {completedCount}/{totalTasks}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {progressPct}%
            </span>
            <span className="text-xs text-slate-500">complete</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-700 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Digitization Systems</span>
            <span className="font-mono tabular-nums text-slate-700">Ops</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {digitizationDone}/{digitizationTasks.length}
            </span>
            <span className="text-xs text-slate-500">configured</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 truncate">
            Telegram · GBP · KHQR · Google Forms
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Marketing Rollout</span>
            <span className="font-mono tabular-nums text-slate-700">
              {SCRIPT_TEMPLATES.length} scripts
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {marketingDone}/{marketingTasks.length}
            </span>
            <span className="text-xs text-slate-500">published</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 truncate">
            FB Groups · Reels/TikTok · TTP Cafés
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Google Forms Hub</span>
            <span
              className={`text-xs font-medium ${
                isGoogleAuthed ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isGoogleAuthed ? 'Connected' : 'Sign-in Needed'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {formsConnectedCount}/2
            </span>
            <span className="text-xs text-slate-500">forms active</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 truncate">
            Direct Booking &amp; Digital Check-In
          </p>
        </div>
      </section>

      {/* Chronological Day 1 - Day 7 Execution Matrix */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              7-Day Chronological Rollout Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any day row to open step-by-step digitization settings, content hooks, and
              deliverables.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Selected: Day 0{selectedDay}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 px-6 whitespace-nowrap">Day</th>
                <th className="py-3 px-4">Primary Focus &amp; Deliverable</th>
                <th className="py-3 px-4 hidden md:table-cell">Core Channels</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Progress</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-6 text-right whitespace-nowrap">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {ACTION_PLAN_DAYS.map((dayItem) => {
                const doneCount = dayItem.tasks.filter((t) =>
                  completedTaskIds.includes(t.id)
                ).length;
                const total = dayItem.tasks.length;
                const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
                const isComplete = doneCount === total && total > 0;
                const isInProgress = doneCount > 0 && doneCount < total;

                return (
                  <tr
                    key={dayItem.day}
                    onClick={() => {
                      onSelectDay(dayItem.day);
                      onNavigate('plan');
                    }}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-6 font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                      Day 0{dayItem.day}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 group-hover:text-teal-800 transition-colors">
                        {dayItem.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {dayItem.kpiDeliverable}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-600">
                      {dayItem.targetChannel}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full transition-all duration-200 ${
                              isComplete ? 'bg-emerald-600' : 'bg-teal-700'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums text-xs text-slate-700">
                          {doneCount}/{total}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <Circle className="w-3.5 h-3.5" />
                          <span>In Progress</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Circle className="w-3.5 h-3.5" />
                          <span>Scheduled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <span className="text-xs font-medium text-teal-700 group-hover:translate-x-0.5 inline-block transition-transform">
                        Open &rarr;
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Operational Tool Shortcuts */}
      <section className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <button
          type="button"
          onClick={() => onNavigate('scripts')}
          className="text-left p-6 hover:bg-slate-50/80 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <MessageSquare className="w-5 h-5 text-teal-700" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Interactive Script Workbench
          </h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Auto-fill guest names, rates, and Form URLs across Telegram `/rates` &amp; `/khqr`,
            Phnom Penh FB groups, and OTA follow-ups.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="text-left p-6 hover:bg-slate-50/80 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <MapPin className="w-5 h-5 text-teal-700" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Toul Tom Pong Map &amp; Routes
          </h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Live Places discovery for TTP cafés, coworking, and ABA ATMs plus airport tuk-tuk
            route times ready to paste into Telegram.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('forms')}
          className="text-left p-6 hover:bg-slate-50/80 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <FileSpreadsheet className="w-5 h-5 text-teal-700" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Direct Booking &amp; Check-In Hub
          </h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Create Google Forms, print reception QR cards, calculate ABA KHQR deposits, and review
            incoming guest arrivals.
          </p>
        </button>
      </section>
    </div>
  );
}
