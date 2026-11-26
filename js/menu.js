"use strict";

function crearMenu() {
    const menu = document.getElementById("menu");
    vaciar(menu);
    programa.dias.forEach((dia, indice) => {
        const boton = crearElemento("button", "menu-dia");
        boton.type = "button";
        boton.dataset.indice = indice;
        boton.title = dia.titulo;
        const info = crearElemento("span", "menu-dia-info");
        const texto = crearElemento("span", "menu-dia-texto", window.innerWidth < 768 ? tituloCortoDia(dia.titulo) : dia.titulo);
        texto.dataset.titulo = dia.titulo;
        info.appendChild(texto);
        const total = dia.actos.length;
        info.appendChild(crearElemento("span", "menu-dia-actos", total ? `${total} ${total === 1 ? "evento" : "eventos"}` : "Sin eventos"));
        boton.appendChild(info);
        boton.onclick = () => {
            seguirDiaActual = false;
            viendoFavoritos = false;
            limpiarBusqueda();
            actualizarBotonFavoritos();
            mostrarDia(indice);
        };
        menu.appendChild(boton);
    });
    if (typeof ResizeObserver !== "undefined" && !observadorMenu) {
        observadorMenu = new ResizeObserver(() => ajustarMenuAlTamano());
        observadorMenu.observe(menu);
    }
}

function actualizarMenu(indiceSeleccionado) {
    const botones = document.querySelectorAll(".menu-dia");
    botones.forEach((boton, indice) => {
        boton.classList.toggle("activo", indice === indiceSeleccionado);
        if (indice === indiceSeleccionado) boton.setAttribute("aria-current", "date");
        else boton.removeAttribute("aria-current");
    });
    const activo = botones[indiceSeleccionado];
    const menu = document.getElementById("menu");
    if (!activo || !menu) return;
    const rectMenu = menu.getBoundingClientRect();
    const rectBoton = activo.getBoundingClientRect();
    if (window.innerWidth < 768) {
        menu.scrollTo({left: menu.scrollLeft + rectBoton.left - rectMenu.left - ((menu.clientWidth - rectBoton.width) / 2), behavior: "instant"});
    } else {
        menu.scrollTo({top: menu.scrollTop + rectBoton.top - rectMenu.top - ((menu.clientHeight - rectBoton.height) / 2), behavior: "instant"});
    }
}

function tituloCortoDia(titulo) {
    return titulo.replace(/miércoles/gi, "Mié").replace(/lunes/gi, "Lun").replace(/martes/gi, "Mar")
        .replace(/jueves/gi, "Jue").replace(/viernes/gi, "Vie").replace(/sábado/gi, "Sáb").replace(/domingo/gi, "Dom")
        .replace(/ de agosto/gi, " Ago").replace(/ de septiembre/gi, " Sep");
}
let observadorMenu = null;
function ajustarMenuAlTamano() {
    document.querySelectorAll(".menu-dia-texto").forEach(texto => {
        texto.textContent = window.innerWidth < 768 ? tituloCortoDia(texto.dataset.titulo) : texto.dataset.titulo;
    });
    if (programa) {
        actualizarMenu(viendoFavoritos || document.getElementById("buscador").value.trim() ? -1 : diaSeleccionado);
    }
}
window.addEventListener("resize", ajustarMenuAlTamano);
