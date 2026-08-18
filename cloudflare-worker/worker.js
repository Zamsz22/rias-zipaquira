// Worker de Cloudflare con Workers AI (gratis) para analizar los datos de un Excel.
// Recibe el contenido del Excel ya convertido a CSV/JSON (texto) y devuelve un JSON
// con análisis: resumen, nivel de cumplimiento, porcentaje, hallazgos y alertas.
//
// NOTA de ingeniería: un LLM NO es bueno extrayendo miles de filas exactas; para eso
// sigue el parser determinista de la app. El Worker es ideal para el ANÁLISIS/insumo
// cualitativo (resumen, alertas, hallazgos) por hoja/componente.

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    if (request.method !== "POST") return cors(json({ error: "Usa POST" }, 405));

    let body;
    try {
      body = await request.json();
    } catch {
      return cors(json({ error: "JSON inválido" }, 400));
    }

    const { tipo = "", eps = "", muestra = "", modelo } = body;
    if (!muestra) return cors(json({ error: "Falta 'muestra' (datos compactos del Excel)" }, 400));

    const sistema =
      "Eres analista de la Secretaría de Salud de Zipaquirá. Analizas datos de cumplimiento de RIAS. " +
      "REGLAS ESTRICTAS: usa ÚNICAMENTE los números y textos que te entregan; NO inventes ni estimes cifras; " +
      "si citas un porcentaje o conteo debe aparecer EXACTO en los datos. Responde SOLO con JSON válido, sin texto extra.";

    const prompt =
      `Componente: "${tipo}". EPS: "${eps}".\n` +
      `Devuelve un JSON con: resumen (1-2 frases citando las cifras exactas más relevantes), ` +
      `nivel ("satisfactorio"|"aceptable"|"critico"|"muy_critico"|"sin_dato"), ` +
      `promedio (numero 0-100 o null, calculado solo si los datos lo permiten), ` +
      `hallazgos (array de strings: lo más crítico, con su cifra exacta), ` +
      `alertas (array de strings: lo que requiere acción urgente).\n` +
      `DATOS (ya extraídos del Excel, exactos):\n${String(muestra).slice(0, 8000)}`;

    let texto = "";
    try {
      const ai = await env.AI.run(modelo || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: sistema },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });
      texto = ai.response ?? "";
    } catch (e) {
      return cors(json({ error: "Workers AI falló: " + e.message }, 502));
    }

    let analisis;
    try {
      analisis = JSON.parse(extraerJson(texto));
    } catch {
      analisis = { resumen: texto.slice(0, 400), nivel: "sin_dato", porcentaje: null, hallazgos: [], alertas: [] };
    }
    return cors(json({ ok: true, tipo, eps, analisis }));
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}
function cors(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "content-type");
  return res;
}
function extraerJson(t) {
  const m = t.match(/\{[\s\S]*\}/);
  return m ? m[0] : t;
}
