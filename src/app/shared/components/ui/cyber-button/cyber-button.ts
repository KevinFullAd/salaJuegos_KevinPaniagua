import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, icons, LucideIconData } from 'lucide-angular';
import { Card } from '../card/card';

@Component({
  selector: 'app-cyber-button',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cyber-button.html',
  styleUrl: './cyber-button.css'
})
export class CyberButton extends Card implements OnChanges {
  @Input() label = '';
  @Input() icon = '';
  @Input() iconSize = 16;

  @Input() variant: 'outline' | 'solid' = 'outline';
  @Input() color = 'var(--color-primary)';
  @Input() textColor = '';

  @Input() glow = false;
  @Input() hoverGlow = true;
  @Input() hoverScale = true;

  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() override bordered = true;
  @Input() override clickable = true;
  @Input() override cut = 14;

  resolvedIcon: LucideIconData | null = null;

  ngOnChanges() {
    if (this.icon) {
      const key = this.icon
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('') as keyof typeof icons;
      this.resolvedIcon = icons[key] ?? null;
    } else {
      this.resolvedIcon = null;
    }
  }

  get resolvedTextColor(): string {
    if (this.textColor) return this.textColor;
    return this.variant === 'solid' ? 'var(--color-on-primary)' : 'var(--color-text)';
  }

  get glowStyle(): string {
    if (!this.glow) return 'none';
    return `0 0 18px color-mix(in srgb, ${this.color} 55%, transparent)`;
  }
}
