import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import type { AppSettings, Library } from '../ipc/ipc';
import { fakeBackend, ok, pretendTauri } from '../testing/fake-backend';
import { AppStore } from './app.store';
import { LibraryStore } from './library.store';

const lib = (id: string): Library => ({
  id,
  uid: `uid-${id}`,
  name: id,
  rootPath: `/fotos/${id}`,
  createdAt: '',
  lastScanAt: null,
  connected: true,
});

describe('LibraryStore', () => {
  let libraries: Library[];
  let saved: AppSettings[];

  beforeEach(() => {
    pretendTauri();
    libraries = [lib('a'), lib('b')];
    saved = [];
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        fakeBackend({
          listLibraries: () => ok(libraries),
          getLibraryStats: () => ok({ photos: 1, videos: 0, favorites: 0, totalBytes: 10 }),
          getVolumeInfo: () => ok(null),
          saveSettings: (s: AppSettings) => {
            saved.push(s);
            return ok(s);
          },
          deleteLibrary: (id: string) => {
            libraries = libraries.filter((l) => l.id !== id);
            return ok(null);
          },
        }),
      ],
    });
  });

  it('falls back to the first library when the saved one is gone', async () => {
    const store = TestBed.inject(LibraryStore);
    TestBed.inject(AppStore).settings.update((s) => ({ ...s, activeLibraryId: 'missing' }));
    await store.load();
    expect(store.activeId()).toBe('a');
  });

  it('persists the active library', async () => {
    const store = TestBed.inject(LibraryStore);
    await store.load();
    await store.setActive('b');
    expect(store.activeId()).toBe('b');
    expect(saved.at(-1)?.activeLibraryId).toBe('b');
  });

  it('switches away from a removed active library', async () => {
    const store = TestBed.inject(LibraryStore);
    await store.load();
    await store.setActive('a');
    await store.remove('a');
    expect(store.libraries().map((l) => l.id)).toEqual(['b']);
    expect(store.activeId()).toBe('b');
    expect(saved.at(-1)?.activeLibraryId).toBe('b');
  });
});
