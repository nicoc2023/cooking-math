/* ============================================================
   COOKING MATH – Cálculo Multivariable (Firebase + Netlify)
   ============================================================ */

// === AQUÍ VA TU firebaseConfig (Firebase Console > Configuración del proyecto > Tus apps > Web) ===
const firebaseConfig = {
  apiKey: "AIzaSyBRrRJhN948QM4PoYNYBBecIReWdfm6B9k",
  authDomain: "cooking-calculo.firebaseapp.com",
  databaseURL: "https://cooking-calculo-default-rtdb.firebaseio.com",
  projectId: "cooking-calculo",
  storageBucket: "cooking-calculo.firebasestorage.app",
  messagingSenderId: "858087017754",
  appId: "1:858087017754:web:2796357598f8a62284f0a3",
  measurementId: "G-BVT07J3ZGX"
};
// === FIN firebaseConfig ===

// === AQUÍ VAN LOS 4 EJERCICIOS DE CÁLCULO MULTIVARIABLE Y SUS OPCIONES A, B, C, D ===
// Un objeto por escenario (masa, salsa, toppings, horno). Todo en LaTeX (usa String.raw para no duplicar "\").
// "correcta" debe ser "A", "B", "C" o "D".
const EJERCICIOS = [
  { pregunta: String.raw`\text{La temperatura en } ^\circ\text{C sobre una placa está dada por } T(x,y) = 3x^2 + 2xy - y^2. \text{ Un sensor en } P(1,2) \text{ se mueve en dirección de } \vec{v} = (3,4). \text{ ¿Cuál es la tasa de cambio de la temperatura en esa dirección?}`,
    opciones: { A: String.raw`30 \; ^\circ\text{C/unidad}`, B: String.raw`6 \; ^\circ\text{C/unidad}`, C: String.raw`\frac{34}{5} \; ^\circ\text{C/unidad}`, D: String.raw`34 \; ^\circ\text{C/unidad}` },
    correcta: "B" },
  { pregunta: String.raw`\text{Dada la función } f(x,y) = x^2 + y^2 - 4x + 6y + 10, \text{ determine el punto crítico y clasifíquelo usando el criterio de la segunda derivada.}`,
    opciones: { A: String.raw`\text{Punto silla en } (2,-3)`, B: String.raw`\text{Máximo local en } (2,-3)`, C: String.raw`\text{Mínimo local en } (2,-3)`, D: String.raw`\text{Mínimo local en } (-2,3)` },
    correcta: "C" },
  { pregunta: String.raw`\text{Una empresa quiere diseñar una valla rectangular de área máxima contra una pared (solo cerca tres lados: dos de ancho } x \text{ y uno de largo } y\text{). Si dispone de 40 metros de malla (}2x+y=40\text{), ¿cuál es el área máxima } A(x,y)=xy \text{ que puede encerrar?}`,
    opciones: { A: String.raw`100 \text{ m}^2`, B: String.raw`200 \text{ m}^2`, C: String.raw`400 \text{ m}^2`, D: String.raw`150 \text{ m}^2` },
    correcta: "B" },
  { pregunta: String.raw`\text{Calcule el valor de la siguiente integral doble sobre la región rectangular } R = [0,2] \times [1,3]: \\ \int_{1}^{3} \int_{0}^{2} (2x+y) \, dx \, dy`,
    opciones: { A: String.raw`12`, B: String.raw`14`, C: String.raw`20`, D: String.raw`16` },
    correcta: "D" }
];
// === FIN EJERCICIOS ===

// Escenas: cada imagen es [archivo, left%, top%, ancho%] dentro del bloque superior.
// Escenas: cada imagen es [archivo, left%, top%, ancho%] dentro del bloque superior.
const ESCENAS = [
  { fondo: "fondo_cocina.png",
    ini: [
      ["bowl_vacio.png", 31, 52, 38],
      ["harina.png", 17, 50, 17],
      ["azucar.png", 66, 51, 17],
      ["agua.png", 4, 65, 17],
      ["sal.png", 79, 65, 17]
    ],
    fin: [["bowl_masa.png", 29, 52, 42]] },
  { fondo: "fondo_cocina.png",
    ini: [
      ["pizza_cruda.png", 10, 53, 62],
      ["cucharon_lleno.png", 64, 34, 32]
    ],
    fin: [
      ["pizza_salsa.png", 10, 53, 62],
      ["cucharon_vacio.png", 64, 34, 32]
    ] },
  { fondo: "fondo_cocina.png",
    ini: [
      ["pepperoni.png", 16, 54, 19],
      ["queso.png", 65, 54, 19],
      ["pizza_salsa.png", 25, 55, 50],
      ["champinones.png", 3, 68, 19],
      ["pimenton.png", 78, 68, 19]
    ],
    fin: [["pizza_toppings.png", 25, 55, 50]] },
  { fondo: "fondo_horno.png",
    ini: [],
    fin: [] }
];

const SEGUNDOS = 60, VIDAS = 4;
const COLORES = ["#E8503A", "#FFD66B", "#7ED6A0", "#7EC8F0", "#FFB3C7"];
const $ = s => document.querySelector(s);

firebase.initializeApp(firebaseConfig);
const sala = firebase.database().ref("sala");

let miId = null, esAdmin = false, estado = null, grupos = [], g = null;

/* ---------- Utilidades ---------- */
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.toggle("activa", p.id === id));
}
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const esperar = ms => new Promise(r => setTimeout(r, ms));
const animar = (el, cls) => new Promise(r => {
  el.classList.remove("crece", "encoge"); void el.offsetWidth;
  el.addEventListener("animationend", r, { once: true }); el.classList.add(cls);
});

// Renderiza LaTeX con KaTeX, pero los \text{...} salen como texto normal para que el párrafo SÍ salte de línea
function mixto(el, s) {
  let out = "", mat = "", i = 0;
  const vaciar = () => {
    mat = mat.replace(/(^|\s)\^/g, "$1{}^");   // un exponente suelto necesita una base vacía {}
    if (mat.trim()) out += katex.renderToString(mat, { throwOnError: false, displayMode: mat.includes("\\int") });
    mat = "";
  };
  while (i < s.length) {
    if (s.startsWith("\\text{", i)) {
      let d = 1, j = i + 6;
      while (j < s.length && d) { if (s[j] === "{") d++; else if (s[j] === "}") d--; j++; }
      vaciar(); out += esc(s.slice(i + 6, j - 1)); i = j;
    } else if (s.startsWith("\\\\", i)) { vaciar(); out += "<br>"; i += 2; }
    else mat += s[i++];
  }
  vaciar();
  el.innerHTML = out;
}

async function negro(accion) { // transición negra entre pantallas
  const t = $("#telon");
  t.classList.add("on");
  await esperar(400);
  accion();
  await esperar(150);
  t.classList.remove("on");
}

/* ---------- Lobby / Espera ---------- */
$("#btnUnirse").onclick = async () => {
  const nombre = $("#inGrupo").value.trim(), integ = $("#inIntegrantes").value.trim().replace(/\n+/g, ", ");
  if (!nombre || !integ) { $("#msgLobby").textContent = "Escribe el grupo y los integrantes."; return; }
  const ref = sala.child("grupos").push({ nombre, integrantes: integ, puntos: 0, vidas: VIDAS, tiempo: 0, terminado: false });
  miId = ref.key;
  mostrar("espera");
  chequearInicio();
};

/* ---------- Anfitrión ---------- */
$("#btnAdmin").onclick = () => {
  if (prompt("Clave del anfitrión:") === "admin123") { esAdmin = true; mostrar("admin"); pintarAdmin(); }
};
$("#btnIniciar").onclick = () => sala.child("estado").set("jugando");
$("#btnReiniciar").onclick = () => { if (confirm("¿Borrar todos los grupos?")) sala.set({ estado: "lobby" }); };

function pintarAdmin() {
  const orden = [...grupos].sort((a, b) => (b.puntos - a.puntos) || (a.tiempo - b.tiempo));
  $("#listaGrupos").innerHTML = orden.length
    ? orden.map((x, i) => {
        const estadoTxt = x.vidas <= 0 ? "💔 Game Over"
          : x.terminado ? "✅ Terminado"
          : "Jugando " + "❤️".repeat(x.vidas);
        return `<li><b class="pts">${x.puntos} pts</b>
          <b>${i + 1}. ${esc(x.nombre)}</b>
          <small>${esc(x.integrantes)}</small>
          <small>${estadoTxt}</small></li>`;
      }).join("")
    : "<li>Aún no hay grupos conectados…</li>";
}

/* ---------- Escuchas en tiempo real ---------- */
sala.child("estado").on("value", s => { estado = s.val(); chequearInicio(); });
sala.child("grupos").on("value", snap => {
  if (miId && !snap.hasChild(miId)) { location.reload(); return; } // la sala fue reiniciada
  grupos = [];
  snap.forEach(c => grupos.push({ id: c.key, ...c.val() }));
  if (esAdmin) pintarAdmin();
  pintarRanking();
});
function chequearInicio() { if (miId && estado === "jugando" && !g) empezar(); }

/* ---------- Juego ---------- */
function empezar() {
  g = { i: 0, vidas: VIDAS, puntos: 0, tiempo: 0, t0: 0, timer: null, activo: false };
  negro(() => { mostrar("juego"); cargarEscena(); });
}

function pintarImgs(lista) {
  $("#items").innerHTML = lista.map(([f, l, t, w]) =>
    `<img src="assets/${f}" alt="" style="left:${l}%;top:${t}%;width:${w}%">`).join("");
}

function hud() {
  $("#vidas").textContent = "❤️".repeat(g.vidas) + "🖤".repeat(VIDAS - g.vidas);
  $("#puntos").textContent = g.puntos + " pts";
  $("#paso").textContent = (g.i + 1) + "/4";
}

function cargarEscena() {
  const e = ESCENAS[g.i], ej = EJERCICIOS[g.i];
  $("#juego").style.backgroundImage = `url(assets/${e.fondo})`;
  pintarImgs(e.ini);
  mixto($("#enunciado"), ej.pregunta);
  $("#opciones").innerHTML = Object.keys(ej.opciones).map(k =>
    `<button class="opt" data-k="${k}"><b>${k}</b><span></span></button>`).join("");
  document.querySelectorAll(".opt").forEach(b => {
    mixto(b.querySelector("span"), ej.opciones[b.dataset.k]);
    b.onclick = () => responder(b.dataset.k);
  });
  verProblema();
  hud();
  g.t0 = Date.now(); g.activo = true;
  clearInterval(g.timer);
  g.timer = setInterval(tick, 250); tick();
}

function tick() {
  if (!g.activo) return;
  const rest = SEGUNDOS - (Date.now() - g.t0) / 1000;
  $("#relleno").style.width = Math.max(0, rest / SEGUNDOS * 100) + "%";
  $("#relleno").classList.toggle("poco", rest < 60);
  if (rest <= 0) tiempoAgotado();
}

function verOpciones() { $("#vistaProblema").hidden = true; $("#vistaOpciones").hidden = false; }
function verProblema() { $("#vistaProblema").hidden = false; $("#vistaOpciones").hidden = true; }
$("#btnVerOpc").onclick = verOpciones;
$("#btnVerProb").onclick = verProblema;

function cerrarPregunta() { // detiene el reloj y acumula el tiempo usado
  g.activo = false; clearInterval(g.timer);
  g.tiempo += Math.min(SEGUNDOS, (Date.now() - g.t0) / 1000);
}
function guardar(terminado = false) {
  sala.child("grupos/" + miId).update({ puntos: g.puntos, vidas: g.vidas, tiempo: Math.round(g.tiempo), terminado });
}

async function responder(k) {
  if (!g.activo) return;
  if (k === EJERCICIOS[g.i].correcta) return acierto();
  g.vidas--; hud(); guardar();
  if (g.vidas <= 0) { cerrarPregunta(); return terminar(true); }
  const t = $("#toast"); t.hidden = true; void t.offsetWidth; t.hidden = false;
  setTimeout(() => t.hidden = true, 900);
  verProblema();
}

async function logro() { // texto grande "¡Lo lograste!" con rebote
  const l = $("#logro");
  l.innerHTML = [..."¡Lo lograste!"].map((c, i) =>
    `<span style="color:${COLORES[i % COLORES.length]}">${c === " " ? "&nbsp;" : c}</span>`).join("");
  l.hidden = true; void l.offsetWidth; l.hidden = false;
  await new Promise(r => l.addEventListener("animationend", r, { once: true }));
  l.hidden = true;
}

async function acierto() {
  const rest = Math.max(0, SEGUNDOS - (Date.now() - g.t0) / 1000);
  cerrarPregunta();
  g.puntos += Math.max(100, Math.round(1000 * rest / SEGUNDOS)); // más rápido = más puntos
  hud();
  if (g.i === ESCENAS.length - 1) {
    await logro();                               // escenario 4: "¡Lo lograste!"
  } else {
    const nube = $("#nube");
    await animar(nube, "crece");                 // la nube cubre la escena (boing)
    pintarImgs(ESCENAS[g.i].fin);                // cambio de estado por debajo
    await esperar(250);
    await animar(nube, "encoge");                // la nube se aleja y revela el resultado
    await esperar(900);
  }
  siguiente();
}

function tiempoAgotado() {
  cerrarPregunta();
  g.vidas--; hud(); guardar();
  if (g.vidas <= 0) return terminar(true);
  siguiente();
}

function siguiente() {
  g.i++;
  if (g.i >= ESCENAS.length) return terminar(false);
  guardar(); negro(cargarEscena);
}

/* ---------- Final y ranking ---------- */
function terminar(gameOver) {
  guardar(true);
  $("#tituloFinal").textContent = gameOver ? "💔 Game Over" : "🍕 ¡Pizza lista!";
  negro(() => mostrar("final"));
  pintarRanking();
}

function pintarRanking() {
  const medallas = ["🥇", "🥈", "🥉"];
  const orden = [...grupos].sort((a, b) => (b.puntos - a.puntos) || (a.tiempo - b.tiempo));
  $("#ranking").innerHTML = orden.map((x, i) => `
    <tr class="${x.id === miId ? "yo" : ""}">
      <td class="puesto"><span>${medallas[i] || (i + 1)}</span> ${esc(x.nombre)}</td>
      <td class="integ">${String(x.integrantes).split(", ").map(esc).join("<br>")}${x.terminado ? "" : "<br><em>jugando…</em>"}</td>
      <td><span class="pts-badge">${x.puntos}</span></td>
    </tr>`).join("");
}
