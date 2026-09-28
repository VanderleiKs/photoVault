import { Injector, provideZonelessChangeDetection, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { mediaItem as item } from '../testing/fake-backend';
import { MediaBus, type MediaUpdate } from './media-bus';

describe('MediaBus', () => {
  it('delivers every publication, even several before effects run', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const bus = TestBed.inject(MediaBus);
    const received: MediaUpdate[] = [];
    runInInjectionContext(TestBed.inject(Injector), () => bus.subscribe((u) => received.push(u)));
    TestBed.tick();

    // Two IPC responses land before change detection (the bug a plain signal had).
    bus.publish([item('a', { isFavorite: true })]);
    bus.publish([item('b', { isFavorite: true })]);
    TestBed.tick();
    expect(received).toHaveLength(1);
    expect(received[0].items.map((m) => m.id).sort()).toEqual(['a', 'b']);

    // Later edits win; removals stick.
    bus.publish([item('a', { isFavorite: false })]);
    bus.publish([item('c')], ['c']);
    TestBed.tick();
    expect(received[1].items.map((m) => [m.id, m.isFavorite])).toEqual([['a', false]]);
    expect(received[1].removedIds).toEqual(['c']);
  });
});
