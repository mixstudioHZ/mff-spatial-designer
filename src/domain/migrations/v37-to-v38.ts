/**
 * v37 -> v38 reserves optional MFF references on projects, scenes, elements,
 * waypoints and shots. Existing projects need no inferred values.
 */
import type { Project } from '../../types';

type UnknownRecord = Record<string, unknown>;

export const migrateV37ToV38 = (raw: UnknownRecord): Project => ({
  ...(raw as unknown as Project),
  schemaVersion: 38,
});
