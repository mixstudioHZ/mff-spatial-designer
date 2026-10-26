export const MFF_BLOCKING_COLUMNS = [
  'record_type',
  'record_id',
  'state_id',
  'beat_id',
  'label',
  'position_text',
  'relation_text',
  'facing_text',
  'gaze_target',
  'path_text',
  'trigger',
  'evidence_ref',
  'evidence_status',
  'x',
  'y',
  'facing_deg',
  'path_points',
  'previs_ref',
  'status',
  'notes',
  'anchor_refs',
  'pose_text',
  'distance_text',
  'occlusion_text',
  'contact_text',
  'prop_state_text',
  'from_state_id',
  'transition_id',
] as const;

export type MffBlockingColumn = (typeof MFF_BLOCKING_COLUMNS)[number];
export type MffBlockingRow = Record<string, string> & Record<MffBlockingColumn, string>;

export type MffSourceStage = 'S4' | 'S5';
export type MffGateStatus = 'DRAFT' | 'LOCKED' | 'STALE';

export interface MffReference {
  projectId: string;
  sourceId: string;
  sourceVersion: string;
  sourceStage: MffSourceStage;
  stateId?: string;
}

export interface MffSceneLink {
  sceneId: string;
  screenplayVersion: string;
  assetRegistryVersion: string;
  blockingVersion?: string;
  storyboardVersion?: string;
  gateStatus: MffGateStatus;
  sourceHash?: string;
}

export interface MffBridgeState {
  schemaVersion: 'mff-osd-exchange-1';
  projectId: string;
  mode: 'S4-M2';
  sourceStage: 'S4';
  sourceFile: string;
  sourceHash: string;
  sourceVersion: string;
  editorVersion: string;
  baseLockedVersion: string;
  importedAt: string;
  columns: string[];
  sourceRows: MffBlockingRow[];
}

export interface MffExchangeChange {
  key: string;
  recordId: string;
  stateId: string;
  field: string;
  before: string;
  after: string;
}

export interface MffExchangeEnvelope {
  schema_version: 'mff-osd-exchange-1';
  project_id: string;
  scene_id: string;
  source_stage: 'S4';
  source_file: string;
  source_hash: string;
  source_version: string;
  editor_version: string;
  base_locked_version: string;
  gate_status: MffGateStatus;
  exported_at: string;
  changes: MffExchangeChange[];
  rows: MffBlockingRow[];
}
