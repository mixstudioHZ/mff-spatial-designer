import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Download, FileJson2, FileUp, ShieldCheck } from 'lucide-react';
import { useFloorPlan } from '../../context/FloorPlanContext';
import { downloadCsv, downloadText, safeFileName } from '../../utils/download';
import {
  diffMffRows,
  exchangeEnvelope,
  parseMffBlockingCsv,
  rowsFromProject,
  serializeMffBlockingCsv,
  setupFromMffRows,
  sha256Bytes,
} from '../../mff/blockingCsv';
import type { MffBridgeState } from '../../mff/types';
import { useLanguage } from '../../i18n/LanguageContext';
import { importMffBridgeCommand } from '../../domain/commands';

export const MffBridgePanel: React.FC = () => {
  const { project, activeSetup, runCommand } = useFloorPlan();
  const { lang } = useLanguage();
  const isZh = lang === 'zh';
  const inputRef = useRef<HTMLInputElement>(null);
  const [projectId, setProjectId] = useState(project.mffProjectId || 'MFF-PROJECT-001');
  const [sceneId, setSceneId] = useState(activeSetup.mff?.sceneId || activeSetup.sceneNumber || 'S01');
  const [sourceVersion, setSourceVersion] = useState(project.mffBridge?.sourceVersion || 'v001');
  const [baseLockedVersion, setBaseLockedVersion] = useState(project.mffBridge?.baseLockedVersion || 'v000');
  const [message, setMessage] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const currentRows = useMemo(
    () => (project.mffBridge ? rowsFromProject(project, activeSetup) : []),
    [project, activeSetup],
  );
  const changes = useMemo(
    () => (project.mffBridge ? diffMffRows(project.mffBridge.sourceRows, currentRows) : []),
    [project.mffBridge, currentRows],
  );
  const displayedGate = activeSetup.mff?.gateStatus === 'LOCKED' && changes.length > 0
    ? 'STALE'
    : activeSetup.mff?.gateStatus ?? 'DRAFT';
  const activeWarnings = [...new Set([
    ...warnings,
    ...(currentRows.some((row) => row.evidence_status === 'UNKNOWN')
      ? [isZh ? '存在 UNKNOWN 空间证据，锁定 G4 前需人工核对。' : 'UNKNOWN spatial evidence requires manual review before G4 lock.']
      : []),
    ...(currentRows.some((row) => row.status === 'LOCKED')
      ? [isZh ? '输入包含 LOCKED 行；编辑结果只能导出为候选版本。' : 'Input contains LOCKED rows; edits can only be exported as a candidate version.']
      : []),
  ])];

  const importCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void (async () => {
      try {
        const bytes = await file.arrayBuffer();
        const text = new TextDecoder('utf-8').decode(bytes);
        const parsed = parseMffBlockingCsv(text);
        const sourceHash = await sha256Bytes(bytes);
        const bridge: MffBridgeState = {
          schemaVersion: 'mff-osd-exchange-1',
          projectId: projectId.trim() || 'MFF-PROJECT-001',
          mode: 'S4-M2',
          sourceStage: 'S4',
          sourceFile: file.name,
          sourceHash,
          sourceVersion: sourceVersion.trim() || 'v001',
          editorVersion: `osd-working-${sourceVersion.trim() || 'v001'}`,
          baseLockedVersion: baseLockedVersion.trim() || 'v000',
          importedAt: new Date().toISOString(),
          columns: parsed.columns,
          sourceRows: parsed.rows,
        };
        const nextSetup = setupFromMffRows(
          sceneId.trim() || 'S01',
          `${sceneId.trim() || 'S01'}｜MFF 二维调度`,
          parsed.rows,
          bridge,
        );
        runCommand(importMffBridgeCommand, { bridge, setup: nextSetup }, { domain: 'mff' });
        setWarnings([]);
        setMessage(isZh
          ? `已导入 ${parsed.rows.length} 行；源哈希 ${sourceHash.slice(0, 12)}…`
          : `Imported ${parsed.rows.length} rows; source hash ${sourceHash.slice(0, 12)}…`);
      } catch (error) {
        setWarnings([]);
        setMessage(error instanceof Error ? error.message : (isZh ? 'CSV 导入失败' : 'CSV import failed'));
      }
    })();
    event.target.value = '';
  };

  const exportCsv = () => {
    if (!project.mffBridge) return;
    downloadCsv(
      serializeMffBlockingCsv(currentRows, project.mffBridge.columns),
      `${safeFileName(activeSetup.mff?.sceneId || activeSetup.sceneNumber, 'scene')}_调度候选_${project.mffBridge.editorVersion}.csv`,
      { excelBom: true },
    );
    setMessage(isZh
      ? `已导出候选 CSV，共 ${changes.length} 项白名单变更；仍需 MFF 校验与 G4 确认。`
      : `Candidate CSV exported with ${changes.length} allow-listed changes; MFF validation and G4 confirmation are still required.`);
  };

  const exportExchange = () => {
    try {
      const envelope = exchangeEnvelope(project, activeSetup);
      downloadText(
        JSON.stringify(envelope, null, 2),
        `${safeFileName(envelope.scene_id, 'scene')}_mff-osd-exchange.json`,
        { type: 'application/json;charset=utf-8' },
      );
      setMessage(isZh
        ? `已导出交换包，包含 ${envelope.changes.length} 项变更。`
        : `Exchange package exported with ${envelope.changes.length} changes.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isZh ? '交换包导出失败' : 'Exchange export failed'));
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3 text-xs">
      <section className="rounded-lg border border-line bg-surface p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-sm flex items-center gap-2"><Database className="w-4 h-4 text-emerald-500" />MFF S4-M2 Bridge</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{isZh ? 'CSV 是空间母本；画布、.osd 和交换 JSON 是工作件。这里不会直接把场次标记为 G4 LOCKED。' : 'CSV is the spatial source of truth; the canvas, .osd file and exchange JSON are working artifacts. This editor cannot grant G4 LOCKED status.'}</p>
          </div>
          <span className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${displayedGate === 'LOCKED' ? 'bg-emerald-500/15 text-emerald-500' : displayedGate === 'STALE' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'}`}>{displayedGate}</span>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-3 space-y-2">
        <h3 className="font-bold">{isZh ? '导入上下文' : 'Import context'}</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1"><span className="text-[10px] text-ink-muted">{isZh ? '项目 ID' : 'Project ID'}</span><input value={projectId} onChange={(event) => setProjectId(event.target.value)} className="w-full rounded border border-line bg-field px-2 py-1.5" /></label>
          <label className="space-y-1"><span className="text-[10px] text-ink-muted">{isZh ? '场次 ID' : 'Scene ID'}</span><input value={sceneId} onChange={(event) => setSceneId(event.target.value)} className="w-full rounded border border-line bg-field px-2 py-1.5" /></label>
          <label className="space-y-1"><span className="text-[10px] text-ink-muted">{isZh ? '源版本' : 'Source version'}</span><input value={sourceVersion} onChange={(event) => setSourceVersion(event.target.value)} className="w-full rounded border border-line bg-field px-2 py-1.5" /></label>
          <label className="space-y-1"><span className="text-[10px] text-ink-muted">{isZh ? '基线锁定版' : 'Locked baseline'}</span><input value={baseLockedVersion} onChange={(event) => setBaseLockedVersion(event.target.value)} className="w-full rounded border border-line bg-field px-2 py-1.5" /></label>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-md bg-accent hover:bg-accent-hover text-white py-2 font-bold flex items-center justify-center gap-2"><FileUp className="w-4 h-4" />{isZh ? '导入 MFF 调度 CSV' : 'Import MFF blocking CSV'}</button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={importCsv} className="hidden" />
      </section>

      {project.mffBridge && activeSetup.mff ? (
        <>
          <section className="rounded-lg border border-line bg-surface p-3 space-y-2">
            <div className="flex items-center justify-between"><h3 className="font-bold">{isZh ? '当前连接' : 'Current connection'}</h3><ShieldCheck className="w-4 h-4 text-emerald-500" /></div>
            <dl className="grid grid-cols-[7rem_1fr] gap-x-2 gap-y-1 text-[11px]">
              <dt className="text-ink-muted">{isZh ? '场次' : 'Scene'}</dt><dd className="font-mono">{activeSetup.mff.sceneId}</dd>
              <dt className="text-ink-muted">{isZh ? '源文件' : 'Source file'}</dt><dd className="truncate" title={project.mffBridge.sourceFile}>{project.mffBridge.sourceFile}</dd>
              <dt className="text-ink-muted">{isZh ? '源版本' : 'Source version'}</dt><dd className="font-mono">{project.mffBridge.sourceVersion}</dd>
              <dt className="text-ink-muted">{isZh ? '源 SHA-256' : 'Source SHA-256'}</dt><dd className="font-mono truncate" title={project.mffBridge.sourceHash}>{project.mffBridge.sourceHash}</dd>
              <dt className="text-ink-muted">{isZh ? '记录' : 'Records'}</dt><dd>{currentRows.length} {isZh ? '行' : 'rows'}</dd>
              <dt className="text-ink-muted">{isZh ? '候选变更' : 'Candidate changes'}</dt><dd className={changes.length ? 'text-amber-500 font-bold' : 'text-emerald-500'}>{changes.length} {isZh ? '项' : ''}</dd>
            </dl>
            {changes.length > 0 && (
              <div className="max-h-36 overflow-y-auto rounded bg-surface-sunken p-2 space-y-1">
                {changes.slice(0, 20).map((change) => <div key={change.key} className="font-mono text-[10px] text-ink-muted">{change.recordId}/{change.stateId} · {change.field}: {change.before || '∅'} → {change.after || '∅'}</div>)}
                {changes.length > 20 && <div className="text-[10px] text-ink-muted">{isZh ? `另有 ${changes.length - 20} 项…` : `${changes.length - 20} more…`}</div>}
              </div>
            )}
          </section>

          <section className="grid grid-cols-2 gap-2">
            <button type="button" onClick={exportCsv} className="rounded-md border border-line-strong hover:bg-surface-hover py-2 font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4" />{isZh ? '候选 CSV' : 'Candidate CSV'}</button>
            <button type="button" onClick={exportExchange} className="rounded-md border border-line-strong hover:bg-surface-hover py-2 font-bold flex items-center justify-center gap-2"><FileJson2 className="w-4 h-4" />{isZh ? '交换 JSON' : 'Exchange JSON'}</button>
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-dashed border-line-strong p-4 text-center text-ink-muted">{isZh ? '当前项目尚未导入 MFF 调度 CSV。' : 'No MFF blocking CSV has been imported for this project.'}</section>
      )}

      {activeWarnings.map((warning) => <div key={warning} className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 flex gap-2 text-amber-600"><AlertTriangle className="w-4 h-4 shrink-0" />{warning}</div>)}
      {message && <div className="rounded-lg border border-line bg-surface-muted p-2 flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /><span>{message}</span></div>}

      <section className="rounded-lg border border-line bg-surface p-3">
        <h3 className="font-bold mb-2">{isZh ? '回写边界' : 'Write-back boundary'}</h3>
        <p className="text-[11px] text-ink-muted leading-relaxed">{isZh ? '允许：位置、朝向、视线、路径、触发、锚点和 MFF2D 几何。禁止：剧本对白、角色目标/潜台词、资产定义、证据状态和锁定状态。' : 'Allowed: position, facing, gaze, path, trigger, anchors and MFF2D geometry. Forbidden: screenplay dialogue, character objectives or subtext, asset definitions, evidence state and lock state.'}</p>
      </section>
    </div>
  );
};
