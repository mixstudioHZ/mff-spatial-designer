import type { Project, SceneSetup } from '../../types';
import type { MffBridgeState } from '../../mff/types';
import type { CommandResult } from './types';
import { commandTimestamp } from './types';

export interface ImportMffBridgeInput {
  bridge: MffBridgeState;
  setup: SceneSetup;
}

/** Replace the active setup with the setup reconstructed from an MFF blocking CSV. */
export const importMffBridgeCommand = (
  project: Project,
  input: ImportMffBridgeInput,
): CommandResult => ({
  project: {
    ...project,
    mffProjectId: input.bridge.projectId,
    mffBridge: input.bridge,
    setups: [...project.setups.filter((setup) => setup.id !== project.activeSetupId), input.setup],
    activeSetupId: input.setup.id,
  },
  meta: {
    type: 'importMffBridge',
    entityId: input.setup.id,
    timestamp: commandTimestamp(),
    description: `Import MFF blocking data for ${input.setup.name}`,
  },
});
