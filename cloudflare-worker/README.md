# Worker de análisis de Excel con IA (Cloudflare Workers AI)

Analiza el contenido de un Excel (en CSV/JSON) con un modelo gratuito de Cloudflare y
devuelve un JSON con resumen, nivel, porcentaje, hallazgos y alertas.

## Desplegarlo (tú, una sola vez)

Necesitas una cuenta de Cloudflare (gratis).

```bash
cd cloudflare-worker
npx wrangler login          # abre el navegador para autorizar tu cuenta
npx wrangler deploy
```

Al terminar te da una URL, por ejemplo:
`https://rias-excel-analyzer.TU-SUBDOMINIO.workers.dev`

## Probarlo

```bash
curl -X POST https://rias-excel-analyzer.TU-SUBDOMINIO.workers.dev \
  -H "content-type: application/json" \
  -d '{"tipo":"indicadores","eps":"Famisanar","muestra":"Mes,Indicador,Numerador,Denominador,Cumplimiento\nFeb-26,Cobertura VIH gestantes,141,148,95.27%"}'
```

Respuesta:
```json
{ "ok": true, "tipo": "indicadores", "eps": "Famisanar",
  "analisis": { "resumen": "...", "nivel": "satisfactorio", "porcentaje": 95.3,
                "hallazgos": ["..."], "alertas": [] } }
```

## Conectarlo a la plataforma

1. Pon la URL del worker en Vercel como variable: `NEXT_PUBLIC_ANALYZER_URL`.
2. En la carga (cliente), convierte cada hoja a CSV con SheetJS (ya está instalado):
   `XLSX.utils.sheet_to_csv(hoja)` y haz `POST` al worker con `{ tipo, eps, muestra: csv }`.
3. Guarda el `analisis` que devuelve junto al registro de la carga y muéstralo en la
   sección de cada EPS (resumen + alertas).

> Recomendación: usa el Worker para el **análisis cualitativo** (resumen/alertas/hallazgos).
> La extracción exacta de filas/porcentajes la sigue haciendo el parser determinista de la app,
> que es más fiable para datos tabulares grandes.
