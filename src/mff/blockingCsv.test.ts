import { describe, expect, it } from 'vitest';
import type { Project } from '../types';
import {
  diffMffRows,
  exchangeEnvelope,
  parseMffBlockingCsv,
  rowsFromProject,
  serializeMffBlockingCsv,
  setupFromMffRows,
  sha256Bytes,
} from './blockingCsv';
import { createMffDemoBridge, MFF_DEMO_CSV, MFF_DEMO_SOURCE_HASH } from './demo';

describe('MFF S4-M2 bridge', () => {
  it('parses the bundled 28-column case and keeps START/END actor contracts', () => {
    const parsed = parseMffBlockingCsv(MFF_DEMO_CSV);
    expect(parsed.rows.length).toBeGreaterThan(10);
    expect(parsed.columns).toContain('transition_id');
    expect(parsed.warnings).toContain('存在 UNKNOWN 空间证据，锁定 G4 前需人工核对。');
  });

  it('hashes the exact imported bytes, including BOM and line endings', async () => {
    const bytes = new TextEncoder().encode('\uFEFFalpha,beta\r\n1,2\r\n');
    expect(await sha256Bytes(bytes.buffer as ArrayBuffer)).toBe('3a09d2d0ad1a83ea72f68631f918063e67096b94993d80a2cde97981b73a6dbd');
    expect(await sha256Bytes(new TextEncoder().encode(MFF_DEMO_CSV).buffer as ArrayBuffer)).toBe(MFF_DEMO_SOURCE_HASH);
  });

  it('round-trips editable actor geometry without changing evidence fields', () => {
    const bridge = createMffDemoBridge();
    const setup = setupFromMffRows('S01', 'Demo', bridge.sourceRows, bridge);
    const vendor = setup.elements.find((element) => element.mffRef?.sourceId === 'CHAR-VENDOR');
    if (!vendor) throw new Error('missing vendor');
    vendor.x += 40;
    const project = { id: 'test', title: 'test', director: '', cinematographer: '', date: '2026-10-25', setups: [setup], activeSetupId: setup.id, mffBridge: bridge } as Project;
    const rows = rowsFromProject(project, setup);
    const source = bridge.sourceRows.find((row) => row.record_id === 'CHAR-VENDOR' && row.state_id === 'START');
    const changed = rows.find((row) => row.record_id === 'CHAR-VENDOR' && row.state_id === 'START');
    expect(changed?.x).not.toBe(source?.x);
    expect(changed?.evidence_status).toBe(source?.evidence_status);
    expect(diffMffRows(bridge.sourceRows, rows).some((change) => change.field === 'evidence_status')).toBe(false);
  });

  it('exports the documented exchange envelope and a valid candidate CSV', () => {
    const bridge = createMffDemoBridge();
    const setup = setupFromMffRows('S01', 'Demo', bridge.sourceRows, bridge);
    const project = { id: 'test', title: 'test', director: '', cinematographer: '', date: '2026-10-25', setups: [setup], activeSetupId: setup.id, mffBridge: bridge } as Project;
    const envelope = exchangeEnvelope(project, setup);
    expect(envelope.schema_version).toBe('mff-osd-exchange-1');
    expect(envelope.gate_status).toBe('DRAFT');
    expect(envelope.changes).toEqual([]);
    expect(parseMffBlockingCsv(serializeMffBlockingCsv(envelope.rows)).rows).toHaveLength(bridge.sourceRows.length);
  });
});
