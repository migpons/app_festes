/*
=========================================================
Fiestas Villafranca
programa.js

Carga y validación del programa
=========================================================
*/

"use strict";

/*
=========================================================
CARGAR PROGRAMA
=========================================================
*/

async function cargarPrograma() {

    const respuesta = await fetch("data/programa.json");

    if (!respuesta.ok) {
        throw new Error("No se ha encontrado data/programa.json");
    }

    programa = await respuesta.json();

    validarPrograma();

}

/*
=========================================================
VALIDAR JSON
=========================================================
*/

function validarPrograma() {

    if (!programa.config) {
        throw new Error("Falta el bloque 'config'");
    }

    if (!programa.tema) {
        throw new Error("Falta el bloque 'tema'");
    }

    if (!programa.categorias) {
        throw new Error("Falta el bloque 'categorias'");
    }

    if (!programa.dias) {
        throw new Error("Falta el bloque 'dias'");
    }

    if (!Array.isArray(programa.dias)) {
        throw new Error("'dias' debe ser un array");
    }

}

/*
=========================================================
OBTENER DÍA
=========================================================
*/

function obtenerDia(indice) {

    return programa.dias[indice];

}

/*
=========================================================
OBTENER TODOS LOS DÍAS
=========================================================
*/

function obtenerDias() {

    return programa.dias;

}

/*
=========================================================
OBTENER CATEGORÍA
=========================================================
*/

function obtenerCategoria(id) {

    return programa.categorias.find(c => c.id === id);

}

/*
=========================================================
OBTENER ACTOS DEL DÍA
=========================================================
*/

function obtenerActos(indice) {

    return programa.dias[indice].actos;

}

/*
=========================================================
OBTENER CONFIGURACIÓN
=========================================================
*/

function obtenerConfig() {

    return programa.config;

}

/*
=========================================================
OBTENER TEMA
=========================================================
*/

function obtenerTema() {

    return programa.tema;

}