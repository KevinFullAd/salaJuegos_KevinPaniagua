import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Card } from '@components/ui/card/card';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  juegos = [
    { nombre: 'Memoria', desc: 'Poné a prueba tu memoria', icon: '🧠' },
    { nombre: 'Ahorcado', desc: 'Adiviná la palabra', icon: '🔤' },
    { nombre: 'Preguntas', desc: 'Demostrá lo que sabés', icon: '❓' }
  ];
}
