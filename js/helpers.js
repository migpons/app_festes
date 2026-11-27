"use strict";

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }
function crearElemento(tag, clase = "", texto = "") {
    const elemento = document.createElement(tag);
    if (clase) elemento.className = clase;
    if (texto !== "" && texto != null) elemento.textContent = String(texto);
    return elemento;
}
function vaciar(elemento) { elemento.replaceChildren(); }
function fechaValida(texto) {
    if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
    const fecha = new Date(texto + "T12:00:00Z");
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}
function formatearFecha(texto) {
    return new Date(texto + "T12:00:00Z").toLocaleDateString("es-ES", {
        timeZone: "UTC", weekday: "long", day: "numeric", month: "long"
    });
}
function horaMinutos(hora) {
    if (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return null;
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}
function minutosCambioDia(config = programa?.config) {
    return horaMinutos(config?.horaCambioDia ?? config?.municipio?.horaCambioDia ?? "06:00") ?? 360;
}
function obtenerHoraOrdenacion(hora, config = programa?.config) {
    const minutos = horaMinutos(hora);
    if (minutos === null) return Infinity;
    return minutos < minutosCambioDia(config) ? minutos + 1440 : minutos;
}
function perteneceNocheAnterior(hora) {
    const minutos = horaMinutos(hora);
    return minutos !== null && minutos < minutosCambioDia();
}
function normalizarTexto(texto) {
    return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function ordenarActos(actos, config = programa?.config) {
    let anterior = minutosCambioDia(config);
    const ordenados = actos.map((acto, indice) => {
        let orden = obtenerHoraOrdenacion(acto.horaOrden ?? acto.hora, config);
        if (!Number.isFinite(orden)) {
            const texto = normalizarTexto(acto.hora);
            // Son posiciones de ordenación, nunca horas anunciadas como exactas.
            if (texto.includes("por la manana")) orden = Math.max(minutosCambioDia(config), 360);
            else if (texto.includes("por la tarde")) orden = 12 * 60;
            else orden = anterior + 0.001;
        }
        anterior = orden;
        return { acto, orden, indice };
    }).sort((a, b) => a.orden - b.orden || a.indice - b.indice);
    actos.splice(0, actos.length, ...ordenados.map(item => item.acto));
    return actos;
}
function sumarDias(fecha, cantidad) {
    const dia = new Date(fecha + "T12:00:00Z");
    dia.setUTCDate(dia.getUTCDate() + cantidad);
    return dia.toISOString().slice(0, 10);
}
function partesFecha(fecha = new Date()) {
    const formato = new Intl.DateTimeFormat("en-GB", {
        timeZone: programa?.config?.zonaHoraria || "Europe/Madrid",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    });
    const partes = Object.fromEntries(formato.formatToParts(fecha).map(p => [p.type, p.value]));
    return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}`, segundo: Number(partes.second) };
}
function fechaJornada(fecha = new Date()) {
    const partes = partesFecha(fecha);
    return perteneceNocheAnterior(partes.hora) ? sumarDias(partes.fecha, -1) : partes.fecha;
}
function fechaHoraEnZona(fecha, hora) {
    const base = Date.parse(`${fecha}T${hora}:00Z`);
    let instante = base;
    // Ajustar la diferencia entre UTC y la zona del municipio, también en invierno.
    for (let i = 0; i < 3; i++) {
        const partes = partesFecha(new Date(instante));
        const vista = Date.parse(`${partes.fecha}T${partes.hora}:${String(partes.segundo).padStart(2, "0")}Z`);
        instante += base - vista;
    }
    return new Date(instante);
}
function obtenerFechaHoraActo(dia, acto) {
    if (horaMinutos(acto.hora) === null) return null;
    const fecha = perteneceNocheAnterior(acto.hora) ? sumarDias(dia.fecha, 1) : dia.fecha;
    return fechaHoraEnZona(fecha, acto.hora);
}
function urlSegura(valor, soloLocal = false) {
    if (typeof valor !== "string" || !valor.trim()) return "";
    try {
        const url = new URL(valor, document.baseURI);
        if (!["http:", "https:"].includes(url.protocol)) return "";
        if (soloLocal && url.origin !== new URL(document.baseURI).origin) return "";
        return url.href;
    } catch { return ""; }
}
function aplicarTema() {
    const root = document.documentElement;
    for (const [variable, campo] of Object.entries({principal:"principal", secundario:"secundario", fondo:"fondo", texto:"texto", superficie:"tarjeta"})) {
        root.style.setProperty(`--color-${variable}`, programa.tema[campo]);
    }
    $('meta[name="theme-color"]').setAttribute("content", programa.tema.navegador || programa.tema.principal);
}
function cargarImagenCabecera(imagen, ruta) {
    return new Promise(resolve => {
        if (!ruta) { resolve(false); return; }
        let terminada = false;
        const finalizar = correcto => {
            if (terminada) return;
            terminada = true;
            clearTimeout(limite);
            imagen.onload = null;
            imagen.onerror = null;
            if (!correcto) imagen.removeAttribute("src");
            resolve(correcto);
        };
        const limite = setTimeout(() => finalizar(false), 6000);
        imagen.onload = () => {
            // decode evita mostrar la cabecera antes de que la imagen esté pintable.
            if (typeof imagen.decode === "function") imagen.decode().then(() => finalizar(true), () => finalizar(imagen.naturalWidth > 0));
            else finalizar(true);
        };
        imagen.onerror = () => finalizar(false);
        imagen.src = ruta;
    });
}
function obtenerOpcionesBanner(config = programa.config) {
    const banner = config.banner || {};
    return {
        textos: banner.soloImagen !== true && banner.mostrarTextos !== false,
        logo: banner.soloImagen !== true && banner.mostrarLogo !== false,
        soloImagen: banner.soloImagen === true
    };
}
async function aplicarImagenes() {
    const opciones = obtenerOpcionesBanner();
    const configLogo = programa.config.logo || {};
    const municipio = programa.config.municipio?.nombre || obtenerProgramaSeleccionadoInfo()?.nombre || "Programa de fiestas";
    document.title = programa.config.tituloPagina || programa.config.titulo || `${municipio} ${programa.config.anio}`;
    const logo = $("#logo");
    logo.hidden = true;
    logo.alt = `Fiestas de ${municipio} ${programa.config.anio}`;
    for (const tamano of ["pc", "tablet", "movil"]) {
        document.documentElement.style.setProperty(`--logo-${tamano}`, (configLogo[tamano]?.ancho || {pc: 320, tablet: 260, movil: 200}[tamano]) + "px");
    }
    logo.style.marginTop = (configLogo.margenSuperior ?? 0) + "px";
    logo.style.marginBottom = (configLogo.margenInferior ?? 0) + "px";
    $("#favicon").href = urlSegura(programa.config.favicon || "img/icon_festes.png", true);
    const portada = urlSegura(programa.config.portada, true);
    const [logoListo, portadaLista] = await Promise.all([
        cargarImagenCabecera(logo, opciones.logo ? urlSegura(configLogo.archivo, true) : ""),
        cargarImagenCabecera(new Image(), portada)
    ]);
    logo.hidden = !logoListo;
    if (!logoListo) logo.removeAttribute("src");
    document.querySelector(".hero-overlay").style.background = opciones.soloImagen ? "none" : "";
    $("#hero").style.backgroundImage = portadaLista ? `url(${JSON.stringify(portada)})` : "none";
}
function cargarCabecera() {
    const opciones = obtenerOpcionesBanner();
    const titulo = programa.config.titulo || "";
    const municipio = programa.config.municipio?.nombre || "";
    $("#tituloWeb").textContent = titulo;
    $("#subtituloWeb").textContent = municipio;
    $("#tituloWeb").hidden = !opciones.textos || !titulo.trim();
    $("#subtituloWeb").hidden = !opciones.textos || !municipio.trim();
    document.querySelector(".titulos").hidden = !opciones.textos || (!titulo.trim() && !municipio.trim());
    $("#anioFiestas").textContent = programa.config.anio;
    $("#copyright").textContent = "© " + (programa.config.copyright || "");
}
function buscarDia(id) { return programa.dias.find(dia => String(dia.id) === String(id)); }
function buscarActo(id) {
    for (const dia of programa.dias) {
        const acto = dia.actos.find(a => String(a.id) === String(id));
        if (acto) return acto;
    }
    return null;
}
function obtenerCategoria(id) { return programa.categorias.find(c => c.id === id); }
function colorCategoria(id) { return obtenerCategoria(id)?.color || "#607D8B"; }
function iconoCategoria(id) { return obtenerCategoria(id)?.icono || "📌"; }
