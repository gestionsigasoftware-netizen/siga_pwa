# Home: los 4 módulos siempre visibles, permiso validado al elegir (2026-09-03)

## Bugs/pedido reportados

1. Al entrar a la app aparecía un instante el mensaje "Aún no tienes una
   asignación" antes de mostrar el selector correcto.
2. El selector solo mostraba los módulos que la cuenta ya tenía
   asignados. El usuario pidió lo contrario: mostrar siempre los 4
   módulos que captura esta PWA (Ujieres, Misiones y Evangelismo, Misión
   Juvenil, Obra Carcelaria), y que la validación de permiso ocurra al
   elegir uno -- si la cuenta no tiene acceso a ese módulo, debe avisarlo
   ahí mismo sin dejarla entrar, en vez de simplemente no mostrarlo.

## Causa del mensaje fantasma (bug 1)

`useMisAsignaciones` (`src/hooks/useMisAsignaciones.js`) llama a su propia
instancia de `useAuth()`. En el primer render, antes de que
`supabase.auth.getSession()` resuelva, `user` vale `null` -- exactamente
igual que cuando de verdad no hay sesión. El efecto interpretaba ese
`null` transitorio como "no autenticado" y ponía `loading: false` con
`asignaciones: []` de inmediato, lo que `Home.jsx` pintaba como "sin
asignación" por un instante, hasta que la sesión real llegaba un
momento después y el efecto se volvía a correr con el usuario correcto.

**Corrección**: el hook ahora también observa `loading` de `useAuth()` y
no decide nada mientras esa carga esté en curso; solo cuando `useAuth`
terminó de resolver (con o sin usuario) se decide si hay o no
asignaciones. `loading` de `useMisAsignaciones` ahora es
`authLoading || loading`, así que `Home.jsx` sigue mostrando el spinner
hasta tener el dato real, nunca un estado incorrecto de por medio.

## Rediseño de Home (pedido 2)

- **`src/lib/modulos.js`**: se agregó `MODULOS_CONOCIDOS`, la lista fija
  de las 4 áreas que captura esta PWA (con un `match` por expresión
  regular sobre `nombre_modulo`, igual criterio que ya usaba
  `esModuloObraCarcelaria`), y `buscarAsignacion(asignaciones, modulo)`
  para encontrar si la cuenta tiene o no una asignación para esa área.
- **`src/pages/Home.jsx`**: se eliminó la lógica anterior (mostrar solo
  los módulos asignados, autonavegar si había exactamente uno, pantalla
  completa de "sin asignación" si no había ninguno). Ahora siempre
  renderiza las 4 tarjetas; las que la cuenta no tiene asignadas se ven
  atenuadas ("Sin acceso asignado"). Al tocar una sin permiso se muestra
  un aviso en rojo ("No tienes permisos para X...") sin navegar; al
  tocar una con permiso, navega a la pantalla de captura real
  (genérica o la propia de Obra Carcelaria, según corresponda).
- Como consecuencia, ya no existe el atajo de autonavegar cuando la
  cuenta tiene una sola asignación -- ahora siempre se ve el selector
  completo, de forma consistente.

## Verificación

Playwright contra `npm run dev`, con la cuenta de prueba
(`pueba691@gmail.com`, que solo tiene Ujieres y Obra Carcelaria
asignados): se capturaron varios frames inmediatos tras el login sin
que apareciera el mensaje de "sin asignación"; el selector mostró las 4
tarjetas (Ujieres y Obra Carcelaria activas, Misiones y Evangelismo /
Misión Juvenil atenuadas); tocar "Misión Juvenil" mostró el aviso de
falta de permiso sin navegar; tocar "Ujieres" navegó correctamente a
`/captura/:id`. `npm run build` corre limpio.
