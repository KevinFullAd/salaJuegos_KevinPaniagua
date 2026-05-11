# AGÓN – Development Tracker

## Estado del Proyecto

**Sprint actual:** Sprint 1
**Objetivo:** MVP funcional con autenticación y navegación básica

---

## <3 Sprint 1 – Checklist

### Autenticación

* [x] Login con validaciones
* [x] Registro con validaciones
* [x] Persistencia de usuario (StorageService)
* [x] AuthService centralizado

---

### Seguridad

* [x] AuthGuard implementado
* [x] Rutas protegidas correctamente
* [x] Navbar dinámico según estado de sesión

---

### Navegación

* [x] Routing base configurado
* [x] Redirección post-login
* [x] Flujo completo testeado (login → home → logout)

---

### UI Base

* [x] Layout principal
* [x] Componente Card reutilizable
* [x] Sistema de Toast (feedback visual)
* [x] Home con grid de juegos (AGÓN style)
* [x] Favicon

---

### Quién Soy

* [x] Integración con GitHub API
* [x] Render de datos dinámicos
* [x] Contenido personal completo (bio + juego futuro)

---

### Deploy

* [x] Deploy en plataforma (Vercel / Firebase / Netlify)
* [x] Routing SPA funcionando (fallback index.html)
* [x] Validación en producción

---

## Validaciones finales (antes de cerrar sprint)

* [x] No se puede acceder a Home sin login
* [x] Login/Register muestran errores correctamente
* [x] Toast funciona en acciones clave
* [x] Navegación sin errores manuales
* [x] App funciona correctamente en producción

---

## Flujo de trabajo

### 1. Desarrollo

* Crear feature en base al sprint actual
* Mantener componentes desacoplados y reutilizables

### 2. Validación

* Probar flujo manual completo
* Validar UX mínima

### 3. Commit

Formato:

```
feat: add home game cards
fix: resolve auth guard redirect
refactor: extract card component
style: improve login UI
```

---

### 4. Integración

* Integrar cambios en rama principal
* Verificar que no rompa funcionalidades existentes

---

## Estructura del proyecto

```
core/
- services globales (auth, storage, toast)

shared/
- componentes reutilizables (ui)

features/
- pantallas principales (login, register, home, about)
```

---

## Próximo Sprint (preview)

* Implementación de juegos
* Manejo de estado de partida
* UI más avanzada (animaciones, feedback)
* Mejora de UX general

---

## Notas

* Priorizar funcionalidad sobre estética
* Evitar sobreingeniería innecesaria
* Mantener código simple y escalable
* Build local validado con `npm run build`. Queda warning de budget inicial: 814.50 kB sobre límite de 500 kB.
* Tests unitarios validados con `npm test`: 10 archivos y 11 tests OK.
* Deploy y validación en producción quedan pendientes hasta elegir plataforma y publicar.
