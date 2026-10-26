import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, Rocket, X } from 'lucide-react';
import { useFloorPlan } from '../../context/FloorPlanContext';
import { useWorkspaceUI } from '../../context/WorkspaceUIContext';
import type { RightTab } from '../../context/WorkspaceUIContext';
import { gettingStartedSteps } from '../../domain/workspace/gettingStarted';
import { useDismiss } from '../common/useDismiss';
import { useLanguage } from '../../i18n/LanguageContext';

const dismissedKey = (projectId: string) => `openshotdesigner_ui_getting_started_hidden_${projectId}`;

/**
 * A navbar button with the workflow checklist. Shows progress until every
 * step is done or it is hidden for this project; steps tick themselves off
 * from the project data, and "Go" opens the module (switching it on if the
 * workspace preset hid it).
 */
export const GettingStarted: React.FC = () => {
  const { project, isModuleVisible, setModuleVisible, loadExampleProductionData } = useFloorPlan();
  const { setActiveRightTab, setRightPanelOpen } = useWorkspaceUI();
  const { lang } = useLanguage();
  const isZh = lang === 'zh';
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(dismissedKey(project.id)) === '1';
    } catch {
      return false;
    }
  });
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, useCallback(() => setOpen(false), []), ref);

  const steps = useMemo(() => gettingStartedSteps(project), [project]);
  const done = steps.filter((step) => step.done).length;
  if (hidden || done === steps.length) return null;

  const hide = () => {
    setHidden(true);
    setOpen(false);
    try {
      localStorage.setItem(dismissedKey(project.id), '1');
    } catch {
      // Preference only.
    }
  };

  const go = (module: (typeof steps)[number]['module']) => {
    if (!isModuleVisible(module)) setModuleVisible(module, true);
    setActiveRightTab(module as RightTab);
    setRightPanelOpen(true);
    setOpen(false);
  };

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title={isZh ? '入门：按步骤完成制作流程' : 'Getting started: the production workflow, step by step'}
        aria-label={isZh ? `入门，已完成 ${done}/${steps.length}` : `Getting started, ${done} of ${steps.length} done`}
        className="h-8 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 text-ink-soft hover:bg-surface-hover whitespace-nowrap"
      >
        <Rocket className="w-3.5 h-3.5 text-accent-ink" />
        <span className="hidden 2xl:inline">{isZh ? '入门' : 'Getting started'}</span>
        <span className="font-mono text-[10px] px-1 rounded bg-surface-muted">{done}/{steps.length}</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-80 rounded-xl border border-line bg-surface text-ink shadow-2xl p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold">{isZh ? '从剧本到通告单' : 'From script to call sheet'}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={isZh ? '关闭' : 'Close'} className="p-1 rounded text-ink-muted hover:bg-surface-hover"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden mb-3">
            <div className="h-full bg-accent" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          <ol className="space-y-2">
            {steps.map((step) => (
              <li key={step.id} className="flex items-start gap-2">
                {step.done
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-ok shrink-0" aria-label={isZh ? '已完成' : 'Done'} />
                  : <Circle className="w-4 h-4 mt-0.5 text-ink-subtle shrink-0" aria-label={isZh ? '待完成' : 'To do'} />}
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold ${step.done ? 'line-through text-ink-muted' : ''}`}>{isZh ? ({ script: '添加剧本', breakdown: '完成拆解标记', cast: '配置演员与剧组', shots: '规划镜头', schedule: '建立排期', callsheet: '发送通告单' }[step.id] ?? step.title) : step.title}</div>
                  {!step.done && <p className="text-[11px] text-ink-muted leading-snug">{isZh ? ({ script: '导入或编写剧本，场次、演员和页数会从剧本生成。', breakdown: '在剧本页面标记道具、服装、车辆、特技和群众演员。', cast: '添加演员与剧组，并将角色连接到演员编号。', shots: '在平面图上调度场景，为每条镜头放置摄影机。', schedule: '添加拍摄日并拖入场次条，通告单和 DOOD 会自动派生。', callsheet: '打开拍摄日通告单，核对并标记为最终版后打印或分享。' }[step.id] ?? step.detail) : step.detail}</p>}
                </div>
                {!step.done && (
                  <button type="button" onClick={() => go(step.module)} className="shrink-0 px-2 py-1 rounded-md bg-accent hover:bg-accent-hover text-white text-[11px] font-semibold">
                    {isZh ? '前往' : 'Go'}
                  </button>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-3 pt-2 border-t border-line flex items-center justify-between gap-2">
            <button type="button" onClick={() => { loadExampleProductionData(); }} className="text-[11px] font-semibold text-accent-ink hover:underline">
              {isZh ? '用案例填充空模块' : 'Fill empty modules with examples'}
            </button>
            <button type="button" onClick={hide} className="text-[11px] text-ink-muted hover:text-ink">{isZh ? '本项目隐藏' : 'Hide for this project'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
