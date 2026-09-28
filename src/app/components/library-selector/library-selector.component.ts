import { Component, OnInit, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { TauriService } from "../../services/tauri.service";
import { Library } from "../../models/photo";
import { ButtonModule } from "@openng/optimus-ui/button";
import { InputTextModule } from "@openng/optimus-ui/inputtext";
import { CardModule } from "@openng/optimus-ui/card";

@Component({
  selector: "app-library-selector",
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, CardModule],
  template: `
    <div
      class="d-flex align-items-center justify-content-center p-4"
      style="min-height: 100vh; background-color: var(--pv-bg);"
    >
      <div style="width: 100%; max-width: 480px;">
        <!-- Header -->
        <div class="text-center mb-4">
          <div
            class="d-inline-flex align-items-center justify-content-center mb-3"
            style="width: 64px; height: 64px; background: rgba(59, 130, 246, 0.15); border-radius: 1rem;"
          >
            <i
              class="pi pi-images"
              style="font-size: 1.75rem; color: var(--pv-accent);"
            ></i>
          </div>
          <h1 class="fw-bold mb-1" style="color: var(--pv-text);">
            PhotoVault
          </h1>
          <p class="mb-0" style="color: var(--pv-text-muted);">
            Organize suas fotos de forma inteligente
          </p>
        </div>

        <!-- Create Library Form -->
        <div
          class="p-card"
          style="width: 100% !important; max-width: 100% !important;"
        >
          <div class="p-card-body">
            <h5 class="fw-semibold mb-3" style="color: var(--pv-text);">
              Nova Biblioteca
            </h5>

            <div class="mb-3">
              <label
                class="form-label small fw-medium"
                style="color: var(--pv-text-muted);"
                >Nome da biblioteca</label
              >
              <input
                type="text"
                pInputText
                [(ngModel)]="libraryName"
                placeholder="Ex: Fotos Pessoais"
                class="w-100"
              />
            </div>

            <div class="mb-3">
              <label
                class="form-label small fw-medium"
                style="color: var(--pv-text-muted);"
                >Pasta das fotos</label
              >
              <div class="input-group d-flex gap-2">
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="rootPath"
                  placeholder="Ex: C:\\Users\\vanderlei\\Pictures"
                  class="flex-grow-1"
                />
                <button
                  pButton
                  type="button"
                  icon="pi pi-folder"
                  (click)="selectFolder()"
                  class="p-button-secondary"
                  title="Selecionar pasta"
                >
                  Selecionar
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="alert alert-danger py-2 small d-flex align-items-center gap-2">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ error() }}</span>
              </div>
            }

            <button
              pButton
              type="button"
              label="Criar Biblioteca"
              icon="pi pi-plus"
              [disabled]="
                !libraryName.trim() || !rootPath.trim() || isCreating()
              "
              (click)="createLibrary()"
              class="w-100 p-button-primary"
            ></button>
          </div>
        </div>

        <!-- Existing Libraries -->
        @if (libraries().length > 0) {
          <div class="mt-4">
            <h6
              class="fw-semibold mb-2 text-uppercase"
              style="color: var(--pv-text-muted); font-size: 0.75rem; letter-spacing: 0.05em;"
            >
              Bibliotecas
            </h6>
            <div class="d-flex flex-column gap-2">
              @for (lib of libraries(); track lib.id) {
                <div
                  class="p-card"
                  (click)="openLibrary(lib)"
                  style="cursor: pointer; transition: border-color 0.2s; width: 100% !important; max-width: 100% !important;"
                  (mouseenter)="libHover = lib.id"
                  (mouseleave)="libHover = null"
                  [style.border-color]="
                    libHover === lib.id
                      ? 'var(--pv-accent)'
                      : 'var(--pv-border)'
                  "
                >
                  <div class="p-card-body py-3">
                    <div
                      class="d-flex align-items-center justify-content-between"
                    >
                      <div class="d-flex align-items-center gap-3">
                        <div
                          class="d-flex align-items-center justify-content-center"
                          style="width: 40px; height: 40px; background: rgba(59, 130, 246, 0.15); border-radius: 0.5rem;"
                        >
                          <i
                            class="pi pi-folder"
                            style="color: var(--pv-accent);"
                          ></i>
                        </div>
                        <div>
                          <div class="fw-medium" style="color: var(--pv-text);">
                            {{ lib.name }}
                          </div>
                          <div
                            class="small text-truncate"
                            style="color: var(--pv-text-muted); max-width: 200px;"
                          >
                            {{ lib.root_path }}
                          </div>
                        </div>
                      </div>
                      <span
                        class="badge"
                        [style.background]="
                          lib.last_scan_at
                            ? 'var(--pv-accent)'
                            : 'var(--pv-surface-alt)'
                        "
                        [style.color]="
                          lib.last_scan_at ? 'white' : 'var(--pv-text-muted)'
                        "
                      >
                        {{ lib.last_scan_at ? "Escaneado" : "Nunca escaneado" }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Footer -->
        <p
          class="text-center mt-4 mb-0"
          style="color: var(--pv-text-muted); font-size: 0.75rem;"
        >
          Local-first · Privacy-first
        </p>
      </div>
    </div>
  `,
})
export class LibrarySelectorComponent implements OnInit {
  private tauri = inject(TauriService);
  private router = inject(Router);

  libraryName = "";
  rootPath = "";
  isCreating = signal(false);
  error = signal<string | null>(null);
  libHover: string | null = null;
  libraries = this.tauri.libraries;

  async ngOnInit() {
    try {
      await this.tauri.loadLibraries();
    } catch (err) {
      this.error.set(`Não foi possível carregar as bibliotecas: ${err}`);
    }
  }

  async selectFolder() {
    try {
      const path = await this.tauri.pickFolder();
      if (path) {
        this.rootPath = path;
      }
    } catch (err) {
      this.error.set(`Não foi possível abrir o seletor de pastas: ${err}`);
    }
  }

  async createLibrary() {
    if (!this.libraryName.trim() || !this.rootPath.trim()) return;

    this.isCreating.set(true);
    this.error.set(null);
    try {
      const lib = await this.tauri.createLibrary(
        this.libraryName.trim(),
        this.rootPath.trim(),
      );
      this.router.navigate(["/library", lib.id]);
    } catch (err) {
      this.error.set(String(err));
    } finally {
      this.isCreating.set(false);
    }
  }

  openLibrary(lib: Library) {
    this.router.navigate(["/library", lib.id]);
  }
}
