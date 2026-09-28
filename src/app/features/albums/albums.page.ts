import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, type MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { MenuModule } from '@openng/optimus-ui/menu';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { formatCount } from '../../core/format';
import { errorMessage, previewUrl, type Album } from '../../core/ipc/ipc';
import { AlbumStore } from '../../core/stores/album.store';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { describeRule } from './album-rule';

/** Album list (PRD §18). */
@Component({
  selector: 'app-albums-page',
  imports: [FormsModule, RouterLink, ButtonModule, DialogModule, InputTextModule, MenuModule, SkeletonModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-semibold">Álbuns</h1>
        <p class="text-sm text-muted">Referências no catálogo: nenhum arquivo é copiado ou movido.</p>
      </div>
      <p-button label="Novo álbum" icon="pi pi-plus" (onClick)="openEditor(null)" />
    </header>

    <section class="p-6">
      @if (!albums.loaded()) {
        <div class="grid gap-5" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
          @for (i of [1, 2, 3, 4]; track i) {
            <p-skeleton styleClass="!aspect-[4/3] !h-auto !rounded-xl" />
          }
        </div>
      } @else if (!albums.albums().length) {
        <app-empty-state
          icon="pi pi-book"
          title="Nenhum álbum ainda"
          text="Crie um álbum e adicione fotos pela seleção (círculo no canto das miniaturas), ou use os filtros de Todas as fotos e salve como álbum inteligente."
        >
          <p-button label="Novo álbum" icon="pi pi-plus" (onClick)="openEditor(null)" />
        </app-empty-state>
      } @else {
        <ul class="grid gap-5" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
          @for (album of albums.albums(); track album.id) {
            <li class="group relative">
              <a [routerLink]="['/albums', album.id]" class="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-primary/60">
                <div class="relative aspect-[4/3] overflow-hidden rounded-xl bg-panel-2">
                  @if (album.cover; as cover) {
                    <img [src]="cover.thumbVersion ? preview(cover.id, cover.thumbVersion) : ''" alt="" loading="lazy" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  } @else {
                    <div class="flex size-full items-center justify-center text-muted"><i class="pi pi-images text-4xl opacity-50"></i></div>
                  }
                  @if (album.kind === 'smart') {
                    <span class="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white" title="Álbum inteligente: atualiza sozinho">
                      <i class="pi pi-bolt text-[10px]"></i>Inteligente
                    </span>
                  }
                </div>
                <p class="mt-2 truncate font-medium">{{ album.name }}</p>
                <p class="truncate text-xs text-muted">{{ count(album.mediaCount) }}{{ ruleText(album) }}</p>
              </a>
              <p-button
                icon="pi pi-ellipsis-v"
                [rounded]="true"
                size="small"
                severity="secondary"
                ariaLabel="Ações do álbum"
                styleClass="!absolute right-2 top-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                (onClick)="menuFor(album); menu.toggle($event)"
              />
            </li>
          }
        </ul>
      }
    </section>
    <p-menu #menu [model]="menuItems()" [popup]="true" appendTo="body" />

    <p-dialog [header]="editing() ? 'Renomear álbum' : 'Novo álbum'" [(visible)]="editorOpen" [modal]="true" [draggable]="false" styleClass="w-[24rem] max-w-[95vw]">
      <form (ngSubmit)="saveEditor()">
        <input pInputText name="name" class="w-full" placeholder="Nome do álbum" aria-label="Nome do álbum" [(ngModel)]="name" [ngModelOptions]="{ standalone: true }" maxlength="100" />
        @if (error()) {
          <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ error() }}</p>
        }
        <div class="mt-4 flex justify-end gap-2">
          <p-button label="Cancelar" [text]="true" severity="secondary" (onClick)="editorOpen.set(false)" />
          <p-button type="submit" [label]="editing() ? 'Salvar' : 'Criar'" icon="pi pi-check" [disabled]="!name().trim()" />
        </div>
      </form>
    </p-dialog>
  `,
})
export class AlbumsPage {
  protected readonly albums = inject(AlbumStore);
  private readonly confirm = inject(ConfirmationService);
  private readonly router = inject(Router);

  protected readonly preview = previewUrl;
  protected readonly menuItems = signal<MenuItem[]>([]);
  protected readonly editorOpen = signal(false);
  protected readonly editing = signal<Album | null>(null);
  protected readonly name = signal('');
  protected readonly error = signal<string | null>(null);

  protected count(n: number) {
    return `${formatCount(n)} ${n === 1 ? 'item' : 'itens'}`;
  }

  protected ruleText(album: Album) {
    const parts = describeRule(album.rule);
    return parts.length ? ` · ${parts.join(', ')}` : '';
  }

  protected menuFor(album: Album) {
    this.menuItems.set([
      { label: 'Renomear', icon: 'pi pi-pencil', command: () => this.openEditor(album) },
      { label: 'Excluir álbum', icon: 'pi pi-trash', command: () => this.remove(album) },
    ]);
  }

  protected openEditor(album: Album | null) {
    this.editing.set(album);
    this.name.set(album?.name ?? '');
    this.error.set(null);
    this.editorOpen.set(true);
  }

  protected async saveEditor() {
    try {
      const album = this.editing();
      if (album) {
        await this.albums.rename(album.id, this.name());
        this.editorOpen.set(false);
      } else {
        const created = await this.albums.create(this.name());
        this.editorOpen.set(false);
        void this.router.navigate(['/albums', created.id]);
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  private remove(album: Album) {
    this.confirm.confirm({
      header: 'Excluir álbum',
      message: `Excluir "${album.name}"? As fotos continuam na biblioteca; só o álbum some.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir álbum',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () => void this.albums.remove(album.id),
    });
  }
}
