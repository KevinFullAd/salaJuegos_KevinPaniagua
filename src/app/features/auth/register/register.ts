import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';
import { CyberButton } from '@components/ui/cyber-button/cyber-button';
import { Card } from '@components/ui/card/card';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CyberButton, Card],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  submitted = false;
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
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    this.submitted = true;
    if (this.registerForm.valid) {
      try {
        await this.authService.register(this.registerForm.value);
        this.toastService.show('REGISTER_SUCCESS');
        this.router.navigate(['/']);
      } catch {
        this.toastService.show('REGISTER_ERROR');
      }
    } else {
      this.registerForm.markAllAsTouched();
      this.toastService.show('FORM_INVALID');
    }
  }
}
