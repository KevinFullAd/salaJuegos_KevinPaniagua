import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

const gameNames: Record<string, string> = {
  ahorcado: 'Ahorcado',
  'mayor-menor': 'Mayor o Menor',
  preguntados: 'Preguntados',
  pasapalabra: 'Pasapalabra',
  'firewall-breach': 'Firewall Breach',
};

@Component({
  selector: 'app-game-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-placeholder.html',
  styleUrl: './game-placeholder.css',
})
export class GamePlaceholder {
  private route = inject(ActivatedRoute);

  slug = this.route.snapshot.paramMap.get('slug') ?? '';
  gameName = gameNames[this.slug] ?? 'Juego';
}
