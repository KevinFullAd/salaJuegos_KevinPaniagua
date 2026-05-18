import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '@services/supabase';
import { ToastService } from '@services/toast.service';

// ─── Tipos ───────────────────────────────────────────────────────────────────

// Estado de salud de un subnodo individual
export type SubnodeStatus = 'safe' | 'warning' | 'compromised';

// Estado de salud de un nodo completo
export type NodeStatus = 'safe' | 'warning' | 'fallen';

export interface Subnode {
  id: string;
  status: SubnodeStatus;
  // Segundos que faltan antes de pasar de 'warning' a 'compromised' automáticamente
  timeToCompromise: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  // Posición en el SVG del grafo (porcentaje del viewBox)
  x: number;
  y: number;
  subnodes: Subnode[];
  status: NodeStatus;
}

// Dificultad elegida por el jugador al inicio
export type Difficulty = 'easy' | 'normal' | 'hard';

export type GameState = 'idle' | 'playing' | 'wave-break' | 'finished';

// ─── Configuración por dificultad ────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { nodeCount: number; scoreMultiplier: number; label: string }
> = {
  easy:   { nodeCount: 4, scoreMultiplier: 0.5,  label: 'Fácil'    },
  normal: { nodeCount: 6, scoreMultiplier: 0.75, label: 'Normal'   },
  hard:   { nodeCount: 8, scoreMultiplier: 1.0,  label: 'Difícil'  },
};

// Tiempo (seg) que tarda un subnodo en warning en comprometerse, por oleada
const WARNING_TTL_BY_WAVE = [10, 9, 8, 7, 6];

// Cuántos subnodos se atacan simultáneamente por oleada
const ATTACKS_BY_WAVE = [1, 2, 2, 3, 3];

const TOTAL_WAVES = 5;
const WAVE_DURATION = 20;   // segundos activos por oleada
const BREAK_DURATION = 5;   // segundos de respiro entre oleadas

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Devuelve n índices únicos aleatorios dentro de [0, max)
function randomUniqueIndices(max: number, n: number): number[] {
  const pool = Array.from({ length: max }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, max));
}

// Posiciones predefinidas para cada cantidad de nodos (distribuidas en círculo)
function getNodePositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const cx = 50, cy = 50, r = 35;
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
    });
  }
  return positions;
}

// Node labels temáticos de red
const NODE_LABELS = ['FW', 'DB', 'API', 'CDN', 'DNS', 'AUTH', 'LB', 'VPN'];

@Component({
  selector: 'app-firewall-breach',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './firewall-breach.html',
  styleUrls: ['./firewall-breach.css'],
})
export class FirewallBreachComponent implements OnInit, OnDestroy {

  // ─── Estado de la UI ───────────────────────────────────────────────────────

  gameState = signal<GameState>('idle');
  difficulty = signal<Difficulty>('normal');

  // Nodo actualmente seleccionado (para mostrar el panel de acciones)
  selectedNodeId = signal<string | null>(null);

  // ─── Estado de la partida ──────────────────────────────────────────────────

  nodes = signal<NetworkNode[]>([]);
  currentWave = signal(0);
  // Integridad del sistema: 0-100, baja cuando un subnodo se compromete
  integrity = signal(100);
  // Tiempo restante en la fase actual (oleada o descanso)
  phaseTimeLeft = signal(WAVE_DURATION);

  // Contadores de precisión: cuántas acciones tomó el jugador
  actionsTotal = signal(0);
  actionsSuccessful = signal(0);

  // Nodos completamente caídos
  nodesFallen = signal(0);
  nodesSaved = signal(0);

  // Tiempo total jugado
  private startedAt = 0;
  private resultSaved = false;

  // ─── Intervalos y timeouts activos ────────────────────────────────────────

  private gameTick?: ReturnType<typeof setInterval>;
  private attackTick?: ReturnType<typeof setInterval>;
  private attackInitTimeout?: ReturnType<typeof setTimeout>;

  // ─── Computed ──────────────────────────────────────────────────────────────

  // Nodo seleccionado resuelto desde la lista
  readonly selectedNode = computed(() => {
    const id = this.selectedNodeId();
    return this.nodes().find(n => n.id === id) ?? null;
  });

  // Conexiones entre nodos para dibujar las líneas del grafo
  // Conecta cada nodo con el siguiente y el primero con el último (anillo)
  readonly connections = computed(() => {
    const ns = this.nodes();
    if (ns.length < 2) return [];
    return ns.map((n, i) => ({
      from: n,
      to: ns[(i + 1) % ns.length],
    }));
  });

  // Porcentaje de integridad como string para la barra
  readonly integrityPct = computed(() => `${this.integrity()}%`);

  // Color de la barra de integridad según nivel
  readonly integrityColor = computed(() => {
    const v = this.integrity();
    if (v > 60) return 'var(--color-success)';
    if (v > 30) return 'var(--color-warning)';
    return 'var(--color-danger)';
  });

  // Label de la dificultad activa
  readonly difficultyLabel = computed(
    () => DIFFICULTY_CONFIG[this.difficulty()].label
  );

  constructor(
    private supabase: SupabaseService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.clearAllIntervals();
  }

  // ─── Control del juego ─────────────────────────────────────────────────────

  selectDifficulty(d: Difficulty): void {
    this.difficulty.set(d);
  }

  startGame(): void {
    this.buildNetwork();
    this.currentWave.set(0);
    this.integrity.set(100);
    this.actionsTotal.set(0);
    this.actionsSuccessful.set(0);
    this.nodesFallen.set(0);
    this.nodesSaved.set(0);
    this.resultSaved = false;
    this.startedAt = Date.now();
    this.selectedNodeId.set(null);
    this.gameState.set('playing');
    this.startWave();
  }

  // Construye la red de nodos según la dificultad seleccionada
  private buildNetwork(): void {
    const { nodeCount } = DIFFICULTY_CONFIG[this.difficulty()];
    const positions = getNodePositions(nodeCount);

    const built: NetworkNode[] = positions.map((pos, i) => ({
      id: `node-${i}`,
      label: NODE_LABELS[i],
      x: pos.x,
      y: pos.y,
      status: 'safe',
      subnodes: [
        { id: `node-${i}-sub-0`, status: 'safe', timeToCompromise: 0 },
        { id: `node-${i}-sub-1`, status: 'safe', timeToCompromise: 0 },
      ],
    }));

    this.nodes.set(built);
  }

  // ─── Lógica de oleadas ─────────────────────────────────────────────────────

  private startWave(): void {
    this.clearAllIntervals();
    const waveIndex = this.currentWave();
    this.phaseTimeLeft.set(WAVE_DURATION);

    // Tick de cuenta regresiva de la oleada
    this.gameTick = setInterval(() => {
      try {
        const t = this.phaseTimeLeft() - 1;
        this.phaseTimeLeft.set(t);
        this.tickWarningNodes();
        if (t <= 0) this.endWave();
      } catch (err) {
        console.error('[FirewallBreach] Error en gameTick:', err);
        this.clearAllIntervals();
      }
    }, 1000);

    // Lanzar ataques periódicamente durante la oleada
    const attackCount = ATTACKS_BY_WAVE[waveIndex] ?? 3;
    const attackInterval = Math.floor(WAVE_DURATION / (attackCount + 1)) * 1000;
    this.attackTick = setInterval(() => {
      try {
        this.launchAttacks(waveIndex);
      } catch (err) {
        console.error('[FirewallBreach] Error en attackTick:', err);
      }
    }, attackInterval);

    // Primer ataque al inicio de la oleada (referencia guardada para poder limpiarla)
    this.attackInitTimeout = setTimeout(() => {
      try {
        this.launchAttacks(waveIndex);
      } catch (err) {
        console.error('[FirewallBreach] Error en ataque inicial:', err);
      }
    }, 800);
  }

  // Selecciona subnodos aleatorios seguros y los pone en 'warning'
  private launchAttacks(waveIndex: number): void {
    const nodes = this.nodes();
    // Recopilar todos los subnodos que todavía están en 'safe'
    const safeTargets: { nodeIdx: number; subIdx: number }[] = [];
    nodes.forEach((node, ni) => {
      if (node.status === 'fallen') return;
      node.subnodes.forEach((sub, si) => {
        if (sub.status === 'safe') safeTargets.push({ nodeIdx: ni, subIdx: si });
      });
    });

    if (safeTargets.length === 0) return;

    const attackCount = ATTACKS_BY_WAVE[waveIndex] ?? 1;
    const chosen = randomUniqueIndices(safeTargets.length, attackCount);
    const ttl = WARNING_TTL_BY_WAVE[waveIndex] ?? 6;

    const updated = nodes.map(n => ({ ...n, subnodes: [...n.subnodes] }));
    chosen.forEach(ci => {
      const { nodeIdx, subIdx } = safeTargets[ci];
      updated[nodeIdx].subnodes[subIdx] = {
        ...updated[nodeIdx].subnodes[subIdx],
        status: 'warning',
        timeToCompromise: ttl,
      };
      // Actualizar estado visual del nodo padre
      updated[nodeIdx].status = this.resolveNodeStatus(updated[nodeIdx]);
    });

    this.nodes.set(updated);
  }

  // Decrementa el TTL de los subnodos en warning y los compromete si llegan a 0
  private tickWarningNodes(): void {
    const nodes = this.nodes();
    let integrityLoss = 0;
    let newFallen = 0;

    const updated = nodes.map(node => {
      if (node.status === 'fallen') return node;

      const newSubnodes = node.subnodes.map(sub => {
        if (sub.status !== 'warning') return sub;
        const newTTL = sub.timeToCompromise - 1;
        if (newTTL <= 0) {
          // El subnodo fue comprometido — baja integridad
          integrityLoss += 10;
          return { ...sub, status: 'compromised' as SubnodeStatus, timeToCompromise: 0 };
        }
        return { ...sub, timeToCompromise: newTTL };
      });

      const newNode = { ...node, subnodes: newSubnodes };
      newNode.status = this.resolveNodeStatus(newNode);

      if (newNode.status === 'fallen') {
        newFallen++;
        integrityLoss += 15; // penalidad extra por nodo caído
      }

      return newNode;
    });

    if (integrityLoss > 0) {
      this.integrity.set(Math.max(0, this.integrity() - integrityLoss));
    }
    if (newFallen > 0) {
      this.nodesFallen.set(this.nodesFallen() + newFallen);
    }

    this.nodes.set(updated);

    // Verificar condición de derrota
    this.checkDefeat();
  }

  // Determina el estado del nodo padre según sus subnodos
  private resolveNodeStatus(node: NetworkNode): NodeStatus {
    const allFallen = node.subnodes.every(s => s.status === 'compromised');
    if (allFallen) return 'fallen';
    const anyWarning = node.subnodes.some(s => s.status === 'warning');
    const anyCompromised = node.subnodes.some(s => s.status === 'compromised');
    if (anyWarning || anyCompromised) return 'warning';
    return 'safe';
  }

  // Fin de oleada: pausa y evalúa si continuar o terminar
  private endWave(): void {
    this.clearAllIntervals();

    const wave = this.currentWave();
    if (wave >= TOTAL_WAVES - 1) {
      // Última oleada superada → victoria
      this.finishGame(true);
      return;
    }

    // Descanso entre oleadas
    this.gameState.set('wave-break');
    this.phaseTimeLeft.set(BREAK_DURATION);

    this.gameTick = setInterval(() => {
      const t = this.phaseTimeLeft() - 1;
      this.phaseTimeLeft.set(t);
      if (t <= 0) {
        clearInterval(this.gameTick);
        this.currentWave.set(wave + 1);
        this.gameState.set('playing');
        // Reparar subnodos en warning al inicio de cada oleada (no los comprometidos)
        this.resetWarningSubnodes();
        this.startWave();
      }
    }, 1000);
  }

  // Al inicio de una nueva oleada, los subnodos en 'warning' vuelven a 'safe'
  private resetWarningSubnodes(): void {
    this.nodes.update(nodes =>
      nodes.map(node => ({
        ...node,
        subnodes: node.subnodes.map(sub =>
          sub.status === 'warning' ? { ...sub, status: 'safe' as SubnodeStatus, timeToCompromise: 0 } : sub
        ),
        status: node.status === 'fallen' ? 'fallen' : 'safe',
      }))
    );
  }

  // Derrota si integridad llega a 0 o más de la mitad de los nodos caen
  private checkDefeat(): void {
    if (this.gameState() !== 'playing') return;
    const totalNodes = this.nodes().length;
    const fallen = this.nodesFallen();
    if (this.integrity() <= 0 || fallen > Math.floor(totalNodes / 2)) {
      this.finishGame(false);
    }
  }

  // ─── Acciones del jugador ──────────────────────────────────────────────────

  // Selecciona/deselecciona un nodo al hacer click
  selectNode(nodeId: string): void {
    if (this.gameState() !== 'playing') return;
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node || node.status === 'fallen') return;
    this.selectedNodeId.set(this.selectedNodeId() === nodeId ? null : nodeId);
  }

  // Bloquear: detiene el ataque en subnodos 'warning' → vuelven a 'safe'
  blockNode(): void {
    const node = this.selectedNode();
    if (!node) return;

    this.actionsTotal.update(v => v + 1);
    const hadWarning = node.subnodes.some(s => s.status === 'warning');

    if (!hadWarning) return; // acción sin efecto

    this.actionsSuccessful.update(v => v + 1);
    this.nodesSaved.update(v => v + 1);

    this.nodes.update(nodes =>
      nodes.map(n => {
        if (n.id !== node.id) return n;
        const newSubnodes = n.subnodes.map(sub =>
          sub.status === 'warning'
            ? { ...sub, status: 'safe' as SubnodeStatus, timeToCompromise: 0 }
            : sub
        );
        return { ...n, subnodes: newSubnodes, status: this.resolveNodeStatus({ ...n, subnodes: newSubnodes }) };
      })
    );

    this.selectedNodeId.set(null);
  }

  // Parchear: estabiliza subnodos 'compromised' evitando que cuenten como perdidos en futuras oleadas
  patchNode(): void {
    const node = this.selectedNode();
    if (!node) return;

    this.actionsTotal.update(v => v + 1);
    const hasCompromised = node.subnodes.some(s => s.status === 'compromised');

    if (!hasCompromised) return;

    this.actionsSuccessful.update(v => v + 1);

    // Parchear vuelve los subnodos comprometidos a 'safe' con una pequeña recuperación de integridad
    this.nodes.update(nodes =>
      nodes.map(n => {
        if (n.id !== node.id) return n;
        const newSubnodes = n.subnodes.map(sub =>
          sub.status === 'compromised'
            ? { ...sub, status: 'safe' as SubnodeStatus }
            : sub
        );
        return { ...n, subnodes: newSubnodes, status: 'safe' as NodeStatus };
      })
    );

    // Recupera 5 puntos de integridad al parchear (máximo 100)
    this.integrity.update(v => Math.min(100, v + 5));
    this.selectedNodeId.set(null);
  }

  // ─── Fin de partida ────────────────────────────────────────────────────────

  private finishGame(won: boolean): void {
    this.clearAllIntervals();
    this.gameState.set('finished');
    void this.saveResult(won);
  }

  private async saveResult(won: boolean): Promise<void> {
    if (this.resultSaved) return;
    this.resultSaved = true;

    const timeSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const { scoreMultiplier } = DIFFICULTY_CONFIG[this.difficulty()];

    // Precisión: porcentaje de acciones que tuvieron efecto real
    const precision =
      this.actionsTotal() > 0
        ? Math.round((this.actionsSuccessful() / this.actionsTotal()) * 100)
        : 0;

    // Puntaje final: base por oleada × multiplicador × integridad × precisión
    const waveBonus = (this.currentWave() + 1) * 10;
    const score = Math.round(
      waveBonus * scoreMultiplier * (this.integrity() / 100) * (precision / 100 || 1) * 100
    );

    const { error } = await this.supabase.saveGameResult({
      slug: 'firewall-breach',
      name: 'Firewall Breach',
      score,
      timeSeconds,
      won,
      details: {
        difficulty: this.difficulty(),
        max_wave: this.currentWave() + 1,
        final_integrity: this.integrity(),
        nodes_saved: this.nodesSaved(),
        nodes_fallen: this.nodesFallen(),
        precision,
      },
    });

    this.toastService.show(error ? 'GAME_RESULT_ERROR' : 'GAME_RESULT_SUCCESS');
  }

  // ─── Utilidades ────────────────────────────────────────────────────────────

  private clearAllIntervals(): void {
    if (this.gameTick) clearInterval(this.gameTick);
    if (this.attackTick) clearInterval(this.attackTick);
    if (this.attackInitTimeout) clearTimeout(this.attackInitTimeout);
    this.gameTick = undefined;
    this.attackTick = undefined;
    this.attackInitTimeout = undefined;
  }

  // Trackby para el @for del template
  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
