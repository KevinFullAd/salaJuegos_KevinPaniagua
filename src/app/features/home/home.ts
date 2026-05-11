import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';
import { Card } from '@components/ui/card/card';
import { CyberButton } from '@components/ui/cyber-button/cyber-button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Card, CyberButton],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  currentUser$;

  juegos = [
    {
      codigo: 'A01',
      nombre: 'Ahorcado',
      desc: 'Adivina la palabra letra por letra.',
      estado: 'Sprint 3',
      ruta: '/games/ahorcado',
      color: 'var(--color-primary)',
    },
    {
      codigo: 'M02',
      nombre: 'Mayor o Menor',
      desc: 'Predice si la proxima carta sera mayor o menor.',
      estado: 'Sprint 3',
      ruta: '/games/mayor-menor',
      color: 'var(--color-success)',
    },
    {
      codigo: 'Q03',
      nombre: 'Preguntados',
      desc: 'Responde rapido y suma puntos por conocimiento.',
      estado: 'Sprint 4',
      ruta: '/games/preguntados',
      color: 'var(--color-warning)',
    },
    {
      codigo: 'F04',
      nombre: 'Firewall Breach',
      desc: 'Defiende una red bajo ataque y conserva su integridad.',
      estado: 'Sprint 4',
      ruta: '/games/firewall-breach',
      color: 'var(--color-accent)',
    },
  ];

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
