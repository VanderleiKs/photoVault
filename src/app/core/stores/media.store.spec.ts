import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import type { MediaItem, MediaPage } from '../ipc/ipc';
import { fakeBackend, ok, pretendTauri } from '../testing/fake-backend';
import { MediaStore } from './media.store';

const item = (id: string): MediaItem => ({
  id,
  libraryId: 'lib',
  relativePath: `${id}.jpg`,
  filename: `${id}.jpg`,
  extension: 'jpg',
  mediaType: 'image',
  fileSize: 1,
  width: null,
  height: null,
  durationMs: null,
  capturedAt: null,
  dateSource: null,
  cameraMake: null,
  cameraModel: null,
  isFavorite: false,
  indexedAt: '',
});

describe('MediaStore', () => {
  beforeEach(pretendTauri);

  function setup(listMedia: (libraryId: string, cursor: string | null) => Promise<unknown>) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        fakeBackend({ listLibraries: () => ok([]), listMedia }),
      ],
    });
    return TestBed.inject(MediaStore);
  }

  it('follows the cursor until the last page', async () => {
    const pages: Record<string, MediaPage> = {
      start: { items: [item('a'), item('b')], nextCursor: 'c1' },
      c1: { items: [item('c')], nextCursor: null },
    };
    const store = setup((_, cursor) => ok(pages[cursor ?? 'start']));

    await store.reset('lib');
    expect(store.hasMore()).toBe(true);
    await store.loadMore();
    expect(store.items().map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(store.hasMore()).toBe(false);

    await store.loadMore(); // no-op at the end
    expect(store.items()).toHaveLength(3);
  });

  it('drops a late page from the previous library', async () => {
    let releaseOld!: () => void;
    const store = setup((libraryId) =>
      libraryId === 'old'
        ? new Promise((resolve) => {
            releaseOld = () => resolve({ status: 'ok', data: { items: [item('stale')], nextCursor: null } });
          })
        : ok({ items: [item('fresh')], nextCursor: null }),
    );

    const pending = store.reset('old');
    await store.reset('new');
    releaseOld();
    await pending;
    expect(store.items().map((m) => m.id)).toEqual(['fresh']);
  });
});
