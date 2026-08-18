# DESIGN.md — Sistema de diseño RIAS

## Dirección
Dashboard moderno tipo SaaS: **sidebar lateral fijo**, fondo claro frío, tarjetas blancas de radio grande con sombra suave, datos con gráficas variadas (área/línea, barras, radial/gauge, dona) y micro-interacciones de entrada. Intuitivo y comparable de un vistazo.

## Color (identidad preservada)
- Primario: azul institucional `--azul #0f3d5e` / `--azul2 #145c88`.
- Semáforo (solo datos): verde `#1f8f58`, amarillo `#d5a600`, naranja `#e06b22`, rojo `#c93737`.
- Superficie app: gris frío `#eef2f6`; tarjeta `#ffffff`; borde `#e4ecf1`.
- Tinta: `#24313c` (cuerpo, contraste ≥4.5:1). Texto tenue mínimo `#5c6b75` solo en etiquetas.
- Estrategia de color: **restrained** — neutros + azul como acento de marca; el color saturado se reserva para el semáforo de datos.

## Tipografía
- Una familia (Geist) con contraste de peso. Display 800, títulos 700, cuerpo 400/500. Sin all-caps en cuerpo; mayúsculas solo en etiquetas ≤4 palabras.

## Layout
- Sidebar 248px en `lg+`; en móvil, barra superior con menú. Contenido máx 1200px, ritmo de espaciado variado.
- Tarjetas solo donde son la mejor afordancia; nunca anidadas.

## Motion
- Entradas con ease-out, stagger en listas, contadores y barras que crecen. Respeta `prefers-reduced-motion` (crossfade/instantáneo).

## Bans aplicados
Sin texto en gradiente, sin borde-franja lateral, sin glassmorphism por defecto, sin eyebrows en mayúsculas en cada sección, sin rejillas de tarjetas idénticas infinitas.
