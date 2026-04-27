import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  styleUrl: './about.css'
})
export class About implements OnInit {

  githubUser = signal<GithubUser | null>(null);
  currentUser$;

  constructor(
    private github: GithubService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  async ngOnInit() {
    try {
      console.log('Llamando a GitHub...');

      const user = await this.github.getUser('KevinFullAd');
      this.githubUser.set(user);

      console.log('Respuesta:', user);
    } catch (error) {
      console.error('Error al traer usuario:', error);
      this.toastService.show('GITHUB_ERROR');
    }
  }

}
