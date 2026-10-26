import type { SceneSetup } from '../types';
import { addDemoCameras, serializeMffBlockingCsv, setupFromMffRows } from './blockingCsv';
import { MFF_BLOCKING_COLUMNS, type MffBlockingRow, type MffBridgeState } from './types';

const row = (values: Partial<MffBlockingRow>): MffBlockingRow =>
  Object.assign(Object.fromEntries(MFF_BLOCKING_COLUMNS.map((column) => [column, ''])), values) as MffBlockingRow;

export const MFF_DEMO_ROWS: MffBlockingRow[] = [
  row({ record_type: 'anchor', record_id: 'A-STALL', state_id: 'START', beat_id: 'B01', label: '路边摊操作台', position_text: '画面上方偏中，平行道路', relation_text: '食客桌位于操作台前方', evidence_ref: 'LOC-STALL-v001', evidence_status: 'DECIDED', x: '50', y: '24', facing_deg: '180', status: 'DRAFT', notes: '固定摊位 [[MFF2D:{"width":38,"height":13,"rotation":0}]]' }),
  row({ record_type: 'anchor', record_id: 'A-TABLE', state_id: 'START', beat_id: 'B01', label: '折叠餐桌', position_text: '摊位前方偏左', relation_text: '与操作台间距约2米', evidence_ref: 'PROP-TABLE-v001', evidence_status: 'DECIDED', x: '37', y: '55', facing_deg: '0', status: 'DRAFT', notes: '可移动家具 [[MFF2D:{"width":18,"height":10,"rotation":0}]]' }),
  row({ record_type: 'anchor', record_id: 'A-STREET', state_id: 'START', beat_id: 'B01', label: '街道路缘', position_text: '场地右侧边界', evidence_status: 'OBSERVED', x: '82', y: '50', facing_deg: '90', status: 'DRAFT', notes: '不可越过的行车边界 [[MFF2D:{"width":4,"height":78,"rotation":0}]]' }),
  row({ record_type: 'camera_zone', record_id: 'CZ-SAFE', state_id: 'START', beat_id: 'B01', label: '摄影机允许侧', position_text: '动作轴下方及右下区域', relation_text: '所有主叙事机位保持同侧', evidence_status: 'DECIDED', x: '55', y: '78', facing_deg: '0', status: 'DRAFT', notes: '180度轴线安全区 [[MFF2D:{"width":66,"height":22,"rotation":0}]]' }),
  row({ record_type: 'unknown', record_id: 'U-ALLEY', state_id: 'START', beat_id: 'B01', label: '巷口画外连接待补证', position_text: '场地左上角', evidence_status: 'UNKNOWN', x: '13', y: '16', facing_deg: '0', status: 'DRAFT', notes: '透视参考未覆盖 [[MFF2D:{"width":18,"height":14,"rotation":0}]]' }),
  row({ record_type: 'axis', record_id: 'AXIS-01', state_id: 'START', beat_id: 'B01', label: '摊主-食客动作轴', position_text: '操作台与餐桌之间', relation_text: '摄影机不得无动机跨轴', evidence_status: 'DECIDED', x: '37', y: '40', facing_deg: '0', path_points: '37:40;60:40', status: 'DRAFT' }),
  row({ record_type: 'actor', record_id: 'CHAR-VENDOR', state_id: 'START', beat_id: 'B01', label: '摊主 阿慧', position_text: '操作台内侧灶台前', relation_text: '面对食客，操作台形成短暂遮挡', facing_text: '朝向餐桌', gaze_target: 'CHAR-CUSTOMER', evidence_ref: 'CHAR-VENDOR-v003', evidence_status: 'DECIDED', x: '52', y: '30', facing_deg: '165', status: 'DRAFT', anchor_refs: 'A-STALL', pose_text: '站立，右手持汤勺', distance_text: '距食客约3米', occlusion_text: '腰部被操作台遮挡', prop_state_text: '汤碗在操作台上' }),
  row({ record_type: 'actor', record_id: 'CHAR-VENDOR', state_id: 'K01', beat_id: 'B03', label: '摊主 阿慧', position_text: '绕出操作台来到餐桌右侧', relation_text: '与食客形成近距离对角关系', facing_text: '朝向食客', gaze_target: 'CHAR-CUSTOMER', path_text: '从操作台右端绕行至餐桌', trigger: '食客说：我只带了这些。', evidence_status: 'DECIDED', x: '55', y: '55', facing_deg: '205', path_points: '52:30;66:36;62:50;55:55', status: 'DRAFT', anchor_refs: 'A-STALL;A-TABLE', pose_text: '端碗，步速放慢', distance_text: '距食客约1.2米', contact_text: '将汤碗放到餐桌', prop_state_text: '汤碗由摊主携带', from_state_id: 'START', transition_id: 'TR-VENDOR-01' }),
  row({ record_type: 'actor', record_id: 'CHAR-VENDOR', state_id: 'END', beat_id: 'B04', label: '摊主 阿慧', position_text: '停在餐桌右侧', relation_text: '与食客共享桌面焦点', facing_text: '微侧向食客', gaze_target: 'PROP-BOWL', trigger: '碗底碰桌声', evidence_status: 'DECIDED', x: '54', y: '57', facing_deg: '220', status: 'DRAFT', anchor_refs: 'A-TABLE', pose_text: '松开汤碗，手停留半拍', distance_text: '距食客约1米', contact_text: '手离开汤碗', prop_state_text: '汤碗落桌', from_state_id: 'K01', transition_id: 'TR-VENDOR-02' }),
  row({ record_type: 'actor', record_id: 'CHAR-CUSTOMER', state_id: 'START', beat_id: 'B01', label: '食客 老周', position_text: '折叠餐桌左侧', relation_text: '与摊主隔着操作台', facing_text: '朝向摊主', gaze_target: 'CHAR-VENDOR', evidence_ref: 'CHAR-CUSTOMER-v002', evidence_status: 'DECIDED', x: '31', y: '57', facing_deg: '330', status: 'DRAFT', anchor_refs: 'A-TABLE', pose_text: '坐姿，双手压着零钱', distance_text: '距摊主约3米' }),
  row({ record_type: 'actor', record_id: 'CHAR-CUSTOMER', state_id: 'END', beat_id: 'B04', label: '食客 老周', position_text: '仍在餐桌左侧', relation_text: '身体不移动，注意力转向汤碗', facing_text: '上身朝向摊主', gaze_target: 'PROP-BOWL', trigger: '汤碗落桌', evidence_status: 'DECIDED', x: '31', y: '57', facing_deg: '345', status: 'DRAFT', anchor_refs: 'A-TABLE', pose_text: '坐姿，右手慢慢松开零钱', contact_text: '未接触汤碗', from_state_id: 'START', transition_id: 'TR-CUSTOMER-01' }),
  row({ record_type: 'prop', record_id: 'PROP-BOWL', state_id: 'START', beat_id: 'B01', label: '热汤碗', position_text: '操作台中央', relation_text: '在摊主右手边', evidence_ref: 'PROP-BOWL-v001', evidence_status: 'DECIDED', x: '49', y: '25', facing_deg: '0', status: 'DRAFT', notes: '关键道具 [[MFF2D:{"width":6,"height":5,"rotation":0}]]', anchor_refs: 'A-STALL', prop_state_text: '盛满热汤，冒热气' }),
  row({ record_type: 'prop', record_id: 'PROP-BOWL', state_id: 'END', beat_id: 'B04', label: '热汤碗', position_text: '折叠餐桌中央偏右', relation_text: '位于两人之间', path_text: '随摊主移动到餐桌', trigger: '摊主放下汤碗', evidence_status: 'DECIDED', x: '43', y: '56', facing_deg: '0', path_points: '49:25;55:55;43:56', status: 'DRAFT', anchor_refs: 'A-TABLE', prop_state_text: '落桌，仍冒热气', from_state_id: 'START', transition_id: 'TR-BOWL-01' }),
];

export const MFF_DEMO_CSV = serializeMffBlockingCsv(MFF_DEMO_ROWS);
export const MFF_DEMO_SOURCE_HASH = '42764c1d1c731b7ec59bea895fd8f9a5a4afc230e04e4fb5a32a24a1239e2afd';

export const createMffDemoBridge = (): MffBridgeState => ({
  schemaVersion: 'mff-osd-exchange-1',
  projectId: 'MFF-DEMO-001',
  mode: 'S4-M2',
  sourceStage: 'S4',
  sourceFile: '场景S01_调度_v001.csv',
  sourceHash: MFF_DEMO_SOURCE_HASH,
  sourceVersion: 'v001',
  editorVersion: 'osd-working-v001',
  baseLockedVersion: 'v000',
  importedAt: '2026-10-25T00:00:00.000Z',
  columns: [...MFF_BLOCKING_COLUMNS],
  sourceRows: MFF_DEMO_ROWS.map((entry) => ({ ...entry })),
});

export const createMffDemoSetup = (): SceneSetup => {
  const bridge = createMffDemoBridge();
  return addDemoCameras(setupFromMffRows('S01', 'EXT. 深夜路边摊 - 夜', bridge.sourceRows, bridge));
};
