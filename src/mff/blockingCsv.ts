import { parseCsvRows } from '../domain/csv';
import type {
  ActorElement,
  FloorPlanElement,
  Project,
  PropElement,
  SceneSetup,
  Waypoint,
} from '../types';
import { calculateFovAngle } from '../utils/geometry';
import {
  MFF_BLOCKING_COLUMNS,
  type MffBlockingRow,
  type MffBridgeState,
  type MffExchangeChange,
  type MffExchangeEnvelope,
  type MffReference,
} from './types';

const VALID_TYPES = new Set(['anchor', 'actor', 'prop', 'axis', 'camera_zone', 'unknown', 'previs']);
const VALID_EVIDENCE = new Set(['', 'OBSERVED', 'DECIDED', 'INFERRED', 'UNKNOWN']);
const REQUIRED_BASE_COLUMNS = MFF_BLOCKING_COLUMNS.slice(0, 20);
const CANVAS = { left: 100, top: 80, width: 800, height: 560 };

const numberOr = (value: string | undefined, fallback: number): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toCanvasX = (value: string): number => CANVAS.left + (numberOr(value, 50) / 100) * CANVAS.width;
const toCanvasY = (value: string): number => CANVAS.top + (numberOr(value, 50) / 100) * CANVAS.height;
const fromCanvasX = (value: number): string => Math.max(0, Math.min(100, ((value - CANVAS.left) / CANVAS.width) * 100)).toFixed(2);
const fromCanvasY = (value: number): string => Math.max(0, Math.min(100, ((value - CANVAS.top) / CANVAS.height) * 100)).toFixed(2);

const rowKey = (row: MffBlockingRow): string => `${row.record_id}::${row.state_id}`;

const csvCell = (value: string): string => {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

export interface ParsedMffCsv {
  columns: string[];
  rows: MffBlockingRow[];
  warnings: string[];
}

export const parseMffBlockingCsv = (text: string): ParsedMffCsv => {
  const matrix = parseCsvRows(text.replace(/^\uFEFF/, ''));
  if (matrix.length === 0) throw new Error('CSV 为空。');
  const columns = matrix[0].map((cell) => cell.trim());
  const missing = REQUIRED_BASE_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) throw new Error(`缺少 MFF 基础列：${missing.join(', ')}`);
  for (const column of MFF_BLOCKING_COLUMNS) {
    if (!columns.includes(column)) columns.push(column);
  }

  const rows = matrix.slice(1).map((cells, index) => {
    const row = Object.fromEntries(columns.map((column, columnIndex) => [column, (cells[columnIndex] ?? '').trim()])) as MffBlockingRow;
    if (!VALID_TYPES.has(row.record_type)) throw new Error(`第 ${index + 2} 行 record_type 无效：${row.record_type}`);
    if (!row.record_id) throw new Error(`第 ${index + 2} 行缺少 record_id`);
    if (!VALID_EVIDENCE.has(row.evidence_status)) throw new Error(`第 ${index + 2} 行 evidence_status 无效：${row.evidence_status}`);
    for (const field of ['x', 'y', 'facing_deg'] as const) {
      if (row[field] === '') continue;
      const number = Number(row[field]);
      const max = field === 'facing_deg' ? 359 : 100;
      if (!Number.isFinite(number) || number < 0 || number > max) throw new Error(`第 ${index + 2} 行 ${field} 必须在 0-${max}`);
    }
    if ((row.x === '') !== (row.y === '')) throw new Error(`第 ${index + 2} 行 x/y 必须同时填写`);
    return row;
  });

  const seen = new Set<string>();
  for (const row of rows) {
    const key = rowKey(row);
    if (seen.has(key)) throw new Error(`重复记录：${row.record_id}/${row.state_id}`);
    seen.add(key);
  }

  const warnings: string[] = [];
  const actors = new Map<string, Set<string>>();
  for (const row of rows) {
    if (row.record_type !== 'actor') continue;
    const states = actors.get(row.record_id) ?? new Set<string>();
    states.add(row.state_id);
    actors.set(row.record_id, states);
  }
  for (const [actorId, states] of actors) {
    if (!states.has('START') || !states.has('END')) throw new Error(`人物 ${actorId} 必须同时有 START 和 END`);
  }
  if (rows.some((row) => row.evidence_status === 'UNKNOWN')) warnings.push('存在 UNKNOWN 空间证据，锁定 G4 前需人工核对。');
  if (rows.some((row) => row.status === 'LOCKED')) warnings.push('输入包含 LOCKED 行；编辑结果只能导出为候选版本。');
  return { columns, rows, warnings };
};

export const serializeMffBlockingCsv = (rows: MffBlockingRow[], columns: string[] = [...MFF_BLOCKING_COLUMNS]): string =>
  [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column] ?? '')).join(','))].join('\r\n') + '\r\n';

export const sha256Bytes = async (bytes: ArrayBuffer): Promise<string> => {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const sha256Text = (text: string): Promise<string> =>
  sha256Bytes(new TextEncoder().encode(text).buffer as ArrayBuffer);

const mffRef = (bridge: MffBridgeState, row: MffBlockingRow): MffReference => ({
  projectId: bridge.projectId,
  sourceId: row.record_id,
  sourceVersion: bridge.sourceVersion,
  sourceStage: 'S4',
  stateId: row.state_id,
});

const parseEditorMeta = (notes: string): { width?: number; height?: number; rotation?: number } => {
  const match = notes.match(/\[\[MFF2D:(\{[^\n]*\})\]\]\s*$/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]) as { width?: number; height?: number; rotation?: number };
  } catch {
    return {};
  }
};

const waypointFor = (row: MffBlockingRow, bridge: MffBridgeState, fallbackBeat: number): Waypoint => ({
  id: `mff-wp-${row.record_id}-${row.state_id || fallbackBeat}`,
  x: toCanvasX(row.x),
  y: toCanvasY(row.y),
  rotation: numberOr(row.facing_deg, 0),
  beat: Math.max(1, numberOr(row.beat_id.replace(/\D/g, ''), fallbackBeat)),
  dialogueCue: row.trigger || row.path_text || undefined,
  mffRef: mffRef(bridge, row),
  mffBeatId: row.beat_id || undefined,
  triggerId: row.transition_id || undefined,
});

export const setupFromMffRows = (
  sceneId: string,
  title: string,
  rows: MffBlockingRow[],
  bridge: MffBridgeState,
): SceneSetup => {
  const groups = new Map<string, MffBlockingRow[]>();
  for (const row of rows) {
    const list = groups.get(row.record_id) ?? [];
    list.push(row);
    groups.set(row.record_id, list);
  }
  const elements: FloorPlanElement[] = [];
  let maxBeat = 1;

  for (const group of groups.values()) {
    const first = group.find((row) => row.state_id === 'START') ?? group[0];
    if (!first || !first.x || !first.y) continue;
    const ref = mffRef(bridge, first);
    const rotation = numberOr(first.facing_deg, 0);
    const metadata = parseEditorMeta(first.notes);
    if (first.record_type === 'actor') {
      const ordered = group.filter((row) => row !== first).sort((a, b) => numberOr(a.beat_id.replace(/\D/g, ''), 99) - numberOr(b.beat_id.replace(/\D/g, ''), 99));
      const path = ordered.map((row, index) => waypointFor(row, bridge, index + 2));
      maxBeat = Math.max(maxBeat, ...path.map((point) => point.beat), 1);
      elements.push({
        id: `mff-actor-${first.record_id}`,
        type: 'actor',
        name: first.label || first.record_id,
        characterLetter: (first.label || first.record_id).slice(0, 2).toUpperCase(),
        characterName: first.label || first.record_id,
        color: elements.filter((element) => element.type === 'actor').length % 2 ? '#ef4444' : '#2563eb',
        x: toCanvasX(first.x),
        y: toCanvasY(first.y),
        rotation,
        isStanding: !/坐|sit/i.test(first.pose_text),
        actionNotes: [first.position_text, first.relation_text, first.pose_text].filter(Boolean).join('；'),
        path,
        mffRef: ref,
      } as ActorElement);
    } else if (first.record_type === 'axis') {
      const points = first.path_points.split(';').map((point) => point.split(':'));
      const end = points.at(-1);
      elements.push({
        id: `mff-axis-${first.record_id}`,
        type: 'arrow',
        name: first.label || first.record_id,
        label: first.label || '动作轴',
        x: toCanvasX(first.x),
        y: toCanvasY(first.y),
        x2: end ? toCanvasX(end[0]) : toCanvasX(first.x) + 200,
        y2: end ? toCanvasY(end[1]) : toCanvasY(first.y),
        rotation: 0,
        color: '#dc2626',
        strokeWidth: 3,
        headStyle: 'double',
        dashStyle: 'dashed',
        mffRef: ref,
      });
    } else {
      const isZone = first.record_type === 'camera_zone' || first.record_type === 'unknown';
      const propPath = first.record_type === 'prop'
        ? group.filter((row) => row !== first).map((row, index) => waypointFor(row, bridge, index + 2))
        : [];
      maxBeat = Math.max(maxBeat, ...propPath.map((point) => point.beat), 1);
      elements.push({
        id: `mff-${first.record_type}-${first.record_id}`,
        type: isZone ? 'shape' : 'prop',
        name: first.label || first.record_id,
        label: first.label || first.record_id,
        x: toCanvasX(first.x),
        y: toCanvasY(first.y),
        rotation: metadata.rotation ?? rotation,
        width: ((metadata.width ?? 12) / 100) * CANVAS.width,
        height: ((metadata.height ?? 10) / 100) * CANVAS.height,
        ...(isZone
          ? { shapeType: 'rectangle', color: first.record_type === 'unknown' ? '#64748b' : '#16a34a', filled: true, opacity: 0.13, strokeColor: first.record_type === 'unknown' ? '#64748b' : '#16a34a', strokeWidth: 2, dashStyle: 'dashed' }
          : { propType: 'box', color: '#78716c', path: propPath }),
        mffRef: ref,
      } as FloorPlanElement);
    }
  }

  return {
    id: `mff-setup-${sceneId}`,
    name: title,
    sceneNumber: sceneId,
    location: title,
    timeOfDay: 'Night EXT',
    elements,
    shots: [],
    currentBeat: 1,
    totalBeats: maxBeat,
    aspectRatio: '2.39:1',
    canvasScale: 1,
    canvasOffset: { x: 20, y: 20 },
    gridSettings: { size: 28, snap: true, showGrid: true, unit: 'm', pixelsPerUnit: 28 },
    mff: {
      sceneId,
      screenplayVersion: 'v001',
      assetRegistryVersion: 'v001',
      blockingVersion: bridge.sourceVersion,
      gateStatus: 'DRAFT',
      sourceHash: bridge.sourceHash,
    },
  };
};

const patchRowFromElement = (row: MffBlockingRow, element: FloorPlanElement): MffBlockingRow => {
  const next = { ...row };
  if (element.type === 'actor') {
    const actor = element as ActorElement;
    if (row.state_id === actor.mffRef?.stateId) {
      next.x = fromCanvasX(actor.x);
      next.y = fromCanvasY(actor.y);
      next.facing_deg = String(Math.round(((actor.rotation % 360) + 360) % 360));
    }
    const waypoint = actor.path.find((point) => point.mffRef?.sourceId === row.record_id && point.mffRef?.stateId === row.state_id);
    if (waypoint) {
      next.x = fromCanvasX(waypoint.x);
      next.y = fromCanvasY(waypoint.y);
      next.facing_deg = String(Math.round((((waypoint.rotation ?? 0) % 360) + 360) % 360));
      next.trigger = waypoint.dialogueCue ?? next.trigger;
      next.beat_id = waypoint.mffBeatId ?? next.beat_id;
    }
  } else if (element.mffRef?.sourceId === row.record_id) {
    const waypoint = element.type === 'prop'
      ? (element as PropElement).path?.find((point) => point.mffRef?.stateId === row.state_id)
      : undefined;
    next.x = fromCanvasX(waypoint?.x ?? element.x);
    next.y = fromCanvasY(waypoint?.y ?? element.y);
    if (waypoint) {
      next.facing_deg = String(Math.round((((waypoint.rotation ?? 0) % 360) + 360) % 360));
      next.trigger = waypoint.dialogueCue ?? next.trigger;
      next.beat_id = waypoint.mffBeatId ?? next.beat_id;
    }
    if ('width' in element && 'height' in element) {
      const humanNotes = next.notes.replace(/\s*\[\[MFF2D:\{[^\n]*\}\]\]\s*$/, '').trimEnd();
      const meta = JSON.stringify({
        width: Number(((element.width / CANVAS.width) * 100).toFixed(2)),
        height: Number(((element.height / CANVAS.height) * 100).toFixed(2)),
        rotation: Math.round(((element.rotation % 360) + 360) % 360),
      });
      if (!waypoint) next.notes = `${humanNotes}${humanNotes ? ' ' : ''}[[MFF2D:${meta}]]`;
    }
  }
  return next;
};

export const rowsFromProject = (project: Project, setup: SceneSetup): MffBlockingRow[] => {
  const sourceRows = project.mffBridge?.sourceRows ?? [];
  return sourceRows.map((row) => {
    const element = setup.elements.find((candidate) =>
      candidate.mffRef?.sourceId === row.record_id &&
      (candidate.type !== 'actor' || candidate.mffRef?.stateId === row.state_id || (candidate as ActorElement).path.some((point) => point.mffRef?.stateId === row.state_id)),
    );
    return element ? patchRowFromElement(row, element) : { ...row };
  });
};

export const diffMffRows = (beforeRows: MffBlockingRow[], afterRows: MffBlockingRow[]): MffExchangeChange[] => {
  const before = new Map(beforeRows.map((row) => [rowKey(row), row]));
  const editable = new Set(['position_text', 'facing_text', 'gaze_target', 'path_text', 'trigger', 'anchor_refs', 'pose_text', 'distance_text', 'occlusion_text', 'contact_text', 'prop_state_text', 'from_state_id', 'transition_id', 'beat_id', 'x', 'y', 'facing_deg', 'path_points', 'notes']);
  const numericFields = new Set(['x', 'y', 'facing_deg']);
  const equal = (field: string, left: string, right: string): boolean => {
    if (numericFields.has(field) && left !== '' && right !== '') return Number(left) === Number(right);
    return left === right;
  };
  const changes: MffExchangeChange[] = [];
  for (const row of afterRows) {
    const previous = before.get(rowKey(row));
    if (!previous) continue;
    for (const field of editable) {
      if (equal(field, previous[field] ?? '', row[field] ?? '')) continue;
      changes.push({
        key: `${rowKey(row)}::${field}`,
        recordId: row.record_id,
        stateId: row.state_id,
        field,
        before: previous[field] ?? '',
        after: row[field] ?? '',
      });
    }
  }
  return changes;
};

export const exchangeEnvelope = (project: Project, setup: SceneSetup): MffExchangeEnvelope => {
  if (!project.mffBridge || !setup.mff) throw new Error('当前场次未连接 MFF S4-M2 数据。');
  const rows = rowsFromProject(project, setup);
  return {
    schema_version: 'mff-osd-exchange-1',
    project_id: project.mffBridge.projectId,
    scene_id: setup.mff.sceneId,
    source_stage: 'S4',
    source_file: project.mffBridge.sourceFile,
    source_hash: project.mffBridge.sourceHash,
    source_version: project.mffBridge.sourceVersion,
    editor_version: project.mffBridge.editorVersion,
    base_locked_version: project.mffBridge.baseLockedVersion,
    gate_status: setup.mff.gateStatus,
    exported_at: new Date().toISOString(),
    changes: diffMffRows(project.mffBridge.sourceRows, rows),
    rows,
  };
};

export const addDemoCameras = (setup: SceneSetup): SceneSetup => {
  const actors = setup.elements.filter((element): element is ActorElement => element.type === 'actor');
  const actorIds = actors.map((actor) => actor.id);
  const cameras: FloorPlanElement[] = [
    { id: 'mff-cam-a', type: 'camera', name: 'A机 主镜头', cameraLabel: 'A', color: '#0284c7', x: 260, y: 610, rotation: 300, focalLength: 35, sensorFormat: 'Super35', fovAngle: calculateFovAngle(35, 'Super35'), aspectRatio: '2.39:1', cameraHeight: 'Eye Level', rigType: 'Tripod', throwDistance: 430, associatedShotId: 'mff-shot-01', path: [], mffRef: { projectId: 'MFF-DEMO-001', sourceId: 'S01-SH01', sourceVersion: 'v001', sourceStage: 'S5' } },
    { id: 'mff-cam-b', type: 'camera', name: 'B机 跟移', cameraLabel: 'B', color: '#dc2626', x: 760, y: 560, rotation: 215, focalLength: 50, sensorFormat: 'Super35', fovAngle: calculateFovAngle(50, 'Super35'), aspectRatio: '2.39:1', cameraHeight: 'Waist', rigType: 'Gimbal', throwDistance: 380, associatedShotId: 'mff-shot-02', path: [{ id: 'mff-cam-b-wp', x: 650, y: 430, rotation: 205, beat: 3, dialogueCue: '摊主离开灶台时侧向跟移', mffBeatId: 'B03', triggerId: 'TR-CAM-01' }], mffRef: { projectId: 'MFF-DEMO-001', sourceId: 'S01-SH02', sourceVersion: 'v001', sourceStage: 'S5' } },
  ];
  return {
    ...setup,
    elements: [...setup.elements, ...cameras],
    shots: [
      { id: 'mff-shot-01', sceneNumber: setup.sceneNumber, shotNumber: 'S01-01', name: '全景建立路边摊空间', cameraId: 'mff-cam-a', cameraLabel: 'A', shotSize: 'WS', lensMm: 35, cameraAngle: 'Eye Level', movement: 'Static', aspectRatio: '2.39:1', frameRate: 24, subjectActorIds: actorIds, framingDescription: '前景餐桌、中心摊位、远处街口；两人分处摊位两侧。', actionScriptNotes: '锁定空间关系和180度轴线。', status: 'planned', takesCount: 0, estDurationSeconds: 8, order: 1, mffRef: { projectId: 'MFF-DEMO-001', sourceId: 'S01-SH01', sourceVersion: 'v001', sourceStage: 'S5' } },
      { id: 'mff-shot-02', sceneNumber: setup.sceneNumber, shotNumber: 'S01-02', name: '跟随摊主递出热汤', cameraId: 'mff-cam-b', cameraLabel: 'B', shotSize: 'MS', lensMm: 50, cameraAngle: 'Waist', movement: 'Tracking', aspectRatio: '2.39:1', frameRate: 24, subjectActorIds: actorIds, framingDescription: '从食客肩后跟随摊主横移到桌边，停在双人中景。', actionScriptNotes: 'B03触发，保持在摄影机允许侧。', status: 'planned', takesCount: 0, estDurationSeconds: 7, order: 2, mffRef: { projectId: 'MFF-DEMO-001', sourceId: 'S01-SH02', sourceVersion: 'v001', sourceStage: 'S5' } },
    ],
  };
};
