import { storage } from '../storage';
import type { FeatureFlag, InsertFeatureFlag } from '@shared/schema';

export interface FeatureFlagService {
  getFeatureFlags(userId: string, workspaceId?: string): Promise<Record<string, boolean>>;
  setFeatureFlag(scopeType: 'user' | 'workspace', scopeId: string, key: string, value: boolean): Promise<void>;
  isFeatureEnabled(userId: string, workspaceId: string | undefined, flagKey: string): Promise<boolean>;
}

// Default feature flag values
const DEFAULT_FLAGS = {
  ai_extraction: true,
  recurrence: true,
  time_tracking: true,
  calendar_sync: false,
  pro_notes_visibility_policy: false,
};

class InMemoryFeatureFlagService implements FeatureFlagService {
  private flags: Map<string, Map<string, boolean>> = new Map();

  private getKey(scopeType: 'user' | 'workspace', scopeId: string): string {
    return `${scopeType}:${scopeId}`;
  }

  async getFeatureFlags(userId: string, workspaceId?: string): Promise<Record<string, boolean>> {
    const result = { ...DEFAULT_FLAGS };

    // Get user-level flags
    const userKey = this.getKey('user', userId);
    const userFlags = this.flags.get(userKey);
    if (userFlags) {
      for (const [key, value] of userFlags) {
        result[key] = value;
      }
    }

    // Get workspace-level flags (override user flags)
    if (workspaceId) {
      const workspaceKey = this.getKey('workspace', workspaceId);
      const workspaceFlags = this.flags.get(workspaceKey);
      if (workspaceFlags) {
        for (const [key, value] of workspaceFlags) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  async setFeatureFlag(scopeType: 'user' | 'workspace', scopeId: string, key: string, value: boolean): Promise<void> {
    const scopeKey = this.getKey(scopeType, scopeId);
    
    if (!this.flags.has(scopeKey)) {
      this.flags.set(scopeKey, new Map());
    }
    
    this.flags.get(scopeKey)!.set(key, value);
  }

  async isFeatureEnabled(userId: string, workspaceId: string | undefined, flagKey: string): Promise<boolean> {
    const flags = await this.getFeatureFlags(userId, workspaceId);
    return flags[flagKey] ?? DEFAULT_FLAGS[flagKey] ?? false;
  }
}

export const featureFlagService = new InMemoryFeatureFlagService();

// Initialize with some default flags for demo user
(async () => {
  await featureFlagService.setFeatureFlag('user', 'default-user', 'ai_extraction', true);
  await featureFlagService.setFeatureFlag('user', 'default-user', 'time_tracking', true);
  await featureFlagService.setFeatureFlag('user', 'default-user', 'recurrence', true);
})();