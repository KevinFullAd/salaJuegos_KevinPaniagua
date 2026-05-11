# Sprint 2 - Base Supabase y navegacion previa a juegos

## Home/Bienvenida

- [x] Mostrar acceso a juegos
- [x] Mostrar acceso a listados
- [x] Mostrar botones Login/Registro si NO esta logueado
- [x] Mostrar usuario logueado
- [x] Agregar boton cerrar sesion
- [x] Ocultar botones segun estado login
- [x] Implementar guards para rutas protegidas

## Login

- [x] Validar usuario con Supabase Auth
- [x] Login con correo y contrasena
- [x] Redirigir al Home al iniciar sesion
- [x] Mostrar errores de login
- [x] Agregar 3 botones de acceso rapido

## Registro

- [x] Formulario de registro
- [x] Pedir correo, nombre, apellido, edad y contrasena
- [x] Crear usuario en autenticacion
- [x] Guardar datos publicos en DB
- [x] NO guardar contrasena en DB
- [x] Iniciar sesion automaticamente al registrarse
- [x] Redirigir al Home
- [x] Validar usuario existente mediante error de Supabase Auth

## Listados

- [x] Crear ruta `/results`
- [x] Proteger listados con AuthGuard
- [x] Leer resultados desde `game_results`
- [x] Mostrar estado vacio para usuarios sin partidas

## Preparacion Sprint 3

- [x] Crear rutas protegidas `/games/:slug`
- [x] Dejar placeholder navegable para reemplazar por juegos reales
