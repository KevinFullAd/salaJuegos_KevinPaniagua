import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';
import { CyberButton } from '@components/ui/cyber-button/cyber-button';
import { Card } from '@components/ui/card/card';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CyberButton, Card, RouterLink, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  submitted = signal(false);
  showPassword = signal(false);
  isSubmitting = signal(false);
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;
  quickAccessUsers = [
    { label: 'Jugador 1', email: 'test1@test.com', password: '123456' },
    { label: 'Jugador 2', email: 'test3@test.com', password: '123456' },
    { label: 'Admin', email: 'admin@admin.admin', password: 'adminadmin' },
  ];
  fieldCardStyles = {
    padding: '0',
    background: 'var(--color-surface-elevated)',
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  async fillQuickAccess(user: { email: string; password: string }) {
    if (this.isSubmitting()) return;
    this.loginForm.patchValue({ email: user.email, password: user.password });
    this.submitted.set(false);
    await this.onSubmit();
  }

  async onSubmit() {
    if (this.isSubmitting()) return;

    this.submitted.set(true);

    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      this.toastService.show('FORM_INVALID');
      return;
    }

    const { email, password } = this.loginForm.value as { email: string; password: string };
    this.isSubmitting.set(true);
    try {
      await this.authService.login(email, password);
      this.toastService.show('LOGIN_SUCCESS');
      void this.router.navigate(['/']);
    } catch {
      this.toastService.show('LOGIN_ERROR');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
