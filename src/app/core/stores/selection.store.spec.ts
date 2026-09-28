import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import { fakeBackend, mediaItem as item, ok } from '../testing/fake-backend';
import { MediaBus } from './media-bus';
import { SelectionStore } from './selection.store';

describe('SelectionStore', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), MessageService, fakeBackend({ listLibraries: () => ok([]) })],
    });
    const store = TestBed.inject(SelectionStore);
    TestBed.tick();
    return store;
  }

  const order = ['a', 'b', 'c', 'd', 'e'].map((id) => item(id));

  it('toggles and extends ranges from the last click', () => {
    const s = setup();
    s.toggle('b');
    s.extendTo('d', order);
    expect([...s.ids()]).toEqual(['b', 'c', 'd']);
    s.toggle('c');
    expect([...s.ids()].sort()).toEqual(['b', 'd']);
    // Backwards range from the new anchor (c).
    s.extendTo('a', order);
    expect([...s.ids()].sort()).toEqual(['a', 'b', 'c', 'd']);
    s.clear();
    expect(s.active()).toBe(false);
  });

  it('follows edits and merges of the focused item', () => {
    const s = setup();
    s.focus(item('a'));
    s.toggle('b');
    const bus = TestBed.inject(MediaBus);
    bus.publish([item('a', { isFavorite: true })]);
    TestBed.tick();
    expect(s.focused()?.isFavorite).toBe(true);
    bus.publish([], ['a', 'b']);
    TestBed.tick();
    expect(s.focused()).toBeNull();
    expect(s.count()).toBe(0);
  });
});
