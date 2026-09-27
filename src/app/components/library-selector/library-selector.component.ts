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
    <div class="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div class="w-full max-w-md space-y-6">
        <!-- Header -->
        <div class="text-center space-y-3 py-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 mb-4">
            <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">PhotoVault</h1>
          <p class="text-zinc-400 text-sm">Organize suas fotos de forma inteligente</p>
        </div>

        <!-- Create Library Form -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <h2 class="text-lg font-semibold text-white">Nova Biblioteca</h2>

          <div class="space-y-4">
            <!-- Name Input -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-zinc-300">Nome da biblioteca</label>
              <input
                type="text"
                [(ngModel)]="libraryName"
                placeholder="Ex: Fotos Pessoais"
                class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <!-- Path Input -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-zinc-300">Pasta das fotos</label>
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="rootPath"
                  placeholder="Ex: C:\\Users\\vanderlei\\Pictures"
                  class="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  (click)="selectFolder()"
                  class="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition flex items-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span class="hidden sm:inline">Selecionar</span>
                </button>
              </div>
            </div>

            <!-- Create Button -->
            <button
              (click)="createLibrary()"
              [disabled]="!libraryName.trim() || !rootPath.trim() || isCreating()"
              class="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              @if (isCreating()) {
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
            <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wider">Bibliotecas</h2>
            <div class="space-y-2">
              @for (lib of libraries(); track lib.id) {
                <div
                  (click)="openLibrary(lib)"
                  class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/50 transition group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-medium text-white">{{ lib.name }}</h3>
                        <p class="text-xs text-zinc-500 truncate max-w-[200px]">{{ lib.root_path }}</p>
                      </div>
                    </div>
                    <span class="text-xs text-zinc-500">
                      {{ lib.last_scan_at ? 'Escaneado' : 'Nunca escaneado' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Footer -->
        <p class="text-center text-xs text-zinc-600 pt-4">
          Local-first · Privacy-first
        </p>
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
