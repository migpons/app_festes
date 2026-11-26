"use strict";

const favoritosEnMemoria = new Map();
const clavesSoloEnMemoria = new Set();

function obtenerClaveFavoritos() {
    const id = obtenerIdProgramaSeleccionado();
    return id ? `favoritos_${id}` : "favoritos";
}

function leerListaFavoritos(texto) {
    try {
        const lista = JSON.parse(texto || "[]");
        return Array.isArray(lista) ? [...new Set(lista.filter(x => typeof x === "string"))] : [];
    } catch { return []; }
}

function migrarFavoritosAnteriores(clave) {
    // La clave sin municipio pertenece al programa heredado de Iglesuela.
    if (obtenerIdProgramaSeleccionado() !== "iglesuela-2026") return;
    if (localStorage.getItem(clave) !== null) return;
    const anteriores = localStorage.getItem("favoritos");
    if (anteriores !== null) {
        const lista = leerListaFavoritos(anteriores);
        favoritosEnMemoria.set(clave, lista);
        localStorage.setItem(clave, JSON.stringify(lista));
    }
}

function obtenerFavoritos() {
    const clave = obtenerClaveFavoritos();
    if (clavesSoloEnMemoria.has(clave)) return [...(favoritosEnMemoria.get(clave) || [])];
    try {
        migrarFavoritosAnteriores(clave);
        const lista = leerListaFavoritos(localStorage.getItem(clave));
        favoritosEnMemoria.set(clave, lista);
        return [...lista];
    } catch { return [...(favoritosEnMemoria.get(clave) || [])]; }
}

function guardarFavoritos(lista) {
    const clave = obtenerClaveFavoritos();
    const limpia = [...new Set(lista.filter(x => typeof x === "string"))];
    favoritosEnMemoria.set(clave, limpia);
    try {
        localStorage.setItem(clave, JSON.stringify(limpia));
        clavesSoloEnMemoria.delete(clave);
    } catch { clavesSoloEnMemoria.add(clave); }
    const aviso = document.getElementById("avisoFavoritos");
    if (aviso) {
        aviso.hidden = !clavesSoloEnMemoria.has(clave);
        aviso.textContent = "El navegador no permite guardar favoritos. Se conservarán mientras esta página esté abierta.";
    }
}

function esFavorito(clave) { return obtenerFavoritos().includes(clave); }

function obtenerFavoritosVisibles() {
    const validas = new Set(programa.dias.flatMap(dia => dia.actos.map(acto => dia.fecha + "_" + acto.id)));
    return obtenerFavoritos().filter(clave => validas.has(clave));
}

function cambiarFavorito(clave) {
    const lista = obtenerFavoritos();
    guardarFavoritos(lista.includes(clave) ? lista.filter(x => x !== clave) : [...lista, clave]);
    actualizarBotonFavoritos();
}

function mostrarFavoritos() {
    const contenido = document.getElementById("contenido");
    vaciar(contenido);
    contenido.appendChild(crearElemento("h2", "titulo-dia", "❤️ Mis favoritos"));
    const favoritos = new Set(obtenerFavoritosVisibles());
    for (const dia of programa.dias) {
        const actos = dia.actos.filter(acto => favoritos.has(dia.fecha + "_" + acto.id));
        if (!actos.length) continue;
        contenido.appendChild(crearElemento("h3", "titulo-dia", dia.titulo));
        actos.forEach(acto => contenido.appendChild(crearTarjeta(acto, dia)));
    }
    if (!favoritos.size) contenido.appendChild(crearElemento("div", "sin-actos", "Todavía no has añadido ningún favorito de los días publicados."));
    actualizarMenu(-1);
}

function activarBotonFavoritos() {
    document.getElementById("botonFavoritos").onclick = () => {
        limpiarBusqueda();
        viendoFavoritos = !viendoFavoritos;
        if (viendoFavoritos) mostrarFavoritos();
        else mostrarDia(diaSeleccionado);
        actualizarBotonFavoritos();
    };
}

function actualizarBotonFavoritos() {
    const boton = document.getElementById("botonFavoritos");
    if (!boton || !programa) return;
    const total = obtenerFavoritosVisibles().length;
    boton.textContent = viendoFavoritos ? "← Volver al programa" : `❤️ Mis favoritos${total ? ` (${total})` : ""}`;
    boton.setAttribute("aria-pressed", String(viendoFavoritos));
}
