import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { FirewallBreachComponent, NetworkNode } from './firewall-breach';
import { SupabaseService } from '@services/supabase';
import { ToastService } from '@services/toast.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(overrides: Partial<NetworkNode> = {}): NetworkNode {
  return {
    id: 'n0',
    label: 'FW',
    x: 50,
    y: 15,
    status: 'safe',
    subnodes: [
      { id: 'n0-s0', status: 'safe', timeToCompromise: 0 },
      { id: 'n0-s1', status: 'safe', timeToCompromise: 0 },
    ],
    ...overrides,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('FirewallBreachComponent', () => {
  let component: FirewallBreachComponent;
  let fixture: ComponentFixture<FirewallBreachComponent>;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['saveGameResult']);
    supabaseSpy.saveGameResult.and.returnValue(Promise.resolve({ error: null }));

    toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [FirewallBreachComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FirewallBreachComponent);
    component = fixture.componentInstance;
  });

  afterEach(fakeAsync(() => {
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  // ── Creación y estado inicial ──────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start in idle state', () => {
    expect(component.gameState()).toBe('idle');
  });

  it('should have default difficulty "normal"', () => {
    expect(component.difficulty()).toBe('normal');
  });

  it('should have integrity at 100 initially', () => {
    expect(component.integrity()).toBe(100);
  });

  it('should have 0 nodes initially', () => {
    expect(component.nodes().length).toBe(0);
  });

  it('should have no selected node initially', () => {
    expect(component.selectedNodeId()).toBeNull();
  });

  // ── selectDifficulty ───────────────────────────────────────────────────────

  it('should update difficulty to hard', () => {
    component.selectDifficulty('hard');
    expect(component.difficulty()).toBe('hard');
  });

  it('should update difficulty to easy', () => {
    component.selectDifficulty('easy');
    expect(component.difficulty()).toBe('easy');
  });

  it('difficultyLabel should reflect selected difficulty', () => {
    component.selectDifficulty('easy');
    expect(component.difficultyLabel()).toBe('Fácil');

    component.selectDifficulty('normal');
    expect(component.difficultyLabel()).toBe('Normal');

    component.selectDifficulty('hard');
    expect(component.difficultyLabel()).toBe('Difícil');
  });

  // ── buildNetwork / startGame ───────────────────────────────────────────────

  it('startGame should transition to playing', fakeAsync(() => {
    component.startGame();
    expect(component.gameState()).toBe('playing');
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('startGame should reset all counters', fakeAsync(() => {
    // Pre-load dirty state
    component.actionsTotal.set(10);
    component.actionsSuccessful.set(5);
    component.nodesFallen.set(2);
    component.nodesSaved.set(3);
    component.integrity.set(40);

    component.startGame();

    expect(component.actionsTotal()).toBe(0);
    expect(component.actionsSuccessful()).toBe(0);
    expect(component.nodesFallen()).toBe(0);
    expect(component.nodesSaved()).toBe(0);
    expect(component.integrity()).toBe(100);
    expect(component.currentWave()).toBe(0);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('should build 4 nodes for easy difficulty', fakeAsync(() => {
    component.selectDifficulty('easy');
    component.startGame();
    expect(component.nodes().length).toBe(4);
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('should build 6 nodes for normal difficulty', fakeAsync(() => {
    component.selectDifficulty('normal');
    component.startGame();
    expect(component.nodes().length).toBe(6);
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('should build 8 nodes for hard difficulty', fakeAsync(() => {
    component.selectDifficulty('hard');
    component.startGame();
    expect(component.nodes().length).toBe(8);
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('all nodes should start as safe with 2 safe subnodes each', fakeAsync(() => {
    component.startGame();

    for (const node of component.nodes()) {
      expect(node.status).toBe('safe');
      expect(node.subnodes.length).toBe(2);
      for (const sub of node.subnodes) {
        expect(sub.status).toBe('safe');
      }
    }

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('nodes should be arranged in a ring via connections()', fakeAsync(() => {
    component.startGame();
    const nodes = component.nodes();
    const conns = component.connections();

    expect(conns.length).toBe(nodes.length);
    expect(conns[conns.length - 1].to.id).toBe(nodes[0].id);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  // ── resolveNodeStatus (privado, accedido via cast) ─────────────────────────

  it('resolveNodeStatus should return "fallen" when all subnodes are compromised', () => {
    const node = makeNode({
      subnodes: [
        { id: 's0', status: 'compromised', timeToCompromise: 0 },
        { id: 's1', status: 'compromised', timeToCompromise: 0 },
      ],
    });
    const status = (component as any).resolveNodeStatus(node);
    expect(status).toBe('fallen');
  });

  it('resolveNodeStatus should return "warning" when one subnode is in warning', () => {
    const node = makeNode({
      subnodes: [
        { id: 's0', status: 'warning', timeToCompromise: 5 },
        { id: 's1', status: 'safe', timeToCompromise: 0 },
      ],
    });
    expect((component as any).resolveNodeStatus(node)).toBe('warning');
  });

  it('resolveNodeStatus should return "warning" when one subnode is compromised but not all', () => {
    const node = makeNode({
      subnodes: [
        { id: 's0', status: 'compromised', timeToCompromise: 0 },
        { id: 's1', status: 'safe', timeToCompromise: 0 },
      ],
    });
    expect((component as any).resolveNodeStatus(node)).toBe('warning');
  });

  it('resolveNodeStatus should return "safe" when all subnodes are safe', () => {
    const node = makeNode();
    expect((component as any).resolveNodeStatus(node)).toBe('safe');
  });

  // ── selectNode ─────────────────────────────────────────────────────────────

  it('selectNode should select a safe node while playing', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;

    component.selectNode(nodeId);
    expect(component.selectedNodeId()).toBe(nodeId);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('selectNode should deselect a node when clicked again', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;

    component.selectNode(nodeId);
    component.selectNode(nodeId);
    expect(component.selectedNodeId()).toBeNull();

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('selectNode should do nothing when game is idle', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;
    component.ngOnDestroy();
    flushMicrotasks();

    component.gameState.set('idle');
    component.selectNode(nodeId);
    expect(component.selectedNodeId()).toBeNull();
  }));

  it('selectNode should not select a fallen node', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;

    component.nodes.update(ns =>
      ns.map(n => n.id === nodeId ? { ...n, status: 'fallen' } : n)
    );

    component.selectNode(nodeId);
    expect(component.selectedNodeId()).toBeNull();

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  // ── blockNode ──────────────────────────────────────────────────────────────

  it('blockNode should convert warning subnodes to safe', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;

    component.nodes.update(ns => ns.map(n =>
      n.id !== nodeId ? n : {
        ...n, status: 'warning',
        subnodes: [
          { ...n.subnodes[0], status: 'warning', timeToCompromise: 5 },
          { ...n.subnodes[1], status: 'safe', timeToCompromise: 0 },
        ],
      }
    ));

    component.selectedNodeId.set(nodeId);
    component.blockNode();

    const updated = component.nodes().find(n => n.id === nodeId)!;
    expect(updated.subnodes.every(s => s.status === 'safe')).toBeTrue();
    expect(updated.status).toBe('safe');

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('blockNode should increment actionsTotal and actionsSuccessful on success', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;

    component.nodes.update(ns => ns.map(n =>
      n.id !== nodeId ? n : {
        ...n, status: 'warning',
        subnodes: [
          { ...n.subnodes[0], status: 'warning', timeToCompromise: 5 },
          n.subnodes[1],
        ],
      }
    ));

    component.selectedNodeId.set(nodeId);
    component.blockNode();

    expect(component.actionsTotal()).toBe(1);
    expect(component.actionsSuccessful()).toBe(1);
    expect(component.nodesSaved()).toBe(1);
    expect(component.selectedNodeId()).toBeNull();

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('blockNode should increment actionsTotal but NOT actionsSuccessful when no warning subnodes', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;
    component.selectedNodeId.set(nodeId);

    component.blockNode(); // all subnodes safe → no effect

    expect(component.actionsTotal()).toBe(1);
    expect(component.actionsSuccessful()).toBe(0);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('blockNode should do nothing when no node is selected', fakeAsync(() => {
    component.startGame();
    component.blockNode();

    expect(component.actionsTotal()).toBe(0);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  // ── patchNode ──────────────────────────────────────────────────────────────

  it('patchNode should convert compromised subnodes to safe', fakeAsync(() => {
    component.startGame();
    component.integrity.set(80);
    const nodeId = component.nodes()[0].id;

    component.nodes.update(ns => ns.map(n =>
      n.id !== nodeId ? n : {
        ...n, status: 'warning',
        subnodes: [
          { ...n.subnodes[0], status: 'compromised', timeToCompromise: 0 },
          { ...n.subnodes[1], status: 'safe', timeToCompromise: 0 },
        ],
      }
    ));

    component.selectedNodeId.set(nodeId);
    component.patchNode();

    const updated = component.nodes().find(n => n.id === nodeId)!;
    expect(updated.subnodes.every(s => s.status === 'safe')).toBeTrue();
    expect(updated.status).toBe('safe');
    expect(component.integrity()).toBe(85);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('patchNode should cap integrity at 100', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;

    component.nodes.update(ns => ns.map(n =>
      n.id !== nodeId ? n : {
        ...n, status: 'warning',
        subnodes: [
          { ...n.subnodes[0], status: 'compromised', timeToCompromise: 0 },
          n.subnodes[1],
        ],
      }
    ));

    component.selectedNodeId.set(nodeId);
    component.patchNode();

    expect(component.integrity()).toBe(100);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('patchNode should do nothing when no compromised subnodes exist', fakeAsync(() => {
    component.startGame();
    const nodeId = component.nodes()[0].id;
    component.selectedNodeId.set(nodeId);

    component.patchNode();

    expect(component.actionsTotal()).toBe(1);
    expect(component.actionsSuccessful()).toBe(0);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  // ── integrityColor computed ────────────────────────────────────────────────

  it('integrityColor should contain "success" when integrity > 60', () => {
    component.integrity.set(61);
    expect(component.integrityColor()).toContain('success');
  });

  it('integrityColor should contain "warning" when integrity is between 31 and 60', () => {
    component.integrity.set(45);
    expect(component.integrityColor()).toContain('warning');
  });

  it('integrityColor should contain "danger" when integrity <= 30', () => {
    component.integrity.set(30);
    expect(component.integrityColor()).toContain('danger');
  });

  // ── integrityPct computed ──────────────────────────────────────────────────

  it('integrityPct should return "75%"', () => {
    component.integrity.set(75);
    expect(component.integrityPct()).toBe('75%');
  });

  // ── checkDefeat (privado) ──────────────────────────────────────────────────

  it('should finish the game when integrity reaches 0', fakeAsync(() => {
    component.startGame();
    component.integrity.set(0);

    (component as any).checkDefeat();

    expect(component.gameState()).toBe('finished');
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('should finish when more than half the nodes have fallen (easy: 4 nodes, > 2 fallen)', fakeAsync(() => {
    component.selectDifficulty('easy');
    component.startGame();
    component.nodesFallen.set(3);

    (component as any).checkDefeat();

    expect(component.gameState()).toBe('finished');
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('should NOT finish when exactly half the nodes have fallen', fakeAsync(() => {
    component.selectDifficulty('easy');
    component.startGame();
    component.nodesFallen.set(2); // exactly half, not "more than"

    (component as any).checkDefeat();

    expect(component.gameState()).toBe('playing');
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('checkDefeat should do nothing when game is not in playing state', fakeAsync(() => {
    component.startGame();
    component.integrity.set(0);
    component.gameState.set('wave-break');

    (component as any).checkDefeat();

    expect(component.gameState()).toBe('wave-break');
    component.ngOnDestroy();
    flushMicrotasks();
  }));

  // ── tickWarningNodes (privado) ─────────────────────────────────────────────

  it('tickWarningNodes should decrement TTL on warning subnodes', fakeAsync(() => {
    component.startGame();

    component.nodes.update(ns => [
      {
        ...ns[0], status: 'warning',
        subnodes: [
          { ...ns[0].subnodes[0], status: 'warning', timeToCompromise: 5 },
          ns[0].subnodes[1],
        ],
      },
      ...ns.slice(1),
    ]);

    (component as any).tickWarningNodes();

    expect(component.nodes()[0].subnodes[0].timeToCompromise).toBe(4);
    expect(component.nodes()[0].subnodes[0].status).toBe('warning');

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('tickWarningNodes should compromise a subnode when TTL reaches 0', fakeAsync(() => {
    component.startGame();
    const initialIntegrity = component.integrity();

    component.nodes.update(ns => [
      {
        ...ns[0], status: 'warning',
        subnodes: [
          { ...ns[0].subnodes[0], status: 'warning', timeToCompromise: 1 },
          ns[0].subnodes[1],
        ],
      },
      ...ns.slice(1),
    ]);

    (component as any).tickWarningNodes();

    const compromised = component.nodes()[0].subnodes[0];
    expect(compromised.status).toBe('compromised');
    expect(component.integrity()).toBe(initialIntegrity - 10);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  // ── resetWarningSubnodes (privado) ─────────────────────────────────────────

  it('resetWarningSubnodes should revert warning subnodes to safe', fakeAsync(() => {
    component.startGame();

    component.nodes.update(ns => [
      {
        ...ns[0], status: 'warning',
        subnodes: [
          { ...ns[0].subnodes[0], status: 'warning', timeToCompromise: 3 },
          { ...ns[0].subnodes[1], status: 'compromised', timeToCompromise: 0 },
        ],
      },
      ...ns.slice(1),
    ]);

    (component as any).resetWarningSubnodes();

    const node = component.nodes()[0];
    expect(node.subnodes[0].status).toBe('safe');
    expect(node.subnodes[0].timeToCompromise).toBe(0);
    // compromised subnodes are NOT reset by this method
    expect(node.subnodes[1].status).toBe('compromised');

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  // ── saveResult / supabase ──────────────────────────────────────────────────

  it('should call supabase.saveGameResult when game finishes', fakeAsync(() => {
    component.startGame();

    component.integrity.set(0);
    (component as any).checkDefeat();

    flushMicrotasks();

    expect(supabaseSpy.saveGameResult).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ slug: 'firewall-breach' })
    );
  }));

  it('should show GAME_RESULT_SUCCESS toast on successful save', fakeAsync(() => {
    supabaseSpy.saveGameResult.and.returnValue(Promise.resolve({ error: null }));

    component.startGame();
    component.integrity.set(0);
    (component as any).checkDefeat();

    flushMicrotasks();

    expect(toastSpy.show).toHaveBeenCalledWith('GAME_RESULT_SUCCESS');
  }));

  it('should show GAME_RESULT_ERROR toast when supabase returns an error', fakeAsync(() => {
    supabaseSpy.saveGameResult.and.returnValue(
      Promise.resolve({ error: new Error('network error') })
    );

    component.startGame();
    component.integrity.set(0);
    (component as any).checkDefeat();

    flushMicrotasks();

    expect(toastSpy.show).toHaveBeenCalledWith('GAME_RESULT_ERROR');
  }));

  it('should not save result twice (resultSaved guard)', fakeAsync(() => {
    component.startGame();
    component.integrity.set(0);

    (component as any).checkDefeat();
    (component as any).checkDefeat(); // second call should be ignored

    flushMicrotasks();

    expect(supabaseSpy.saveGameResult).toHaveBeenCalledTimes(1);
  }));

  // ── ngOnDestroy ────────────────────────────────────────────────────────────

  it('ngOnDestroy should not throw even when called without starting the game', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngOnDestroy should not throw when called multiple times', fakeAsync(() => {
    component.startGame();
    expect(() => {
      component.ngOnDestroy();
      component.ngOnDestroy();
    }).not.toThrow();
    flushMicrotasks();
  }));

  // ── Simulación de oleada con tick ─────────────────────────────────────────

  it('phaseTimeLeft should decrease after one second', fakeAsync(() => {
    component.startGame();
    expect(component.phaseTimeLeft()).toBe(20);

    tick(1000);
    expect(component.phaseTimeLeft()).toBe(19);

    component.ngOnDestroy();
    flushMicrotasks();
  }));

  it('game should enter wave-break after wave timer expires', fakeAsync(() => {
    component.startGame();

    tick(20_000); // advance full wave duration

    expect(component.gameState()).toBe('wave-break');

    component.ngOnDestroy();
    flushMicrotasks();
  }));
});
