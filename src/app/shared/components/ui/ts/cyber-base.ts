import { Directive, Input } from '@angular/core';

export type CyberCorner = 'TL' | 'TR' | 'BL' | 'BR';

@Directive()
export abstract class CyberBase {
  @Input() cut = 18;
  @Input() corners = 'all';

  get activeCorners(): Set<CyberCorner> {
    const map: Record<string, CyberCorner[]> = {
      all: ['TL', 'TR', 'BL', 'BR'],
      top: ['TL', 'TR'],
      bottom: ['BL', 'BR'],
      left: ['TL', 'BL'],
      right: ['TR', 'BR'],
    };

    const result = new Set<CyberCorner>();

    for (const token of this.corners.trim().split(/\s+/)) {
      const lower = token.toLowerCase();
      const upper = token.toUpperCase() as CyberCorner;

      if (map[lower]) {
        map[lower].forEach(corner => result.add(corner));
      } else if (['TL', 'TR', 'BL', 'BR'].includes(upper)) {
        result.add(upper);
      }
    }

    return result;
  }

  get clipPath(): string {
    const c = this.cut;
    const corners = this.activeCorners;
    const points: string[] = [];

    if (corners.has('TL')) {
      points.push(`0 ${c}px`, `${c}px 0`);
    } else {
      points.push('0 0');
    }

    if (corners.has('TR')) {
      points.push(`calc(100% - ${c}px) 0`, `100% ${c}px`);
    } else {
      points.push('100% 0');
    }

    if (corners.has('BR')) {
      points.push(`100% calc(100% - ${c}px)`, `calc(100% - ${c}px) 100%`);
    } else {
      points.push('100% 100%');
    }

    if (corners.has('BL')) {
      points.push(`${c}px 100%`, `0 calc(100% - ${c}px)`);
    } else {
      points.push('0 100%');
    }

    return `polygon(${points.join(', ')})`;
  }
}
