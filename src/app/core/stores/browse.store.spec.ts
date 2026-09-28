import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import { AppStore } from './app.store';
import { BrowseStore } from './browse.store';
import { LibraryStore } from './library.store';
import { fakeBackend, ok, pretendTauri } from '../testing/fake-backend';

const library = (id: string) => ({ id, uid: id, name: id, rootPath: `/${id}`, connected: true, createdAt: '', lastScanAt: null });

describe('BrowseStore', () => {
  beforeEach(() => {
    pretendTauri();
    localStorage.clear();
  });

  it('persists filters per library, but not the search text', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        fakeBackend({
          listLibraries: () => ok([library('one'), library('two')]),
          getLibraryStats: () => ok(null),
          getVolumeInfo: () => ok(null),
        }),
      ],
    });
    const libraries = TestBed.inject(LibraryStore);
    const app = TestBed.inject(AppStore);
    const browse = TestBed.inject(BrowseStore);
    await libraries.load();
    TestBed.tick();

    browse.patch({ favorite: true, year: 2025 });
    browse.sort.set('oldest');
    browse.text.set('  gramado ');
    TestBed.tick();
    expect(browse.query()).toEqual({ filter: { favorite: true, year: 2025, text: 'gramado' }, sort: 'oldest' });
    expect(browse.filtered()).toBe(true);

    browse.patch({ year: null });
    TestBed.tick();
    expect(browse.filter()).toEqual({ favorite: true });

    // Another library starts clean…
    app.settings.update((s) => ({ ...s, activeLibraryId: 'two' }));
    TestBed.tick();
    expect(browse.query()).toEqual({ filter: {}, sort: 'newest' });

    // …and coming back restores the saved filters (the search is gone).
    app.settings.update((s) => ({ ...s, activeLibraryId: 'one' }));
    TestBed.tick();
    expect(browse.query()).toEqual({ filter: { favorite: true }, sort: 'oldest' });
  });

  it('edits a smart album rule without touching the saved filters', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        fakeBackend({ listLibraries: () => ok([library('one')]), getLibraryStats: () => ok(null), getVolumeInfo: () => ok(null) }),
      ],
    });
    const libraries = TestBed.inject(LibraryStore);
    const browse = TestBed.inject(BrowseStore);
    await libraries.load();
    TestBed.tick();
    browse.patch({ mediaType: 'video' });
    TestBed.tick();

    browse.editRule({ id: 'a1', name: 'Melhores', rule: { favorite: true, year: 2025, text: 'praia' } });
    TestBed.tick();
    expect(browse.query().filter).toEqual({ favorite: true, year: 2025, text: 'praia' });
    browse.patch({ year: 2024 });
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('photovault.browse.one')!).filter).toEqual({ mediaType: 'video' });

    browse.endEditing();
    TestBed.tick();
    expect(browse.editing()).toBeNull();
    expect(browse.query().filter).toEqual({ mediaType: 'video' });
  });
});
