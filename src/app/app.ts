import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { Header } from './layout/header/header';

@Component({
  selector: 'dg-root',
  imports: [RouterOutlet, Header],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  host: { class: 'block min-h-screen bg-slate-950 text-slate-100' },
})
export class App {
  protected readonly auth = inject(AuthService);
}
