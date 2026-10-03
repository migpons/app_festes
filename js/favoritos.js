/*
=========================================================
Fiestas Villafranca
favoritos.js
=========================================================
*/

"use strict";

/*=========================================================
OBTENER FAVORITOS
=========================================================*/

function obtenerClaveFavoritos(){

    const idPrograma =
        typeof obtenerIdProgramaSeleccionado === "function"
            ? obtenerIdProgramaSeleccionado()
            : null;

    return idPrograma
        ? `favoritos_${idPrograma}`
        : "favoritos";

}

function migrarFavoritosAnteriores(claveActual){

    if (claveActual === "favoritos") return;

    const programaActivo =
        typeof obtenerProgramaSeleccionadoInfo === "function"
            ? obtenerProgramaSeleccionadoInfo()
            : null;

    if (
        !programaActivo ||
        programaActivo.archivo !== "data/programa.json"
    ) {
        return;
    }

    if (localStorage.getItem(claveActual) !== null) return;

    const favoritosAnteriores =
        localStorage.getItem("favoritos");

    if (favoritosAnteriores !== null) {
        localStorage.setItem(claveActual, favoritosAnteriores);
    }

}

function obtenerFavoritos(){

    const clave = obtenerClaveFavoritos();

    migrarFavoritosAnteriores(clave);

    return JSON.parse(
        localStorage.getItem(clave) || "[]"
    );

}

/*=========================================================
GUARDAR FAVORITOS
=========================================================*/

function guardarFavoritos(lista){

    localStorage.setItem(
        obtenerClaveFavoritos(),
        JSON.stringify(lista)
    );

}

/*=========================================================
¿ES FAVORITO?
=========================================================*/

function esFavorito(clave){

    return obtenerFavoritos().includes(clave);

}

/*=========================================================
CAMBIAR FAVORITO
=========================================================*/

function cambiarFavorito(clave){

    let favoritos = obtenerFavoritos();

    if(favoritos.includes(clave)){

        favoritos = favoritos.filter(x => x !== clave);

    }else{

        favoritos.push(clave);

    }

    	guardarFavoritos(favoritos);
	actualizarBotonFavoritos();

    }

/*=========================================================
MOSTRAR FAVORITOS
=========================================================*/

function mostrarFavoritos(){

    const contenido =
        document.getElementById("contenido");

    vaciar(contenido);

    const titulo = crearElemento(
        "h2",
        "titulo-dia",
        "❤️ Mis favoritos"
    );

    contenido.appendChild(titulo);

    const favoritos =
        obtenerFavoritos();

    if(favoritos.length===0){

        contenido.appendChild(

            crearElemento(
                "div",
                "sin-actos",
                "Todavía no has añadido ningún favorito."
            )

        );

        return;

    }

    let encontrados = 0;

    programa.dias.forEach(dia=>{

        dia.actos.forEach(acto=>{

            const clave =
                dia.fecha + "_" + acto.id;

            if(favoritos.includes(clave)){

                contenido.appendChild(

                    crearTarjeta(acto,dia)

                );

                encontrados++;

            }

        });

    });

    if(encontrados===0){

        contenido.appendChild(

            crearElemento(
                "div",
                "sin-actos",
                "No se han encontrado favoritos."
            )

        );

    }

}

/*=========================================================
ACTIVAR BOTÓN FAVORITOS
=========================================================*/

function activarBotonFavoritos(){

    const boton =
        document.getElementById("botonFavoritos");

    if(!boton) return;

    boton.addEventListener("click",()=>{

        if(!viendoFavoritos){

            mostrarFavoritos();

            viendoFavoritos = true;

	actualizarBotonFavoritos();

        }
        else{

            mostrarDia(diaSeleccionado);

            viendoFavoritos = false;

	actualizarBotonFavoritos();

        }

    });

}

/*=========================================================
ACTUALIZAR BOTÓN FAVORITOS
=========================================================*/

function actualizarBotonFavoritos(){

    const boton =
        document.getElementById("botonFavoritos");

    if(!boton) return;

    if(viendoFavoritos){

        boton.textContent =
            "← Volver al programa";

        return;

    }

    const total =
        obtenerFavoritos().length;

    boton.textContent =

        total===0

        ? "❤️ Mis favoritos"

        : `❤️ Mis favoritos (${total})`;

}

