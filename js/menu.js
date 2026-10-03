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

    if (botonActivo) {

        botonActivo.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
        });

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