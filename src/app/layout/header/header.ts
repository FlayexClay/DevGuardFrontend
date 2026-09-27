import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'dg-header',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  host: { class: 'block border-b border-slate-800 bg-slate-900/60 backdrop-blur' },
})
export class Header {
  protected readonly auth = inject(AuthService);

  protected readonly displayName = computed(() => {
    const user = this.auth.user();
    return user?.name ?? user?.email ?? '';
  });

  protected readonly subtitle = computed(() => {
    const user = this.auth.user();
    return [user?.organization, user?.roles.join(', ')].filter(Boolean).join(' · ');
  });
}
