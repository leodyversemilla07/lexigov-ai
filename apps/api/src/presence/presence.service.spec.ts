import { InMemoryPresenceService, PRESENCE_TTL_MS } from './presence.service';

describe('InMemoryPresenceService', () => {
  let service: InMemoryPresenceService;

  beforeEach(() => {
    service = new InMemoryPresenceService();
    jest.useFakeTimers();
  });

  it('registers a heartbeat for a draft and user', async () => {
    const entry = await service.heartbeat('draft_1', 'user_1', 'SECTION 3');

    expect(entry.draftId).toBe('draft_1');
    expect(entry.userId).toBe('user_1');
    expect(entry.section).toBe('SECTION 3');
    expect(entry.lastSeen).toBeGreaterThan(0);
  });

  it('returns only active editors excluding the viewer', async () => {
    await service.heartbeat('draft_1', 'user_1');
    await service.heartbeat('draft_1', 'user_2');

    const active = await service.getActiveEditors('draft_1', 'user_1');

    expect(active).toHaveLength(1);
    expect(active[0]?.userId).toBe('user_2');
  });

  it('returns no editors when the draft has no presence', async () => {
    const active = await service.getActiveEditors('draft_missing', 'user_1');

    expect(active).toEqual([]);
  });

  it('expires stale presence entries', async () => {
    await service.heartbeat('draft_1', 'user_2');
    jest.setSystemTime(new Date(Date.now() + PRESENCE_TTL_MS + 1));

    const active = await service.getActiveEditors('draft_1', 'user_1');

    expect(active).toEqual([]);
  });
});
