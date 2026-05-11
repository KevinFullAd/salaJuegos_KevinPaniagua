# TP #1 - Sala de Juegos

## Requerimientos generales

- [x] Aplicacion frontend en Angular
- [x] Backend con Supabase o Firebase
- [x] Login y registro funcionando
- [x] Solo usuarios logueados pueden jugar
- [x] Estadisticas por jugador y por juego
- [ ] Cada juego guarda informacion relevante
- [ ] Todos los juegos tienen condicion de victoria y derrota
- [x] NO usar `alert()`, usar modales
- [x] Diseno uniforme en toda la app
- [x] Navegacion entre pantallas
- [x] UX clara en mensajes y acciones
- [ ] Mostrar tiempo/puntaje en juegos
- [x] Usar Bootstrap / PrimeNG / libreria de estilos
- [x] Agregar animaciones
- [x] Agregar favicon propio

---

# Sprint 1

## Inicializacion

- [x] Crear proyecto Angular
- [x] Configurar Supabase/Firebase
- [x] Hacer deploy (Vercel/Firebase/etc)

## Componentes

- [x] Crear Login
- [x] Crear Registro
- [x] Crear Home/Bienvenida
- [x] Crear pagina "Quien Soy"

## Navegacion

- [x] Configurar rutas
- [x] Navegar entre componentes

## Pagina "Quien Soy"

- [x] Consumir API de GitHub
- [x] Mostrar nombre del alumno
- [x] Mostrar imagen de perfil
- [x] Mostrar otros datos del perfil
- [x] Explicar el juego propio
- [x] Explicar como se juega

## Diseno

- [x] Agregar favicon personalizado

---

# Sprint 2

## Home/Bienvenida

- [x] Mostrar acceso a juegos
- [x] Mostrar acceso a listados
- [x] Mostrar botones Login/Registro si NO esta logueado
- [x] Mostrar usuario logueado
- [x] Agregar boton cerrar sesion
- [x] Ocultar botones segun estado login
- [x] Implementar guards

## Login

- [x] Validar usuario con Supabase/Firebase
- [x] Login con correo y contrasena
- [x] Redirigir al Home al iniciar sesion
- [x] Mostrar errores de login
- [x] Agregar 3 botones de acceso rapido

## Registro

- [x] Formulario de registro
- [x] Pedir:
  - [x] Correo
  - [x] Nombre
  - [x] Apellido
  - [x] Edad
  - [x] Contrasena
- [x] Crear usuario en autenticacion
- [x] Guardar datos en DB
- [x] NO guardar contrasena en DB
- [x] Iniciar sesion automaticamente al registrarse
- [x] Redirigir al Home
- [x] Validar usuario existente

---

# Sprint 3

## Juego: Ahorcado

- [ ] Crear logica del juego
- [ ] Mostrar letras con botones
- [ ] NO usar teclado
- [ ] Detectar victoria
- [ ] Detectar derrota
- [ ] Guardar resultado en DB
- [ ] Guardar:
  - [ ] Usuario
  - [ ] Tiempo
  - [ ] Letras seleccionadas
  - [ ] Otros datos relevantes

## Juego: Mayor o Menor

- [ ] Mostrar cartas
- [ ] Permitir elegir mayor/menor
- [ ] Detectar resultado
- [ ] Guardar resultado en DB
- [ ] Guardar:
  - [ ] Usuario
  - [ ] Cartas acertadas
  - [ ] Otros datos relevantes

## Sala de Chat

- [ ] Crear chat global
- [ ] Solo accesible para usuarios logueados
- [ ] Permitir enviar mensajes
- [ ] Guardar mensajes en DB
- [ ] Guardar:
  - [ ] Usuario
  - [ ] Mensaje
  - [ ] Fecha
- [ ] Actualizacion en tiempo real
- [ ] Mostrar autor del mensaje
- [ ] Mostrar hora
- [ ] Diferenciar mensajes propios

---

# Sprint 4

## Juego: Preguntados

- [ ] Consumir API externa
- [ ] Mostrar preguntas
- [ ] Mostrar opciones con botones
- [ ] Detectar respuestas correctas
- [ ] Detectar fin de partida
- [ ] Guardar resultados en DB
- [ ] Guardar:
  - [ ] Usuario
  - [ ] Preguntas acertadas
  - [ ] Otros datos relevantes

## Juego propio

- [ ] Crear juego original
- [x] Verificar que NO sea:
  - [x] Tateti
  - [x] Memotest
  - [x] Piedra papel tijera
  - [x] Test reaccion
  - [x] Test aim
- [x] Agregar explicacion en "Quien Soy"
- [x] Agregar reglas
- [ ] Guardar resultados en DB
- [ ] Guardar:
  - [ ] Usuario
  - [ ] Puntaje
  - [ ] Tiempo
  - [ ] Metrica relevante

## Resultados

- [x] Crear pagina Resultados
- [x] Crear tabla Ahorcado
- [x] Crear tabla Mayor o Menor
- [x] Crear tabla Preguntados
- [x] Crear tabla Juego propio
- [x] Ordenar por mejor puntaje/desempeno

---

# Sprint 5 (Recuperatorio)

## Encuesta

- [ ] Crear formulario encuesta
- [ ] Pedir:
  - [ ] Nombre y apellido
  - [ ] Edad
  - [ ] Telefono
- [ ] Validar edad > 18 y < 99
- [ ] Validar telefono numerico
- [ ] Validar maximo 10 caracteres
- [ ] Agregar minimo 3 preguntas
- [ ] Usar distintos controles:
  - [ ] Textbox
  - [ ] Checkbox
  - [ ] Radio button
- [ ] No repetir controles
- [ ] Todos los campos requeridos
- [ ] Guardar respuestas en DB
- [ ] Asociar respuestas al usuario

## Administracion

- [ ] Crear seccion de resultados de encuestas
- [ ] Restringir acceso con guards
- [ ] Solo admins pueden verla

## Extras

- [x] Agregar animaciones de transicion
