import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { GithubService } from '@services/github.service';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';

interface GithubUser {
  avatar_url: string;
  html_url: string;
  login: string;
  name: string | null;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements OnInit {
  githubUser = signal<GithubUser | null>(null);
  currentUser$;
  bio = 'Soy Kevin Paniagua, estudiante de Programacion IV. Estoy armando AGON como una sala de juegos web con autenticacion, feedback visual, rankings y partidas guardadas en Supabase.';
  futureGame = {
    name: 'Firewall Breach',
    description: 'Juego propio de defensa de red: el jugador debe proteger nodos criticos, bloquear amenazas y sostener la integridad del sistema durante oleadas cada vez mas agresivas.',
    rules: [
      'Cada oleada genera amenazas sobre distintos nodos de la red.',
      'El jugador elige acciones defensivas para contener ataques antes de que bajen la integridad.',
      'Se gana si la red sobrevive hasta la ultima oleada con integridad suficiente.',
      'Se pierde si la integridad llega a cero o fallan demasiados nodos.',
    ],
    metrics: 'Guarda puntaje, tiempo, nivel maximo, integridad final, nodos salvados, nodos perdidos y precision.',
  };

  constructor(
    private github: GithubService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  async ngOnInit() {
    try {
      const user = await this.github.getUser('KevinFullAd');
      this.githubUser.set(user);
    } catch (error) {
      console.error('Error al traer usuario:', error);
      this.toastService.show('GITHUB_ERROR');
    }
  }
}
