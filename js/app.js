/*
=========================================================
Fiestas Villafranca
app.js

Inicialización de la aplicación
=========================================================
*/

"use strict";

/*=========================================================
POSICION INICIAL DE LA PAGINA
=========================================================*/

// Evita que el navegador restaure una posicion de scroll anterior
// al recargar o cambiar de programa.
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

/*=========================================================
VARIABLES GLOBALES
=========================================================*/

let programa = null;
let diaSeleccionado = 0;
let viendoFavoritos = false;

/*=========================================================
INICIAR APLICACIÓN
=========================================================*/

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

/*=========================================================
FUNCIÓN PRINCIPAL
=========================================================*/

async function iniciarAplicacion() {

    // La barra global de seleccion debe ser visible al entrar.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    try {

        // Resolver el programa que se debe mostrar
        const programaActivo = await prepararSelectorProgramas();

        // Cargar programa
        await cargarPrograma(programaActivo.archivo);

        // Aplicar colores
        aplicarTema();

        // Logo y portada
        aplicarImagenes();

        // Cabecera
        cargarCabecera();

        // Selector de programas
        crearSelectorProgramas();

        // Crear menú
        crearMenu();

        // Mostrar el día correspondiente a la fecha actual
	mostrarDia(obtenerIndiceDiaActual());

        // Mostrar próximo acto
        mostrarProximoActo();
	
	// Activar Buscador
	activarBuscador();

	// Botón favoritos
	activarBotonFavoritos();

	// Actualizar contador
	actualizarBotonFavoritos();

        // Algunos navegadores moviles intentan restaurar el scroll despues
        // de terminar de construir el contenido. Reafirmamos el inicio una
        // vez que la interfaz ya esta lista.
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });

    }

    catch (error) {

        console.error(error);

        mostrarError(error);

    }

}

/*=========================================================
PRÓXIMO ACTO
=========================================================*/

function mostrarProximoActo() {

    const contenedor = document.getElementById("contadorActo");

    if (!contenedor || !programa) return;

    const ahora = new Date();

	let fechaBusqueda = new Date();

	const horaActual = ahora.toTimeString().substring(0,5);

	const horaActualOrden = obtenerHoraOrdenacion(horaActual);

	if(perteneceNocheAnterior(horaActual)){

   	 fechaBusqueda.setDate(fechaBusqueda.getDate()-1);

	}

	const hoyTexto = fechaBusqueda
    	.toISOString()
   	 .substring(0,10);

    let siguiente = null;

    for (const dia of programa.dias) {

        for (const acto of dia.actos) {

            const horaOrden = obtenerHoraOrdenacion(acto.hora);

            // Día actual
            if (dia.fecha === hoyTexto) {

                if (horaOrden >= horaActualOrden) {

                    siguiente = {
                        fecha: dia.fecha,
                        titulo: acto.titulo,
                        hora: acto.hora,
                        ubicacion: acto.ubicacion
                    };

                    break;

                }

            }

            // Días posteriores
            else if (dia.fecha > hoyTexto) {

                siguiente = {
                    fecha: dia.fecha,
                    titulo: acto.titulo,
                    hora: acto.hora,
                    ubicacion: acto.ubicacion
                };

                break;

            }

        }

        if (siguiente) break;

    }

    if (!siguiente) {

        contenedor.innerHTML = `
            🎉 <strong>Las fiestas han finalizado.</strong>
        `;

        return;

    }

    let textoFecha = "";

    const manana = new Date(ahora);
    manana.setDate(manana.getDate()+1);

    const mananaTexto = manana.toISOString().substring(0,10);

    if (siguiente.fecha === hoyTexto) {

        textoFecha = "Hoy";

    }
    else if (siguiente.fecha === mananaTexto) {

        textoFecha = "Mañana";

    }
    else{

        textoFecha = new Date(siguiente.fecha).toLocaleDateString(
            "es-ES",
            {
                weekday:"long",
                day:"numeric",
                month:"long"
            }
        );

    }

    contenedor.innerHTML = `
        🕒 <strong>Próximo acto</strong><br>
        ${textoFecha} · <strong>${siguiente.hora}</strong><br>
        ${siguiente.titulo}
    `;

}

/*=========================================================
OBTENER DÍA ACTUAL
=========================================================*/

function obtenerIndiceDiaActual() {

    const hoy = new Date();

    const hoyTexto =
        hoy.getFullYear() + "-" +
        String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
        String(hoy.getDate()).padStart(2, "0");


    // Buscar el día de hoy solamente si tiene actos
    const indiceHoy = programa.dias.findIndex(dia =>
        dia.fecha === hoyTexto &&
        Array.isArray(dia.actos) &&
        dia.actos.length > 0
    );

    if (indiceHoy >= 0) {

        return indiceHoy;

    }


    // Si todavía no han empezado las fiestas,
    // buscar el primer día que tenga actos
    if (hoyTexto < programa.config.fechaInicio) {

        const primerDiaConActos = programa.dias.findIndex(dia =>
            Array.isArray(dia.actos) &&
            dia.actos.length > 0
        );

        return primerDiaConActos >= 0 ? primerDiaConActos : 0;

    }


    // Buscar el siguiente día posterior a hoy
    // que tenga al menos un acto
    const indiceSiguiente = programa.dias.findIndex(dia =>
        dia.fecha > hoyTexto &&
        Array.isArray(dia.actos) &&
        dia.actos.length > 0
    );

    if (indiceSiguiente >= 0) {

        return indiceSiguiente;

    }


    // Si ya no queda ningún día posterior con actos,
    // buscar el último día que tenga actos
    for (let i = programa.dias.length - 1; i >= 0; i--) {

        if (
            Array.isArray(programa.dias[i].actos) &&
            programa.dias[i].actos.length > 0
        ) {

            return i;

        }

    }


    // Seguridad: si no hay ningún acto en todo el programa
    return 0;

}

/*=========================================================
MOSTRAR ERROR
=========================================================*/

function mostrarError(error) {

    const contenido = document.getElementById("contenido");

    contenido.innerHTML = `
        <div class="error">
            <h2>Error</h2>
            <p>${error.message}</p>
        </div>
    `;

}

function activarBuscador(){

    const buscador =
        document.getElementById("buscador");

    if(!buscador) return;

    buscador.addEventListener("input",()=>{

        const texto =
            buscador.value.trim().toLowerCase();

        /*
        ================================================
        SI NO HAY TEXTO
        ================================================
        */

        if(texto === ""){

            if(viendoFavoritos){

                mostrarFavoritos();

            }else{

                mostrarDia(diaSeleccionado);

            }

            return;

        }

        /*
        ================================================
        BUSCAR EN TODO EL PROGRAMA
        ================================================
        */

        const contenido =
            document.getElementById("contenido");

        vaciar(contenido);

        const titulo =
            crearElemento(
                "h2",
                "titulo-dia",
                "🔎 Resultados de búsqueda"
            );

        contenido.appendChild(titulo);

        let encontrados = 0;

        programa.dias.forEach(dia => {

            /*
            ============================================
            BUSCAR ACTOS DEL DÍA
            ============================================
            */

            const actosEncontrados =
                dia.actos.filter(acto => {

                    const categoria =
                        obtenerCategoria(acto.categoria);

                    const contenidoActo = [

                        acto.titulo,
                        acto.descripcion,
                        acto.ubicacion,
                        acto.organiza,
                        acto.precio,
                        acto.observaciones,
                        categoria
                            ? categoria.nombre
                            : "",
                        ...(acto.etiquetas || [])

                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                    return contenidoActo.includes(texto);

                });

            /*
            ============================================
            SI NO HAY RESULTADOS EN ESTE DÍA
            ============================================
            */

            if(actosEncontrados.length === 0){

                return;

            }

            /*
            ============================================
            TÍTULO DEL DÍA
            ============================================
            */

            const tituloDia =
                crearElemento(
                    "h3",
                    "titulo-dia",
                    dia.titulo
                );

            contenido.appendChild(tituloDia);

            /*
            ============================================
            ORDENAR LOS RESULTADOS
            ============================================
            */

            const actosOrdenados =
                [...actosEncontrados];

            ordenarActos(actosOrdenados);

            /*
            ============================================
            MOSTRAR RESULTADOS
            ============================================
            */

            actosOrdenados.forEach(acto => {

                contenido.appendChild(

                    crearTarjeta(acto, dia)

                );

                encontrados++;

            });

        });

        /*
        ================================================
        SIN RESULTADOS
        ================================================
        */

        if(encontrados === 0){

            contenido.appendChild(

                crearElemento(
                    "div",
                    "sin-actos",
                    "No se han encontrado actos para esa búsqueda."
                )

            );

        }

    });

}