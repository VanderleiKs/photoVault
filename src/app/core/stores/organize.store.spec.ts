import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import type { OrganizeCounts } from '../ipc/ipc';
import { fakeBackend, ok, pretendTauri } from '../testing/fake-backend';
import { LibraryStore } from './library.store';
import { OrganizeStore } from './organize.store';

const counts = (patch: Partial<OrganizeCounts> = {}): OrganizeCounts => ({
  exactGroups: 2,
  exactExtra: 3,
  visualGroups: 1,
  visualExtra: 1,
  similarGroups: 4,
  sequences: 1,
  lowQuality: 7,
  momentary: 2,
  screenshots: 9,
  analyzed: 100,
  pending: 0,
  review: 12,
  trash: 4,
  ...patch,
});

describe('OrganizeStore', () => {
  beforeEach(pretendTauri);

  it('maps counters to sidebar badges and reloads when the analysis changes', async () => {
    let current = counts();
    let onAnalysis: ((e: { payload: { libraryId: string } }) => void) | undefined;
    const fake = fakeBackend({
      listLibraries: () => ok([{ id: 'lib', uid: 'u', name: 'A', rootPath: '/a', connected: true, createdAt: '', lastScanAt: null }]),
      getLibraryStats: () => ok(null),
      getVolumeInfo: () => ok(null),
      getOrganizeCounts: () => ok(current),
    });
    (fake.useValue.events as Record<string, unknown>)['analysisUpdatedEvent'] = {
      listen: (cb: typeof onAnalysis) => {
        onAnalysis = cb;
        return Promise.resolve(() => {});
      },
    };
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), MessageService, fake] });
    await TestBed.inject(LibraryStore).load();
    const store = TestBed.inject(OrganizeStore);
    await store.init();
    await store.refresh();

    expect(store.badges()).toEqual({
      '/organize/duplicates': 3,
      '/organize/similar': 5,
      '/organize/low-quality': 7,
      '/organize/momentary': 2,
      '/organize/screenshots': 9,
      '/review': 12,
      '/trash': 4,
    });

    current = counts({ screenshots: 1 });
    onAnalysis!({ payload: { libraryId: 'lib' } });
    await new Promise((r) => setTimeout(r));
    expect(store.badges()['/organize/screenshots']).toBe(1);
    expect(store.version()).toBe(1);

    // Another library's analysis doesn't touch this one.
    onAnalysis!({ payload: { libraryId: 'other' } });
    expect(store.version()).toBe(1);
  });
});
