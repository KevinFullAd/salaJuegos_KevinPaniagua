import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';
import { CyberButton } from '@components/ui/cyber-button/cyber-button';
import { Card } from '@components/ui/card/card';
import { RouterLink } from '@angular/router';
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
  submitted = false;
  showPassword = false;
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;
  fieldCardStyles = {
    padding: '0',
    background: 'var(--color-surface-elevated)',
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ){
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    })
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        this.authService.login(email, password);
        this.toastService.show('LOGIN_SUCCESS');
        console.log('LOGIN OK', this.loginForm.value);
      } catch {
        this.toastService.show('LOGIN_ERROR');
      }
    } else {
      this.loginForm.markAllAsTouched();
      this.toastService.show('FORM_INVALID');
    }
  }
}
