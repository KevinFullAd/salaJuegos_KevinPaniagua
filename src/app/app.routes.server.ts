import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas con auth guard: se renderizan solo en el cliente para evitar
  // mismatches de hidratación por falta de sesión en el servidor
  { path: 'chat',             renderMode: RenderMode.Client },
  { path: 'results',          renderMode: RenderMode.Client },
  { path: 'games/ahorcado',   renderMode: RenderMode.Client },
  { path: 'games/mayor-menor',renderMode: RenderMode.Client },
  { path: 'games/preguntados',renderMode: RenderMode.Client },
  { path: 'games/:slug',      renderMode: RenderMode.Client },
  // Rutas públicas: prerender estático
  { path: '**',               renderMode: RenderMode.Prerender },
];
