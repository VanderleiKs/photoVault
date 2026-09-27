import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TauriService } from '../../services/tauri.service';
import { Library } from '../../models/photo';

@Component({
  selector: 'app-library-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-8">
      <div class="w-full max-w-lg space-y-8">
        <!-- Header -->
        <div class="text-center space-y-2">
          <h1 class="text-4xl font-bold tracking-tight">PhotoVault</h1>
          <p class="text-zinc-400">Organize suas fotos de forma inteligente</p>
        </div>

        <!-- Create Library Form -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 class="text-lg font-semibold">Nova Biblioteca</h2>

          <div class="space-y-3">
            <input
              type="text"
              [(ngModel)]="libraryName"
              placeholder="Nome da biblioteca (ex: Fotos Pessoais)"
              class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 transition"
            />

            <div class="flex gap-2">
              <input
                type="text"
                [(ngModel)]="rootPath"
                placeholder="Caminho da pasta (ex: E:\\Fotos)"
                class="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 transition"
              />
              <button
                (click)="selectFolder()"
                class="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
              >
                Selecionar
              </button>
            </div>

            <button
              (click)="createLibrary()"
              [disabled]="!libraryName.trim() || !rootPath.trim() || isCreating()"
              class="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition"
            >
              @if (isCreating()) {
                <span>Criando...</span>
              } @else {
                <span>Criar Biblioteca</span>
              }
            </button>
          </div>
        </div>

        <!-- Existing Libraries -->
        @if (libraries().length > 0) {
          <div class="space-y-3">
            <h2 class="text-lg font-semibold">Bibliotecas</h2>
            @for (lib of libraries(); track lib.id) {
              <div
                (click)="openLibrary(lib)"
                class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-zinc-600 transition"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium">{{ lib.name }}</h3>
                    <p class="text-sm text-zinc-400">{{ lib.root_path }}</p>
                  </div>
                  <span class="text-xs text-zinc-500">
                    {{ lib.last_scan_at ? 'Escaneado' : 'Nunca escaneado' }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class LibrarySelectorComponent implements OnInit {
  private tauri = inject(TauriService);
  private router = inject(Router);

  libraryName = '';
  rootPath = '';
  isCreating = signal(false);
  libraries = this.tauri.libraries;

  async ngOnInit() {
    await this.tauri.loadLibraries();
  }

  async selectFolder() {
    const path = prompt('Digite o caminho da pasta:');
    if (path) {
      this.rootPath = path;
    }
  }

  async createLibrary() {
    if (!this.libraryName.trim() || !this.rootPath.trim()) return;

    this.isCreating.set(true);
    try {
      const lib = await this.tauri.createLibrary(
        this.libraryName.trim(),
        this.rootPath.trim()
      );
      this.router.navigate(['/library', lib.id]);
    } catch (err) {
      console.error('Failed to create library:', err);
      alert('Erro ao criar biblioteca. Verifique o caminho e tente novamente.');
    } finally {
      this.isCreating.set(false);
    }
  }

  openLibrary(lib: Library) {
    this.router.navigate(['/library', lib.id]);
  }
}
