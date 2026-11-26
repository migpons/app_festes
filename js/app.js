"use strict";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
let programa = null;
let diaSeleccionado = -1;
let viendoFavoritos = false;
let seguirDiaActual = true;
let ultimaJornada = "";
let temporizador = null;

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

async function iniciarAplicacion() {
    window.scrollTo({top: 0, left: 0, behavior: "instant"});
    try {
        const activo = await prepararSelectorProgramas();
        // Disponible incluso si el JSON de un municipio no puede cargarse.
        crearSelectorProgramas();
        await cargarPrograma(activo.archivo);
        aplicarTema();
        aplicarImagenes();
        cargarCabecera();
        crearMenu();
        mostrarDia(obtenerIndiceDiaActual());
        activarBuscador();
        activarBotonFavoritos();
        actualizarBotonFavoritos();
        document.getElementById("buscador").disabled = false;
        document.getElementById("botonFavoritos").disabled = false;
        ultimaJornada = fechaJornada();
        actualizarEstadoTemporal();
        clearInterval(temporizador);
        temporizador = setInterval(actualizarEstadoTemporal, 15000);
        document.onvisibilitychange = () => { if (!document.hidden) actualizarEstadoTemporal(); };
        window.addEventListener("pageshow", actualizarEstadoTemporal);
        requestAnimationFrame(() => window.scrollTo({top: 0, left: 0, behavior: "instant"}));
    } catch (error) {
        console.error(error);
        mostrarError(error);
    }
}

function obtenerSiguienteActo(ahora = new Date()) {
    let siguiente = null;
    for (const dia of programa.dias) {
        for (const acto of dia.actos) {
            const fecha = obtenerFechaHoraActo(dia, acto);
            if (!fecha || fecha < ahora) continue;
            if (!siguiente || fecha < siguiente.fecha) siguiente = {dia, acto, fecha};
        }
    }
    return siguiente;
}

function mostrarProximoActo(ahora = new Date()) {
    const contenedor = document.getElementById("contadorActo");
    if (!programa || !contenedor) return;
    vaciar(contenedor);
    if (!programa.dias.length) {
        contenedor.textContent = "No hay días publicados en este programa.";
        return;
    }
    if (!programa.dias.some(dia => dia.actos.length)) {
        contenedor.textContent = "No hay actos publicados en este programa.";
        return;
    }
    const siguiente = obtenerSiguienteActo(ahora);
    const jornada = fechaJornada(ahora);
    const sinHora = programa.dias.some(d => d.fecha >= jornada && d.actos.some(a => horaMinutos(a.hora) === null));
    if (!siguiente) {
        const ultimaFecha = programa.dias.at(-1).fecha;
        contenedor.textContent = sinHora ? "Consulta el programa: hay actos sin hora exacta." :
            jornada > ultimaFecha ? "🎉 Las fiestas han finalizado." : "No quedan actos con hora programada para los días publicados.";
        return;
    }
    const fechaActo = partesFecha(siguiente.fecha).fecha;
    const hoy = partesFecha(ahora).fecha;
    const etiqueta = fechaActo === hoy ? "Hoy" : fechaActo === sumarDias(hoy, 1) ? "Mañana" : formatearFecha(fechaActo);
    contenedor.appendChild(crearElemento("strong", "", sinHora ? "🕒 Próximo acto con hora" : "🕒 Próximo acto"));
    contenedor.appendChild(document.createElement("br"));
    contenedor.appendChild(crearElemento("span", "", `${etiqueta} · ${siguiente.acto.hora}`));
    contenedor.appendChild(document.createElement("br"));
    contenedor.appendChild(crearElemento("span", "", siguiente.acto.titulo));
    if (sinHora) contenedor.appendChild(crearElemento("small", "aviso-horario", "Consulta también los actos sin hora exacta."));
}

function obtenerIndiceDiaActual(ahora = new Date()) {
    const hoy = fechaJornada(ahora);
    const conActos = programa.dias.map((dia, indice) => ({dia, indice})).filter(item => item.dia.actos.length);
    const actual = conActos.find(item => item.dia.fecha === hoy) || conActos.find(item => item.dia.fecha > hoy) || conActos.at(-1);
    return actual ? actual.indice : programa.dias.length ? 0 : -1;
}

function actualizarEstadoTemporal() {
    if (!programa) return;
    mostrarProximoActo();
    const jornada = fechaJornada();
    if (jornada !== ultimaJornada && seguirDiaActual && !viendoFavoritos && !document.getElementById("buscador").value.trim()) {
        mostrarDia(obtenerIndiceDiaActual());
    }
    ultimaJornada = jornada;
}

function mostrarError(error) {
    programa = null;
    clearInterval(temporizador);
    document.title = "No se ha podido cargar el programa";
    document.getElementById("tituloWeb").textContent = "No se ha podido cargar el programa";
    document.getElementById("contadorActo").textContent = "Puedes reintentar o seleccionar otro programa.";
    document.getElementById("buscador").disabled = true;
    document.getElementById("botonFavoritos").disabled = true;
    const contenido = document.getElementById("contenido");
    vaciar(contenido);
    const aviso = crearElemento("div", "error");
    aviso.setAttribute("role", "alert");
    aviso.appendChild(crearElemento("h2", "", "No se ha podido cargar el programa"));
    aviso.appendChild(crearElemento("p", "", error.message || "Comprueba tu conexión e inténtalo de nuevo."));
    const reintentar = crearElemento("button", "boton", "Reintentar");
    reintentar.type = "button";
    reintentar.onclick = () => window.location.reload();
    aviso.appendChild(reintentar);
    contenido.appendChild(aviso);
}

function limpiarBusqueda() { document.getElementById("buscador").value = ""; }
function activarBuscador() { document.getElementById("buscador").oninput = mostrarResultadosBusqueda; }
function mostrarResultadosBusqueda() {
    const texto = normalizarTexto(document.getElementById("buscador").value.trim());
    if (!texto) {
        if (viendoFavoritos) mostrarFavoritos();
        else mostrarDia(diaSeleccionado);
        return;
    }
    const contenido = document.getElementById("contenido");
    vaciar(contenido);
    contenido.appendChild(crearElemento("h2", "titulo-dia", viendoFavoritos ? "🔎 Buscar en mis favoritos" : "🔎 Resultados de búsqueda"));
    const favoritos = new Set(obtenerFavoritosVisibles());
    let encontrados = 0;
    for (const dia of programa.dias) {
        const actos = dia.actos.filter(acto => {
            if (viendoFavoritos && !favoritos.has(dia.fecha + "_" + acto.id)) return false;
            const contenidoActo = [acto.titulo, acto.descripcion, acto.ubicacion, acto.organiza, acto.precio,
                acto.observaciones, obtenerCategoria(acto.categoria)?.nombre, ...(acto.etiquetas || [])].filter(Boolean).join(" ");
            return normalizarTexto(contenidoActo).includes(texto);
        });
        if (!actos.length) continue;
        contenido.appendChild(crearElemento("h3", "titulo-dia", dia.titulo));
        actos.forEach(acto => contenido.appendChild(crearTarjeta(acto, dia)));
        encontrados += actos.length;
    }
    if (!encontrados) contenido.appendChild(crearElemento("div", "sin-actos", "No se han encontrado actos para esa búsqueda."));
    actualizarMenu(-1);
}
