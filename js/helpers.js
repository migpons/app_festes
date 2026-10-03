/*
=========================================================
Fiestas Villafranca
helpers.js

Funciones auxiliares comunes
Versión 1.0
=========================================================
*/

"use strict";

/*=========================================================
SELECTORES
=========================================================*/

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

/*=========================================================
CREAR ELEMENTOS
=========================================================*/

function crearElemento(tag, clase = "", texto = "") {

    const elemento = document.createElement(tag);

    if (clase) {
        elemento.className = clase;
    }

    if (texto) {
        elemento.textContent = texto;
    }

    return elemento;

}

/*=========================================================
VACIAR CONTENEDOR
=========================================================*/

function vaciar(elemento) {

    while (elemento.firstChild) {
        elemento.removeChild(elemento.firstChild);
    }

}

/*=========================================================
FORMATEAR FECHA
Recibe: 2026-08-14
Devuelve: Viernes 14 de Agosto
=========================================================*/

function formatearFecha(fechaTexto) {

    const dias = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
    ];

    const meses = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre"
    ];

    const fecha = new Date(fechaTexto + "T12:00:00");

    return `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;

}

/*=========================================================
CONVERTIR HORA A MINUTOS
=========================================================*/

function horaMinutos(hora) {

    if (!hora) return 0;

    const partes = hora.split(":");

    return parseInt(partes[0]) * 60 + parseInt(partes[1]);

}

/*=========================================================
ORDENAR ACTOS
=========================================================*/

function ordenarActos(actos){

    return actos.sort((a,b)=>{

        return obtenerHoraOrdenacion(a.hora)
             - obtenerHoraOrdenacion(b.hora);

    });

}

/*=========================================================
APLICAR COLORES
=========================================================*/

function aplicarTema() {

    const root = document.documentElement;

    root.style.setProperty("--color-principal", programa.tema.principal);
    root.style.setProperty("--color-secundario", programa.tema.secundario);
    root.style.setProperty("--color-fondo", programa.tema.fondo);
    root.style.setProperty("--color-texto", programa.tema.texto);
    root.style.setProperty("--color-superficie", programa.tema.tarjeta);

    const themeColor =
        document.querySelector('meta[name="theme-color"]');

    if (
        themeColor &&
        programa.tema.navegador
    ) {

        themeColor.setAttribute(
            "content",
            programa.tema.navegador
        );

    }

}

/*=========================================================
CARGAR LOGO Y PORTADA
=========================================================*/

function aplicarImagenes() {

    /*=========================================================
    TÍTULO DE LA PÁGINA
    =========================================================*/

    if(programa.config.tituloPagina){

        document.title =
            programa.config.tituloPagina;

    }

        const logo = $("#logo");

        if (logo) {

        logo.src = programa.config.logo.archivo;

    /*=============================================
      TAMAÑOS DEL LOGO
    =============================================*/

    document.documentElement.style.setProperty(
        "--logo-pc",
        programa.config.logo.pc.ancho + "px"
    );

    document.documentElement.style.setProperty(
        "--logo-tablet",
        programa.config.logo.tablet.ancho + "px"
    );

    document.documentElement.style.setProperty(
        "--logo-movil",
        programa.config.logo.movil.ancho + "px"
    );

    /*=============================================
      MÁRGENES
    =============================================*/

    if (programa.config.logo.margenSuperior !== undefined) {

        logo.style.marginTop =
            programa.config.logo.margenSuperior + "px";

    }

    if (programa.config.logo.margenInferior !== undefined) {

        logo.style.marginBottom =
            programa.config.logo.margenInferior + "px";

    }

}

/*=========================================================
FAVICON
=========================================================*/

const favicon =
    document.getElementById("favicon");

if(favicon &&
   programa.config.favicon){

    favicon.href =
        programa.config.favicon;

}

/*=========================================================
FIN FAVICON
=========================================================*/
    
	const hero = $("#hero");

    if (hero) {

        hero.style.backgroundImage =
            `url("${programa.config.portada}")`;

        hero.style.backgroundSize = "cover";
        hero.style.backgroundPosition = "center";

    }

}

/*=========================================================
CARGAR CABECERA
=========================================================*/

function cargarCabecera() {

    $("#tituloWeb").textContent =
        programa.config.titulo;

    $("#subtituloWeb").textContent =
    	programa.config.municipio.nombre;

    $("#anioFiestas").textContent =
        programa.config.anio;

    $("#copyright").textContent =
        "© " + programa.config.copyright;

}

/*=========================================================
BUSCAR DÍA POR ID
=========================================================*/

function buscarDia(id) {

    return programa.dias.find(d => d.id == id);

}

/*=========================================================
BUSCAR ACTO POR ID
=========================================================*/

function buscarActo(id) {

    for (const dia of programa.dias) {

        const acto = dia.actos.find(a => a.id == id);

        if (acto) return acto;

    }

    return null;

}

/*=========================================================
OBTENER CATEGORÍA
=========================================================*/

function obtenerCategoria(id) {

    return programa.categorias.find(c => c.id === id);

}

/*=========================================================
DEVOLVER COLOR DE CATEGORÍA
=========================================================*/

function colorCategoria(id) {

    const categoria = obtenerCategoria(id);

    return categoria ? categoria.color : "#999999";

}

/*=========================================================
DEVOLVER ICONO DE CATEGORÍA
=========================================================*/

function iconoCategoria(id) {

    const categoria = obtenerCategoria(id);

    return categoria ? categoria.icono : "📌";

}

/*=========================================================
ESCAPAR HTML
=========================================================*/

function escaparHTML(texto) {

    if (!texto) return "";

    const div = document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;

}

/*=========================================================
ORDENAR HORA DE FIESTAS
Las horas comprendidas entre 00:00 y la hora de cambio
se consideran continuación de la noche anterior.
=========================================================*/

function obtenerHoraOrdenacion(hora){

    if(!hora) return 9999;

    const [h,m]=hora.split(":").map(Number);

    let minutos=h*60+m;

    const cambioDia=
        programa?.config?.horaCambioDia || "06:00";

    const [hc,mc]=cambioDia.split(":").map(Number);

    const minutosCambio=hc*60+mc;

    if(minutos<minutosCambio){

        minutos+=24*60;

    }

    return minutos;

}

/*=========================================================
¿LA HORA PERTENECE A LA NOCHE ANTERIOR?
=========================================================*/

function perteneceNocheAnterior(hora){

    const cambioDia =
        programa?.config?.horaCambioDia || "06:00";

    return obtenerHoraOrdenacion(hora) >= 24*60;

}