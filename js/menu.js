/*
=========================================================
Fiestas Villafranca
menu.js

Construcción del menú lateral
=========================================================
*/

"use strict";

/*
=========================================================
CREAR MENÚ
=========================================================
*/

function crearMenu() {

    const menu = document.getElementById("menu");

    vaciar(menu);

	programa.dias.forEach((dia, indice) => {

        const boton = crearElemento("button", "menu-dia");

        boton.dataset.indice = indice;

        const totalActos = dia.actos.length;

boton.innerHTML = `
    <div class="menu-dia-info">

        <span class="menu-dia-texto">
            ${window.innerWidth < 768
                ? tituloCortoDia(dia.titulo)
                : dia.titulo}
        </span>

        <span class="menu-dia-actos">
            ${totalActos === 0
                ? "Sin eventos"
                : totalActos + (totalActos === 1 ? " evento" : " eventos")}
        </span>

    </div>
`;

        boton.addEventListener("click", () => {

    viendoFavoritos = false;

    actualizarBotonFavoritos();

    mostrarDia(indice);

});

        menu.appendChild(boton);

	});

}

/*
=========================================================
ACTUALIZAR MENÚ
=========================================================
*/

function actualizarMenu(indiceSeleccionado) {

    const botones = document.querySelectorAll(".menu-dia");

    botones.forEach((boton, indice) => {

        if (indice === indiceSeleccionado) {

            boton.classList.add("activo");

        } else {

            boton.classList.remove("activo");

        }

    });

    const botonActivo = botones[indiceSeleccionado];
    const menu = document.getElementById("menu");

    if (botonActivo && menu) {

        /*
        Desplazar solo el contenedor del menu.
        scrollIntoView() puede mover tambien la pagina completa y ocultar
        la barra global de seleccion de programa al iniciar la aplicacion.
        */

        const rectMenu = menu.getBoundingClientRect();
        const rectBoton = botonActivo.getBoundingClientRect();

        if (window.innerWidth < 768) {

            const desplazamientoHorizontal =
                rectBoton.left - rectMenu.left -
                ((menu.clientWidth - rectBoton.width) / 2);

            menu.scrollTo({
                left: menu.scrollLeft + desplazamientoHorizontal,
                behavior: "smooth"
            });

        }
        else {

            const desplazamientoVertical =
                rectBoton.top - rectMenu.top -
                ((menu.clientHeight - rectBoton.height) / 2);

            menu.scrollTo({
                top: menu.scrollTop + desplazamientoVertical,
                behavior: "smooth"
            });

        }

    }

}

function tituloCortoDia(titulo){

    return titulo
        .replace("Lunes","Lun")
        .replace("Martes","Mar")
        .replace("Miércoles","Mié")
        .replace("Jueves","Jue")
        .replace("Viernes","Vie")
        .replace("Sábado","Sáb")
        .replace("Domingo","Dom")
        .replace(" de Agosto"," Ago")
        .replace(" de Septiembre"," Sep");

}