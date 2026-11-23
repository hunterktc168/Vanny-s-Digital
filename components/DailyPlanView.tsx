'use client';

import React, { useState } from 'react';
import Image, { StaticImageData } from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Copy,
  Layers,
  Megaphone,
  RotateCcw,
  Target,
} from 'lucide-react';
import {
  ACTION_PLAN_DAYS,
  SCRIPT_TEMPLATES,
  SHOT_GUIDE_ITEMS,
} from '@/lib/action-plan-data';
import deskImg from '@/src/assets/images/guesthouse_nomad_desk_1795430019875.jpg';
import courtyardImg from '@/src/assets/images/guesthouse_courtyard_1795430020156.jpg';
import cafeImg from '@/src/assets/images/ttp_neighborhood_cafe_1795430020514.jpg';

const SHOT_IMAGES: Record<'desk' | 'courtyard' | 'cafe', StaticImageData> = {
  desk: deskImg,
  courtyard: courtyardImg,
  cafe: cafeImg,
};

interface DailyPlanViewProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
  onRequestReset: () => void;
}

export default function DailyPlanView({
  selectedDay,
  onSelectDay,
  completedTaskIds,
  onToggleTask,
  onRequestReset,
}: DailyPlanViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [showShotGuide, setShowShotGuide] = useState<boolean>(
    selectedDay === 1 || selectedDay === 4
  );

  const dayPlan =
    ACTION_PLAN_DAYS.find((d) => d.day === selectedDay) ?? ACTION_PLAN_DAYS[0];
  const digitizationTasks = dayPlan.tasks.filter((t) => t.category === 'digitization');
  const marketingTasks = dayPlan.tasks.filter((t) => t.category === 'marketing');
  const dayCompleted = dayPlan.tasks.filter((t) =>
    completedTaskIds.includes(t.id)
  ).length;
  const totalMinutes = dayPlan.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const dayScripts = SCRIPT_TEMPLATES.filter((s) => s.dayRef === dayPlan.day);

  const handleSelectDay = (day: number) => {
    onSelectDay(day);
    if (day === 4 || day === 1) {
      setShowShotGuide(true);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Clipboard blocked in unsupported context
    }
  };

  return (
    <div className="space-y-6">
      {/* Day Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Days 1 to 7">
          {ACTION_PLAN_DAYS.map((d) => {
            const done = d.tasks.filter((t) => completedTaskIds.includes(t.id)).length;
            const active = d.day === dayPlan.day;
            const allDone = done === d.tasks.length;
            return (
              <button
                key={d.day}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectDay(d.day)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  active
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono tabular-nums">Day 0{d.day}</span>
                {allDone ? (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${active ? 'text-teal-100' : 'text-emerald-600'}`}
                  />
                ) : (
                  <span
                    className={`font-mono tabular-nums text-[11px] ${
                      active ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {done}/{d.tasks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onRequestReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Progress</span>
        </button>
      </div>

      {/* Day Header & Primary Focus */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-teal-700">Day 0{dayPlan.day}</span>
              <span aria-hidden="true">·</span>
              <span>{dayPlan.primaryFocus}</span>
              <span aria-hidden="true">·</span>
              <span>{dayPlan.targetChannel}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight text-balance">
              {dayPlan.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">{dayPlan.summary}</p>
          </div>

          <div className="flex items-center gap-5 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Day Progress</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                {dayCompleted}/{dayPlan.tasks.length}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Est. Effort</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-slate-900 inline-flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{totalMinutes}m</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Split: Digitization Tasks vs Marketing & Content Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Digitization Tasks */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-semibold text-slate-900">
                Digitization Tasks (Operations &amp; Tech)
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {digitizationTasks.filter((t) => completedTaskIds.includes(t.id)).length}/
              {digitizationTasks.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {digitizationTasks.map((task) => {
              const checked = completedTaskIds.includes(task.id);
              return (
                <div key={task.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="w-full text-left flex items-start gap-3.5 cursor-pointer group"
                  >
                    <span className="mt-0.5 shrink-0 transition-transform duration-150 group-active:scale-95">
                      {checked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3
                          className={`text-sm font-semibold ${
                            checked ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                          {task.estimatedMinutes}m
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-teal-800 bg-teal-50/70 px-2 py-1 rounded inline-block max-w-full truncate">
                        {task.toolOrSetting}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {task.instructions}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Marketing & Content Tasks */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-semibold text-slate-900">
                Marketing &amp; Content Execution
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {marketingTasks.filter((t) => completedTaskIds.includes(t.id)).length}/
              {marketingTasks.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {marketingTasks.map((task) => {
              const checked = completedTaskIds.includes(task.id);
              return (
                <div key={task.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="w-full text-left flex items-start gap-3.5 cursor-pointer group"
                  >
                    <span className="mt-0.5 shrink-0 transition-transform duration-150 group-active:scale-95">
                      {checked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3
                          className={`text-sm font-semibold ${
                            checked ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                          {task.estimatedMinutes}m
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-teal-800 bg-teal-50/70 px-2 py-1 rounded inline-block max-w-full truncate">
                        {task.toolOrSetting}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {task.instructions}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* KPI / Deliverable Verification */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                End-of-Day KPI &amp; Concrete Deliverable
              </h2>
              <p className="text-sm text-slate-700 mt-1">{dayPlan.kpiDeliverable}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              {dayPlan.deliverableChecklist.map((item, idx) => (
                <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="font-mono text-teal-700 shrink-0">0{idx + 1}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Collapsible Visual Photography Shot Guide */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowShotGuide((v) => !v)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-teal-700" />
            <span className="text-sm font-semibold text-slate-900">
              Smartphone Photography Shot Guide (Digital Nomad Reference)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">3 core shots · Natural light</span>
            {showShotGuide ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showShotGuide && (
          <div className="p-6 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5">
            {SHOT_GUIDE_ITEMS.map((shot) => {
              const imgFailed = failedImages[shot.id];
              return (
                <div key={shot.id} className="space-y-3">
                  <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    {!imgFailed ? (
                      <Image
                        src={SHOT_IMAGES[shot.imageKey]}
                        alt={shot.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [shot.id]: true }))
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-100 text-slate-500">
                        <Camera className="w-6 h-6 mb-2 text-slate-400" />
                        <span className="text-xs font-medium">{shot.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">{shot.title}</h3>
                    <p className="text-xs text-teal-800">{shot.shotTiming}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{shot.framingNote}</p>
                    <p className="text-xs text-slate-500 italic pt-1">{shot.captionHook}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Day-Matched Scripts */}
      {dayScripts.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Ready-to-Use Templates for Day 0{dayPlan.day}
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {dayScripts.length} script{dayScripts.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {dayScripts.map((script) => {
              const isCopied = copiedId === script.id;
              return (
                <div key={script.id} className="p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-medium text-teal-700">{script.channel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{script.hookAngle}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-1">
                        {script.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(script.id, script.bodyText)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">Setting / CTA:</span>{' '}
                    {script.settingOrButton}
                  </p>

                  <pre className="whitespace-pre-wrap font-sans text-xs md:text-[13px] text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-4 leading-relaxed">
                    {script.bodyText}
                  </pre>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Chronological Day Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={dayPlan.day <= 1}
          onClick={() => handleSelectDay(Math.max(1, dayPlan.day - 1))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{dayPlan.day > 1 ? `Previous: Day 0${dayPlan.day - 1}` : 'Start of Week'}</span>
        </button>

        <button
          type="button"
          disabled={dayPlan.day >= 7}
          onClick={() => handleSelectDay(Math.min(7, dayPlan.day + 1))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>{dayPlan.day < 7 ? `Next: Day 0${dayPlan.day + 1}` : 'End of 7-Day Plan'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
