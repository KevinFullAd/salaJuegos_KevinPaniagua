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
* [ ] Navbar dinámico según estado de sesión

---

### Navegación

* [x] Routing base configurado
* [x] Redirección post-login
* [ ] Flujo completo testeado (login → home → logout)

---

### UI Base

* [x] Layout principal
* [x] Componente Card reutilizable
* [x] Sistema de Toast (feedback visual)
* [ ] Home con grid de juegos (AGÓN style)
* [ ] Favicon

---

### Quién Soy

* [x] Integración con GitHub API
* [x] Render de datos dinámicos
* [ ] Contenido personal completo (bio + juego futuro)

---

### Deploy

* [ ] Deploy en plataforma (Vercel / Firebase / Netlify)
* [ ] Routing SPA funcionando (fallback index.html)
* [ ] Validación en producción

---

## Validaciones finales (antes de cerrar sprint)

* [ ] No se puede acceder a Home sin login
* [ ] Login/Register muestran errores correctamente
* [ ] Toast funciona en acciones clave
* [ ] Navegación sin errores manuales
* [ ] App funciona correctamente en producción

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
