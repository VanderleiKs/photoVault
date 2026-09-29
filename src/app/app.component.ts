import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from '@openng/optimus-ui/confirmdialog';
import { ToastModule } from '@openng/optimus-ui/toast';
import { AlbumPickerComponent } from './shared/album-picker.component';
import { ConfirmActionComponent } from './shared/confirm-action.component';

/** Overlays live here so they work in the shell and in the full-screen viewer. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule, AlbumPickerComponent, ConfirmActionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <p-toast position="bottom-right" />
    <p-confirmdialog />
    <app-album-picker />
    <app-confirm-action />
  `,
})
export class AppComponent {}
