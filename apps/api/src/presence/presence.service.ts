export interface PresenceEntry {
  draftId: string;
  userId: string;
  section?: string;
  lastSeen: number;
}

export interface PresenceService {
  heartbeat(draftId: string, userId: string, section?: string): Promise<PresenceEntry>;
  getActiveEditors(draftId: string, viewerUserId: string): Promise<PresenceEntry[]>;
}

/** How long a presence heartbeat is considered active. */
export const PRESENCE_TTL_MS = 30_000;

/**
 * Ephemeral in-memory presence registry for active draft editors.
 *
 * Heartbeats are keyed by draft and user and expire after a TTL so stale
 * editors naturally drop out of the active list.
 */
export class InMemoryPresenceService implements PresenceService {
  private readonly entries = new Map<string, Map<string, PresenceEntry>>();

  async heartbeat(draftId: string, userId: string, section?: string): Promise<PresenceEntry> {
    const now = Date.now();
    const entry: PresenceEntry = { draftId, userId, section, lastSeen: now };

    let byUser = this.entries.get(draftId);
    if (!byUser) {
      byUser = new Map();
      this.entries.set(draftId, byUser);
    }
    byUser.set(userId, entry);
    this.prune(draftId, now);

    return entry;
  }

  async getActiveEditors(draftId: string, viewerUserId: string): Promise<PresenceEntry[]> {
    const byUser = this.entries.get(draftId);
    if (!byUser) {
      return [];
    }

    const now = Date.now();
    const active: PresenceEntry[] = [];
    for (const [userId, entry] of byUser) {
      if (userId === viewerUserId) continue;
      if (now - entry.lastSeen > PRESENCE_TTL_MS) continue;
      active.push({ ...entry });
    }

    return active.sort((a, b) => a.lastSeen - b.lastSeen);
  }

  private prune(draftId: string, now: number): void {
    const byUser = this.entries.get(draftId);
    if (!byUser) return;

    for (const [userId, entry] of byUser) {
      if (now - entry.lastSeen > PRESENCE_TTL_MS) {
        byUser.delete(userId);
      }
    }

    if (byUser.size === 0) {
      this.entries.delete(draftId);
    }
  }
}
