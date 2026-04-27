import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CyberBase } from '../ts/cyber-base';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card extends CyberBase {
  @Input() clickable = false;
  @Input() bordered = false;
  @Input() borderColor = '#00e5ff';
  @Input() styles: { [key: string]: string } = {};
  @Input() customClass = '';
}
