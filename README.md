# SIGA — App de Captura (PWA)

App móvil instalable para que cualquier persona con un cargo asignado
(ujier, líder de Evangelismo, Misión Juvenil, encargado de un Apartado)
registre asistencia desde el celular. Usa el **mismo backend Supabase**
que el proyecto web `siga-nacional` — mismo esquema, mismas tablas,
mismo RLS.

## Cómo arrancar en VS Code

```bash
npm install
cp .env.example .env
# Completa .env con las MISMAS credenciales que usaste en siga-nacional
npm run dev
```

Abre en `http://localhost:5174` (puerto distinto al de la web, para poder
correr ambos proyectos a la vez).

## Cómo funciona

1. **Login** — misma cuenta de Supabase Auth que usa la persona en el
   sistema (se la crea el admin local de su congregación).
2. **Home** — consulta `asignaciones_cargo` para saber a qué módulo(s)
   tiene acceso esa persona *ahora mismo*:
   - 1 sola asignación → entra directo al formulario.
   - Varias → selector de "¿qué vas a registrar hoy?".
   - Ninguna → mensaje de "sin acceso asignado".
3. **Captura** — el formulario es **genérico**: trae dinámicamente las
   categorías demográficas y tipos de actividad de la congregación y el
   módulo correspondientes. Sirve igual para Ujieres, Evangelismo, Misión
   Juvenil o Apartados — es el mismo motor que ya usa la web, no hay
   pantallas distintas por módulo.

## Por qué PWA (no nativa/híbrida)

Misma decisión que en el proyecto anterior y que sigue aplicando: no hay
necesidad real de funcionamiento offline ni de hardware avanzado, así que
una PWA da instalación en pantalla de inicio sin pasar por tiendas de
apps, y reutiliza el mismo stack de React/Supabase.

## Instalación en el celular (una vez desplegado)

- **Android (Chrome):** menú (⋮) → "Instalar aplicación".
- **iPhone (Safari):** compartir → "Añadir a pantalla de inicio".

## Pendiente conocido

- **Íconos placeholder** en `public/icons/` — reemplazar con el logo real
  de la IPUC antes de producción.
- **Responsable de actividad distinto al que captura.** Hoy
  `capturado_por` se resuelve automático vía `auth.uid()`; si necesitas el
  caso de "otro presidió pero yo capturé" (mencionado para Apartados/Ujieres
  en la especificación), hay que agregar un `<select>` de responsable
  explícito — el campo `responsable_persona_id` ya existe en el esquema.
- **Selector de fecha.** Hoy el registro usa la fecha por defecto del
  servidor (`current_date`); si necesitan capturar retroactivamente (ej.
  cargar el domingo lo que se les olvidó reportar el sábado), agregar un
  campo de fecha editable al formulario.
- **Despliegue** — sin hosting configurado aún; cualquier proveedor de
  sitios estáticos (Vercel, Netlify) sirve, es 100% frontend + Supabase.
- **Amigos desde la PWA** — hoy el registro de "Amigos" en seguimiento
  (para líderes de Evangelismo/Misión Juvenil) se hace desde la web; si se
  necesita que también se capture desde el celular en el momento, es una
  pantalla adicional pendiente de construir aquí.
