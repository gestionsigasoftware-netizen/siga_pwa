# Reorganización visual de "Mis estadísticas" (2026-09-04)

## El pedido

El selector de periodo (Hoy/Semana/Mes/Semestre/Año) era una fila de
pastillas con scroll horizontal -- en pantallas de celular normales no
cabían las 5 y quedaba cortada ("Año" fuera de vista, solo visible
deslizando). Se pidió mejorar el orden visual y sugerir qué más mostrar.

## Corrección

- **Selector de periodo sin scroll**: pasó de una fila `overflow-x-auto`
  a una cuadrícula de 5 columnas iguales (`grid grid-cols-5`), con
  etiquetas cortas ("Hoy", "Sem", "Mes", "6M", "Año") -- mismo patrón
  que usan apps de finanzas para selectores de periodo. Todas caben
  siempre en una sola fila, sin depender del ancho del teléfono.
- **Periodo concreto visible**: debajo del selector ahora se muestra el
  rango real resuelto (ej. "Septiembre de 2026", "31 de agosto al 6 de
  septiembre", "Primer semestre 2026") -- antes la única referencia al
  periodo era el botón ya presionado, que solo dice el nombre genérico
  ("Mes"), no a qué fecha corresponde.
- **Tarjeta "Periodo" reemplazada por "Tendencia"**: esa tarjeta solo
  repetía el nombre del botón activo (redundante). Ahora muestra la
  variación % de asistentes frente al mismo periodo inmediatamente
  anterior (mes anterior, semana anterior, etc.), en verde/rojo según
  suba o baje. Si no hay datos del periodo anterior para comparar,
  muestra "Sin periodo anterior" en vez de inventar un porcentaje.

## Verificación

`npm run build` corre limpio. Verificado visualmente con Playwright y la
cuenta de prueba: el selector cabe en una fila en 390px de ancho, el
texto del periodo concreto cambia correctamente entre pestañas
(incluyendo el caso de una semana que cruza de agosto a septiembre,
donde se corrigió que mostrara ambos meses en vez de asumir que los dos
extremos son del mismo mes), y la tarjeta de Tendencia muestra
correctamente "Sin periodo anterior" cuando no hay datos previos que
comparar.
