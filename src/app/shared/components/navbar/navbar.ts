import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  currentUser$;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  async logout() {
    await this.authService.logout();
    this.toastService.show('LOGOUT_SUCCESS');
    this.router.navigate(['/login']);
  }
}
