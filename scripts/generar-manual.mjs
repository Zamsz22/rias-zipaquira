import PDFDocument from "pdfkit";
import fs from "node:fs";

const OUT = "C:/Users/david/OneDrive/Escritorio/RIAS/Manual_Usuario_RIAS.pdf";

const BRAND = "#0f6e64";
const TEAL2 = "#0c4a47";
const LIMA = "#aed83b";
const INK = "#14241f";
const TENUE = "#5b6e68";

const doc = new PDFDocument({ size: "A4", margin: 54, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));
const PW = doc.page.width;
const M = 54;
const CW = PW - M * 2;

// ---------- Portada ----------
const grad = doc.linearGradient(0, 0, PW, 340);
grad.stop(0, BRAND).stop(1, TEAL2);
doc.rect(0, 0, PW, 340).fill(grad);
doc.roundedRect(M, 64, 60, 60, 16).fill(LIMA);
doc.fill(TEAL2).font("Helvetica-Bold").fontSize(30).text("+", M + 19, 76);
doc.fill("#ffffff").font("Helvetica-Bold").fontSize(28).text("Plataforma RIAS Zipaquirá", M, 160, { width: CW });
doc.font("Helvetica").fontSize(14).fillColor("#eafff8").text("Manual de usuario detallado", M, 198);
doc.fontSize(11).fillColor("#d8f7ee").text(
  "Cómo usar la plataforma y qué muestra cada pantalla: dashboard, prestadores, la página de cada EPS, las etapas del curso de vida y la carga de archivos.",
  M, 226, { width: CW - 30 },
);
doc.fontSize(10).fillColor("#ffffff").text("Secretaría de Salud de Zipaquirá · Vigencia 2026 · Versión 2.0", M, 296);
doc.y = 380;

function enspace(h) {
  if (doc.y + h > doc.page.height - 70) doc.addPage();
}
function heading(num, text) {
  enspace(46);
  doc.moveDown(0.5);
  const y = doc.y;
  doc.roundedRect(M, y, 26, 26, 8).fill(BRAND);
  doc.fill("#ffffff").font("Helvetica-Bold").fontSize(13).text(String(num), M, y + 6, { width: 26, align: "center" });
  doc.fill(INK).font("Helvetica-Bold").fontSize(15).text(text, M + 38, y + 4, { width: CW - 38 });
  doc.y = Math.max(doc.y, y + 30) + 6;
  doc.fillColor(INK);
}
function sub(text) {
  enspace(20);
  doc.fill(BRAND).font("Helvetica-Bold").fontSize(11.5).text(text, M, doc.y, { width: CW });
  doc.moveDown(0.2);
}
function para(text) {
  enspace(18);
  doc.font("Helvetica").fontSize(10.5).fillColor("#27332e").text(text, M, doc.y, { width: CW, lineGap: 2.5 });
  doc.moveDown(0.35);
}
function bullet(text) {
  enspace(16);
  const y = doc.y;
  doc.circle(M + 4, y + 6, 2.2).fill(BRAND);
  doc.fill("#27332e").font("Helvetica").fontSize(10.5).text(text, M + 16, y, { width: CW - 16, lineGap: 2 });
  doc.moveDown(0.28);
}
function step(n, text) {
  enspace(18);
  const y = doc.y;
  doc.circle(M + 7, y + 7, 7).fill(TEAL2);
  doc.fill(LIMA).font("Helvetica-Bold").fontSize(8).text(String(n), M + 3.5, y + 3.5, { width: 7, align: "center" });
  doc.fill("#27332e").font("Helvetica").fontSize(10.5).text(text, M + 22, y, { width: CW - 22, lineGap: 2 });
  doc.moveDown(0.4);
}

// ---------- Contenido ----------
heading(1, "Qué es la plataforma y qué es el RIAS");
para(
  "La plataforma reúne y muestra el cumplimiento de las Rutas Integrales de Atención en Salud (RIAS) de cada prestador del municipio (cada EPS con su IPS). Las RIAS organizan la atención por curso de vida para detectar riesgos a tiempo.",
);
para(
  "Usted sube los archivos Excel y la plataforma los lee, los organiza y les pone un color de semáforo. No modifica los datos: respeta lo que viene en cada Excel.",
);
sub("Las dos rutas");
bullet("Ruta materno perinatal: preconcepción, control prenatal, planificación familiar y lactancia materna.");
bullet("Promoción y mantenimiento: primera infancia, infancia, adolescencia, juventud, adultez y vejez. Más anexos como salud oral, salud mental y tamizajes de cáncer.");

heading(2, "Cómo moverse: la barra superior");
para("Arriba está el menú. Estas son las pantallas:");
bullet("Inicio: presentación de la plataforma y del RIAS.");
bullet("Dashboard: resumen de todos los prestadores.");
bullet("Prestadores: la lista; cada EPS por separado.");
bullet("Cargar: subir los archivos (ZIP, carpeta o sueltos).");
bullet("Manual: esta guía dentro de la plataforma.");
bullet("Botón Nueva EPS (arriba a la derecha): registrar un prestador que no esté.");

heading(3, "El Dashboard: qué muestra");
bullet("Índice promedio: el cumplimiento general del municipio, con su color.");
bullet("Satisfactorios / Aceptables / Críticos: cuántos prestadores hay en cada nivel.");
bullet("Índice por componente: gráfica con el promedio de los 7 componentes.");
bullet("Distribución: dona con cuántos prestadores hay en cada color.");
bullet("Índice integral por EPS: barras, una por prestador.");
bullet("Tarjetas de prestadores: haga clic en una para abrir su página.");

heading(4, "El semáforo: cómo leer los colores");
para("Cada porcentaje recibe un color según su nivel de cumplimiento:");
const chips = [
  ["Satisfactorio", "85% a 100%", "#16a34a"],
  ["Aceptable", "70% a 84%", "#d97706"],
  ["Crítico", "50% a 69%", "#ea580c"],
  ["Muy crítico", "50% o menos", "#dc2626"],
];
enspace(70);
const cy = doc.y + 2;
chips.forEach((c, i) => {
  const x = M + (i % 2) * (CW / 2);
  const yy = cy + Math.floor(i / 2) * 30;
  doc.roundedRect(x, yy, 13, 13, 4).fill(c[2]);
  doc.fill(INK).font("Helvetica-Bold").fontSize(10).text(c[0], x + 21, yy + 1);
  doc.fill(TENUE).font("Helvetica").fontSize(9.5).text(c[1], x + 21, yy + 13);
});
doc.y = cy + 66;
doc.fillColor(INK);

heading(5, "La página de cada EPS");
para("Desde Prestadores o desde el Dashboard, al abrir una EPS verá:");
bullet("Encabezado: el logo, el nombre de la EPS, su IPS y el índice integral con su color.");
bullet("7 tarjetas (una por componente): adherencia a historia clínica, indicadores, anexos, capacidad, biomédica, alertas y planes de mejora, cada una con su porcentaje.");
bullet("Perfil por componente: una gráfica de radar con los 7 componentes.");
bullet("Detalle por documento: pestañas con la información cargada de cada Excel.");

heading(6, "Lo más importante: las etapas del curso de vida");
para(
  "Dentro de cada pestaña (por ejemplo Indicadores o Historias), la información se separa por ETAPA / curso de vida. Cada bloque plegable es una etapa: Preconcepción, Control prenatal, Planificación familiar, Lactancia, Primera infancia, Infancia, Adolescencia, Juventud, Adultez, Vejez, además de Salud oral, Salud mental y los tamizajes de cáncer.",
);
sub("Cómo se ve cada etapa");
bullet("Haga clic en el título de la etapa para abrir o cerrar su contenido.");
bullet("Cada dato se muestra como una tarjeta (no como una tabla): nombre del indicador o criterio, su porcentaje con color, y debajo numerador, denominador, mes, y el análisis.");
bullet("Con el botón 'Tabla' puede ver los mismos datos en forma de tabla si lo prefiere.");
bullet("Si hay muchos registros, use 'Ver más' para cargar más tarjetas.");

heading(7, "Cargar archivos (fácil)");
para("En la pantalla Cargar hay tres formas de subir:");
step(1, "Subir un ZIP: la carpeta comprimida del prestador.");
step(2, "Subir una carpeta completa: se analizan todos los Excel que tenga dentro.");
step(3, "Subir archivos: uno o varios .xlsx sueltos.");
para("La plataforma, por cada archivo:");
bullet("Lee todos los Excel y todas sus hojas.");
bullet("Detecta a qué EPS pertenece por el nombre de la carpeta (reconoce Famisanar–Cafam y Nueva EPS–Clínica Chía).");
bullet("Marca como 'Ya analizado' lo que ya estaba cargado, para no repetir.");
bullet("Si no detecta la EPS o el tipo, usted lo elige en la misma fila.");
step(4, "Revise la tabla (archivo, EPS, tipo, hojas, filas, %) y pulse 'Guardar'.");

heading(8, "Volver a subir para actualizar");
para("Cuando un prestador entrega archivos corregidos o de un nuevo periodo:");
bullet("En la pantalla Cargar, marque la casilla 'Reemplazar lo ya analizado'. Así los archivos que figuran como 'Ya analizado' se vuelven a guardar, reemplazando los anteriores.");
bullet("También puede entrar a la página de la EPS y usar el botón 'Actualizar datos', que lo lleva a Cargar.");

heading(9, "Crear una EPS nueva");
step(1, "Pulse 'Nueva EPS' (arriba a la derecha).");
step(2, "Escriba el nombre de la EPS y su IPS primaria.");
step(3, "Guarde: la EPS queda lista para cargarle archivos.");

heading(10, "Los 7 componentes");
const comps = [
  ["Adherencia a historia clínica", "20%"],
  ["Indicadores trazadores SIGERES", "20%"],
  ["Anexos / listas de chequeo", "15%"],
  ["Capacidad instalada", "15%"],
  ["Dotación y equipos biomédicos", "10%"],
  ["Alertas gestionadas", "10%"],
  ["Planes de mejora", "10%"],
];
comps.forEach(([n, p]) => bullet(`${n} — peso ${p}.`));

heading(11, "Qué tipo de datos se analiza (y de qué Excel sale)");
para("La plataforma lee 5 tipos de Excel por prestador. Cada uno alimenta un componente y se muestra en su pestaña:");
sub("1. Historias clínicas (Consolidado_RIAS_Historias_Clinicas)");
bullet("Una hoja por paciente. Se extrae documento, edad, sexo y se cuentan los CUMPLE / NO CUMPLE → adherencia %.");
bullet("Dónde se ve: pestaña 'Adherencia HC', agrupado por curso de vida; cada paciente con su detalle de aspectos.");
sub("2. Indicadores trazadores (consolidado_RIAS_indicadores-trazadores)");
bullet("Una hoja por curso/tema. Se lee: indicador, numerador, denominador, % de cumplimiento, análisis y actividades.");
bullet("Dónde se ve: pestaña 'Indicadores', por etapa.");
sub("3. Anexos / listas de chequeo (ANEXOS-RIAS)");
bullet("Una hoja por anexo (salud oral, cáncer, etc.). Se lee el aspecto y su % de cumplimiento.");
bullet("Dónde se ve: pestaña 'Anexos'.");
sub("4. Dotación y equipos biomédicos (Matriz R.Dotacion)");
bullet("Servicios, criterios, % de cumplimiento, riesgo y semáforo. Dónde: pestaña 'Biomédica'.");
sub("5. Plan de mejora (PLAN DE MEJORA ...)");
bullet("Hallazgos: ruta, descripción, causa, acción, responsable y seguimiento. Dónde: pestaña 'Plan de mejora'.");
para("Alertas y Capacidad instalada todavía no tienen archivo; sus pestañas quedan vacías hasta que se carguen.");

heading(12, "Dónde está cada dato y por qué");
bullet("Inicio: explica la plataforma y el RIAS. Sirve de portada.");
bullet("Dashboard: el resumen del municipio (índice promedio, conteos, gráficas, lista de prestadores).");
bullet("Prestadores: la lista; cada EPS con su tarjeta y mini-perfil de componentes.");
bullet("Página de la EPS: arriba el índice y las 7 tarjetas de componente; abajo el detalle por documento, agrupado por curso de vida.");
bullet("Cargar: subir/actualizar archivos. Manual: esta guía.");
para("Todo se guarda en la base de datos (Supabase). La plataforma respeta el dato del Excel; no lo recalcula.");

heading(13, "Cómo se mide el cumplimiento (el índice)");
para("El índice integral pondera los componentes que SÍ traen un porcentaje en el Excel y se normaliza entre ellos (no se inventan valores).");
bullet("Historias: % = CUMPLE / (CUMPLE + NO CUMPLE).");
bullet("Indicadores, Anexos, Biomédica: promedio del % de cumplimiento que trae el Excel.");
bullet("Plan de mejora: se muestra el número de hallazgos; no aporta % porque el Excel no trae el seguimiento diligenciado.");
bullet("Semáforo: Satisfactorio 85-100, Aceptable 70-84, Crítico 50-69, Muy crítico 50 o menos.");

heading(14, "Preguntas frecuentes");
para("¿La plataforma cambia mis datos? No. Solo los muestra y les pone color.");
para("¿Por qué algunas etapas tienen pocos datos? Porque el Excel solo trae esos meses o registros diligenciados.");
para("¿Necesito internet? Sí, para guardar en la base de datos.");
para("¿Subí un archivo equivocado? Vuelva a subir el correcto con 'Reemplazar lo ya analizado' marcado.");

// ---------- Pie ----------
const range = doc.bufferedPageRange();
for (let i = 1; i < range.count; i++) {
  doc.switchToPage(i);
  doc.font("Helvetica").fontSize(8).fillColor(TENUE);
  doc.text("Manual de usuario · Plataforma RIAS Zipaquirá 2026", M, doc.page.height - 38, { width: CW, align: "left" });
  doc.text(`Página ${i + 1} de ${range.count}`, M, doc.page.height - 38, { width: CW, align: "right" });
}
doc.end();
console.log("PDF:", OUT);
