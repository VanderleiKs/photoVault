import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import type { MediaPage, MediaQuery } from '../ipc/ipc';
import { fakeBackend, mediaItem as item, ok, pretendTauri } from '../testing/fake-backend';
import { GalleryStore, matchesLocally } from './gallery.store';
import { LibraryStore } from './library.store';
import { MediaBus } from './media-bus';

type ListMedia = (libraryId: string, query: MediaQuery, cursor: string | null, limit: number) => Promise<unknown>;

describe('GalleryStore', () => {
  beforeEach(pretendTauri);

  function setup(listMedia: ListMedia) {
    const calls: MediaQuery[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        GalleryStore,
        fakeBackend({
          listLibraries: () => ok([{ id: 'lib', uid: 'u', name: 'A', rootPath: '/a', connected: true, createdAt: '', lastScanAt: null }]),
          getLibraryStats: () => ok({ photos: 0, videos: 0, favorites: 0, totalBytes: 0 }),
          getVolumeInfo: () => ok(null),
          countMedia: () => ok({ total: 3, photos: 3, videos: 0 }),
          listMedia: (libraryId: string, query: MediaQuery, cursor: string | null, limit: number) => {
            calls.push(query);
            return listMedia(libraryId, query, cursor, limit);
          },
        }),
      ],
    });
    return { store: TestBed.inject(GalleryStore), calls };
  }

  async function settle() {
    TestBed.tick();
    await new Promise((r) => setTimeout(r));
    TestBed.tick();
  }

  it('pages with the combined query and follows the cursor', async () => {
    const pages: Record<string, MediaPage> = {
      start: { items: [item('a'), item('b')], nextCursor: 'c1' },
      c1: { items: [item('c')], nextCursor: null },
    };
    const { store, calls } = setup((_, __, cursor) => ok(pages[cursor ?? 'start']));
    await TestBed.inject(LibraryStore).load();
    store.fixed.set({ favorite: true });
    store.userQuery.set({ filter: { year: 2025, favorite: false }, sort: 'name' });
    await settle();

    expect(store.items().map((m) => m.id)).toEqual(['a', 'b']);
    // The page's fixed filter wins over the user's.
    expect(calls.at(-1)).toEqual({ filter: { year: 2025, favorite: true }, sort: 'name' });
    await store.loadMore();
    expect(store.items().map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(store.hasMore()).toBe(false);
    expect(store.count()?.total).toBe(3);
  });

  it('drops a late page from a previous query', async () => {
    let release!: () => void;
    const { store } = setup((_, query) =>
      query.filter?.year === 2020
        ? new Promise((resolve) => {
            release = () => resolve({ status: 'ok', data: { items: [item('stale')], nextCursor: null } });
          })
        : ok({ items: [item('fresh')], nextCursor: null }),
    );
    await TestBed.inject(LibraryStore).load();
    store.userQuery.set({ filter: { year: 2020 } });
    await settle();
    store.userQuery.set({ filter: { year: 2021 } });
    await settle();
    release();
    await settle();
    expect(store.items().map((m) => m.id)).toEqual(['fresh']);
  });

  it('patches edited items and drops those leaving the page', async () => {
    const { store } = setup(() =>
      ok({ items: [item('a', { isFavorite: true }), item('b', { isFavorite: true }), item('c', { isFavorite: true })], nextCursor: null }),
    );
    await TestBed.inject(LibraryStore).load();
    store.fixed.set({ favorite: true });
    await settle();

    const bus = TestBed.inject(MediaBus);
    bus.publish([item('a', { isFavorite: true, thumbVersion: 2 }), item('b', { isFavorite: false })], ['c']);
    TestBed.tick();
    expect(store.items().map((m) => [m.id, m.thumbVersion])).toEqual([['a', 2]]);
  });

  it('drops trashed items from galleries and reviewed ones from Review', () => {
    const trashed = item('t', { inTrash: true });
    expect(matchesLocally({}, trashed)).toBe(false);
    expect(matchesLocally({ trashed: true }, trashed)).toBe(true);
    expect(matchesLocally({ trashed: true }, item('a'))).toBe(false);
    expect(matchesLocally({ review: true }, item('a', { reviewPriority: 900 }))).toBe(true);
    expect(matchesLocally({ review: true }, item('a', { reviewPriority: null }))).toBe(false);
    expect(matchesLocally({ reviewReason: 'BLURRY' }, item('a', { reviewPriority: null }))).toBe(false);
  });
});
