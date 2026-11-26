"use strict";

async function cargarPrograma(ruta) {
    const respuesta = await fetch(ruta, { cache: "no-cache" });
    if (!respuesta.ok) throw new Error("No se ha podido cargar el programa seleccionado.");
    const datos = await respuesta.json();
    validarPrograma(datos);
    // Filtrar antes de construir cualquier vista, sin borrar los días del JSON.
    datos.dias = datos.dias.filter(dia => dia.activo !== false);
    datos.dias.sort((a, b) => a.fecha.localeCompare(b.fecha));
    datos.dias.forEach(dia => ordenarActos(dia.actos, datos.config));
    programa = datos;
}

function validarPrograma(datos = programa) {
    if (!datos || !datos.config || !datos.tema) throw new Error("El programa necesita los bloques config y tema.");
    const config = datos.config;
    if (!config.titulo || !config.municipio?.nombre || !config.logo?.archivo ||
        !config.logo.pc?.ancho || !config.logo.tablet?.ancho || !config.logo.movil?.ancho) {
        throw new Error("La cabecera o el logotipo del programa están incompletos.");
    }
    if (!Number.isInteger(config.anio)) throw new Error("El año del programa no es válido.");
    for (const campo of ["principal", "secundario", "fondo", "texto", "tarjeta"]) {
        if (typeof datos.tema[campo] !== "string" || !/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(datos.tema[campo])) {
            throw new Error(`El color ${campo} del tema no es válido.`);
        }
    }
    const cambio = config.horaCambioDia ?? config.municipio.horaCambioDia ?? "06:00";
    if (horaMinutos(cambio) === null) throw new Error("La hora de cambio de día no es válida.");
    if (!Array.isArray(datos.categorias) || !Array.isArray(datos.dias)) throw new Error("Las categorías y los días deben ser listas.");
    const categorias = new Set();
    for (const categoria of datos.categorias) {
        if (!categoria.id || !categoria.nombre || !/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(categoria.color) || categorias.has(categoria.id)) {
            throw new Error("Hay una categoría incompleta o duplicada.");
        }
        categorias.add(categoria.id);
    }
    const fechas = new Set();
    const idsDias = new Set();
    for (const dia of datos.dias) {
        if (dia.activo !== undefined && typeof dia.activo !== "boolean") throw new Error("El campo activo de un día debe ser true o false, sin comillas.");
        // Un día oculto puede estar todavía en preparación, con datos del
        // programa anterior. No debe impedir publicar los demás días.
        if (dia.activo === false) continue;
        if (!dia.id || !fechaValida(dia.fecha) || !dia.titulo || !Array.isArray(dia.actos) || fechas.has(dia.fecha) || idsDias.has(String(dia.id))) {
            throw new Error("Hay un día incompleto, duplicado o con una fecha incorrecta.");
        }
        if (Number(dia.fecha.slice(0, 4)) !== config.anio) throw new Error("Las fechas no coinciden con el año del programa.");
        fechas.add(dia.fecha);
        idsDias.add(String(dia.id));
        const ids = new Set();
        for (const acto of dia.actos) {
            if (acto.id === undefined || !acto.titulo || typeof acto.hora !== "string" || ids.has(String(acto.id))) throw new Error(`Hay un acto incompleto o duplicado en ${dia.fecha}.`);
            ids.add(String(acto.id));
            if (!categorias.has(acto.categoria)) throw new Error(`Categoría desconocida en el acto «${acto.titulo}».`);
            if (acto.hora.includes(":") && horaMinutos(acto.hora) === null) throw new Error(`Hora incorrecta en «${acto.titulo}».`);
            if (acto.horaFin && horaMinutos(acto.horaFin) === null) throw new Error(`Hora de fin incorrecta en «${acto.titulo}».`);
            if (acto.horaOrden !== undefined && horaMinutos(acto.horaOrden) === null) throw new Error(`Hora de orden incorrecta en «${acto.titulo}».`);
            if (acto.etiquetas !== undefined && (!Array.isArray(acto.etiquetas) || acto.etiquetas.some(e => typeof e !== "string"))) throw new Error(`Las etiquetas de «${acto.titulo}» deben ser una lista de textos.`);
        }
    }
    for (const campo of ["fechaInicio", "fechaFin"]) if (!fechaValida(config[campo])) throw new Error(`La fecha ${campo} no es válida.`);
    if (config.fechaInicio > config.fechaFin || datos.dias.some(d => d.activo !== false && (d.fecha < config.fechaInicio || d.fecha > config.fechaFin))) throw new Error("Los días no coinciden con el intervalo de fechas del programa.");
}

function obtenerDia(indice) { return programa.dias[indice]; }
function obtenerDias() { return programa.dias; }
function obtenerActos(indice) { return obtenerDia(indice)?.actos || []; }
function obtenerConfig() { return programa.config; }
function obtenerTema() { return programa.tema; }
