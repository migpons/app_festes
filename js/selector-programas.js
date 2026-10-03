/*
=========================================================
Selector de programas
selector-programas.js

Gestiona el listado de programas disponibles y recuerda
el ultimo programa consultado.
=========================================================
*/

"use strict";

const RUTA_MENU_PROGRAMAS = "data/menu_programas.json";
const RUTA_PROGRAMA_RESPALDO = "data/programa.json";
const ID_PROGRAMA_RESPALDO = "iglesuela-2026";
const CLAVE_PROGRAMA_SELECCIONADO = "programaSeleccionado";

let menuProgramas = null;
let programaSeleccionadoInfo = null;
let menuProgramasDisponible = false;

/*=========================================================
PREPARAR SELECTOR
=========================================================*/

async function prepararSelectorProgramas() {

    try {

        const respuesta = await fetch(RUTA_MENU_PROGRAMAS);

        if (!respuesta.ok) {
            throw new Error(`No se ha encontrado ${RUTA_MENU_PROGRAMAS}`);
        }

        const datos = await respuesta.json();

        validarMenuProgramas(datos);

        menuProgramas = datos;
        menuProgramasDisponible = true;

    }
    catch (error) {

        console.warn(
            "No se ha podido cargar el menu de programas. Se utilizara el programa predeterminado.",
            error
        );

        menuProgramas = crearMenuProgramasRespaldo();
        menuProgramasDisponible = false;

    }

    programaSeleccionadoInfo = resolverProgramaSeleccionado();

    // Un fallo temporal de menu_programas.json no debe borrar
    // el ultimo programa que el usuario tenia guardado.
    if (menuProgramasDisponible) {
        guardarProgramaSeleccionado(programaSeleccionadoInfo.id);
    }

    return programaSeleccionadoInfo;

}

/*=========================================================
VALIDAR MENU DE PROGRAMAS
=========================================================*/

function validarMenuProgramas(datos) {

    if (!datos || !Array.isArray(datos.programas)) {
        throw new Error("menu_programas.json debe contener un array 'programas'");
    }

    if (datos.programas.length === 0) {
        throw new Error("menu_programas.json no contiene programas");
    }

    const ids = new Set();

    datos.programas.forEach(programaMenu => {

        if (!programaMenu.id || !programaMenu.nombre || !programaMenu.archivo) {
            throw new Error("Cada programa debe tener 'id', 'nombre' y 'archivo'");
        }

        if (ids.has(programaMenu.id)) {
            throw new Error(`El id '${programaMenu.id}' esta duplicado en menu_programas.json`);
        }

        ids.add(programaMenu.id);

    });

}

/*=========================================================
PROGRAMA DE RESPALDO
=========================================================*/

function crearMenuProgramasRespaldo() {

    return {
        programaPredeterminado: ID_PROGRAMA_RESPALDO,
        programas: [
            {
                id: ID_PROGRAMA_RESPALDO,
                nombre: "Iglesuela del Cid",
                anio: 2026,
                archivo: RUTA_PROGRAMA_RESPALDO,
                icono: "img/icon-iglesuela.png",
                activo: true
            }
        ]
    };

}

/*=========================================================
RESOLVER PROGRAMA SELECCIONADO
Prioridad:
1. Parametro ?programa= de la URL
2. Ultimo programa guardado
3. Programa predeterminado
4. Primer programa activo
=========================================================*/

function resolverProgramaSeleccionado() {

    const programasActivos = obtenerProgramasActivos();

    if (programasActivos.length === 0) {
        return crearMenuProgramasRespaldo().programas[0];
    }

    const parametros = new URLSearchParams(window.location.search);
    const idUrl = parametros.get("programa");
    const idGuardado = obtenerProgramaGuardado();
    const idPredeterminado = menuProgramas.programaPredeterminado;

    const candidatos = [
        idUrl,
        idGuardado,
        idPredeterminado
    ];

    for (const id of candidatos) {

        if (!id) continue;

        const encontrado = programasActivos.find(
            programaMenu => programaMenu.id === id
        );

        if (encontrado) {
            return encontrado;
        }

    }

    return programasActivos[0];

}

/*=========================================================
PROGRAMAS ACTIVOS
=========================================================*/

function obtenerProgramasActivos() {

    if (!menuProgramas || !Array.isArray(menuProgramas.programas)) {
        return [];
    }

    return menuProgramas.programas.filter(
        programaMenu => programaMenu.activo !== false
    );

}

/*=========================================================
LOCALSTORAGE
=========================================================*/

function obtenerProgramaGuardado() {

    try {
        return localStorage.getItem(CLAVE_PROGRAMA_SELECCIONADO);
    }
    catch (error) {
        console.warn("No se ha podido leer el programa guardado.", error);
        return null;
    }

}

function guardarProgramaSeleccionado(id) {

    try {
        localStorage.setItem(CLAVE_PROGRAMA_SELECCIONADO, id);
    }
    catch (error) {
        console.warn("No se ha podido guardar el programa seleccionado.", error);
    }

}

/*=========================================================
CREAR SELECTOR VISUAL
=========================================================*/

function crearSelectorProgramas() {

    const contenedor = document.getElementById("selectorProgramas");

    if (!contenedor || !programaSeleccionadoInfo) return;

    const programasActivos = obtenerProgramasActivos();

    vaciar(contenedor);

    if (programasActivos.length <= 1) {
        contenedor.classList.add("oculto");
        return;
    }

    contenedor.classList.remove("oculto");

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "selector-programas-boton";
    boton.setAttribute("aria-haspopup", "listbox");
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-label", "Seleccionar programa de fiestas");

    insertarDatosPrograma(boton, programaSeleccionadoInfo, true);

    const lista = document.createElement("div");
    lista.className = "selector-programas-lista";
    lista.setAttribute("role", "listbox");
    lista.setAttribute("aria-label", "Programas de fiestas disponibles");
    lista.hidden = true;

    programasActivos.forEach(programaMenu => {

        const opcion = document.createElement("button");
        opcion.type = "button";
        opcion.className = "selector-programas-opcion";
        opcion.setAttribute("role", "option");

        const seleccionado = programaMenu.id === programaSeleccionadoInfo.id;

        opcion.setAttribute("aria-selected", seleccionado ? "true" : "false");

        if (seleccionado) {
            opcion.classList.add("activo");
        }

        insertarDatosPrograma(opcion, programaMenu, false);

        opcion.addEventListener("click", () => {

            if (seleccionado) {
                establecerEstadoSelector(false, contenedor, boton, lista);
                boton.focus();
                return;
            }

            seleccionarPrograma(programaMenu.id);

        });

        lista.appendChild(opcion);

    });

    boton.addEventListener("click", event => {

        event.stopPropagation();

        const abierto = boton.getAttribute("aria-expanded") === "true";

        establecerEstadoSelector(!abierto, contenedor, boton, lista);

    });

    lista.addEventListener("click", event => {
        event.stopPropagation();
    });

    document.addEventListener("click", () => {
        establecerEstadoSelector(false, contenedor, boton, lista);
    });

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            establecerEstadoSelector(false, contenedor, boton, lista);
            boton.focus();
        }

    });

    contenedor.appendChild(boton);
    contenedor.appendChild(lista);

}

/*=========================================================
CONTENIDO DE CADA PROGRAMA
=========================================================*/

function insertarDatosPrograma(elemento, programaMenu, mostrarFlecha) {

    const icono = document.createElement("img");
    icono.className = "selector-programas-icono";
    icono.src = programaMenu.icono || "img/icon-192.png";
    icono.alt = "";
    icono.setAttribute("aria-hidden", "true");

    const texto = document.createElement("span");
    texto.className = "selector-programas-texto";

    const nombre = document.createElement("span");
    nombre.className = "selector-programas-nombre";
    nombre.textContent = programaMenu.nombre;

    texto.appendChild(nombre);

    if (programaMenu.anio) {

        const anio = document.createElement("span");
        anio.className = "selector-programas-anio";
        anio.textContent = programaMenu.anio;

        texto.appendChild(anio);

    }

    elemento.appendChild(icono);
    elemento.appendChild(texto);

    if (mostrarFlecha) {

        const flecha = document.createElement("span");
        flecha.className = "selector-programas-flecha";
        flecha.textContent = "▾";
        flecha.setAttribute("aria-hidden", "true");

        elemento.appendChild(flecha);

    }

}

/*=========================================================
ABRIR / CERRAR SELECTOR
=========================================================*/

function establecerEstadoSelector(abierto, contenedor, boton, lista) {

    boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    lista.hidden = !abierto;
    contenedor.classList.toggle("abierto", abierto);

}

/*=========================================================
CAMBIAR DE PROGRAMA
=========================================================*/

function seleccionarPrograma(id) {

    const programasActivos = obtenerProgramasActivos();

    const nuevoPrograma = programasActivos.find(
        programaMenu => programaMenu.id === id
    );

    if (!nuevoPrograma) return;

    if (
        programaSeleccionadoInfo &&
        nuevoPrograma.id === programaSeleccionadoInfo.id
    ) {
        return;
    }

    guardarProgramaSeleccionado(nuevoPrograma.id);

    const url = new URL(window.location.href);
    url.searchParams.set("programa", nuevoPrograma.id);

    window.location.assign(url.toString());

}

/*=========================================================
INFORMACION DEL PROGRAMA ACTIVO
=========================================================*/

function obtenerIdProgramaSeleccionado() {

    return programaSeleccionadoInfo
        ? programaSeleccionadoInfo.id
        : null;

}

function obtenerProgramaSeleccionadoInfo() {

    return programaSeleccionadoInfo;

}
