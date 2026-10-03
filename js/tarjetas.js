/*
=========================================================
Fiestas Villafranca
tarjetas.js

Mostrar los actos de un día
=========================================================
*/

"use strict";

/*
=========================================================
MOSTRAR DÍA
=========================================================
*/

function mostrarDia(indice) {

    diaSeleccionado = indice;

    actualizarMenu(indice);

    const dia = obtenerDia(indice);

    const contenido = document.getElementById("contenido");

    vaciar(contenido);

    // Título

    const titulo = crearElemento(
        "h2",
        "titulo-dia",
        dia.titulo
    );

    contenido.appendChild(titulo);

    // Descripción

    if (dia.descripcion && dia.descripcion !== "") {

        const descripcion = crearElemento(
            "p",
            "descripcion-dia",
            dia.descripcion
        );

        contenido.appendChild(descripcion);

    }

    // Sin actos

    if (dia.actos.length === 0) {

        const aviso = crearElemento(
            "div",
            "sin-actos",
            "No hay actos programados para este día."
        );

        contenido.appendChild(aviso);

        return;

    }

    ordenarActos(dia.actos);

    dia.actos.forEach(acto => {

        contenido.appendChild(
            crearTarjeta(acto, dia)
        );

    });

}

/*
=========================================================
CREAR TARJETA
=========================================================
*/

function crearTarjeta(acto, dia) {

    const tarjeta = crearElemento(
        "article",
        "tarjeta"
    );

    const fechaActo =
    dia
        ? dia.fecha
        : acto.fecha;

const claveFavorito =
    fechaActo + "_" + acto.id;

    if (acto.destacado) {

        tarjeta.classList.add("destacado");

    }

    const categoria =
        obtenerCategoria(acto.categoria);

    const imagen =
        acto.imagen && acto.imagen.trim() !== ""

        ? `

            <img
                class="imagen-acto"
                src="${acto.imagen}"
                alt="${acto.titulo}">

        `

        : "";

    const ubicacion =
        acto.maps && acto.maps.trim() !== ""

        ? `

            <a
                href="${acto.maps}"
                target="_blank"
                rel="noopener noreferrer">

                📍 ${acto.ubicacion}

            </a>

        `

        : `📍 ${acto.ubicacion}`;

    const precio =
        acto.precio

        ? `<div>💶 ${acto.precio}</div>`

        : "";

    const observaciones =
        acto.observaciones

        ? `<p class="observaciones">ℹ️ ${acto.observaciones}</p>`

        : "";

    const etiquetas =
        acto.etiquetas &&
        acto.etiquetas.length

        ? `

            <div class="etiquetas">

                ${acto.etiquetas.map(e =>

                    `<span class="etiqueta">${e}</span>`

                ).join("")}

            </div>

        `

        : "";

    tarjeta.innerHTML = `
        <div class="tarjeta-cabecera">

            <div class="cabecera-izquierda">

                <span
                    class="categoria"
                    style="background:${categoria.color};">

                    ${categoria.icono}
                    ${categoria.nombre}

                </span>

                ${
                    acto.destacado
                    ? '<span class="icono-destacado" title="Acto destacado">⭐</span>'
                    : ""
                }

            </div>

            <div class="cabecera-derecha">

                <span class="hora">

                    ${acto.hora}

                    ${acto.horaFin
                        ? " - " + acto.horaFin
                        : ""}

                </span>

                <button
                    class="boton-favorito"
                    data-id="${acto.id}"
                    title="${
                        esFavorito(claveFavorito)
                        ? "Quitar de favoritos"
                        : "Añadir a favoritos"
                    }">

                    ${
                        esFavorito(claveFavorito)
                        ? "❤️"
                        : "🤍"
                    }

                </button>

            </div>

        </div>

        ${imagen}

        <h3>${acto.titulo}</h3>

        <p>${acto.descripcion}</p>

        <div class="datos">

            <div>${ubicacion}</div>

            <div>👥 ${acto.organiza}</div>

            ${precio}

        </div>

        ${observaciones}

        ${etiquetas}

    `;

    const botonFavorito =
        tarjeta.querySelector(".boton-favorito");

    botonFavorito.addEventListener("click", () => {

        cambiarFavorito(claveFavorito);

        const favorito =
            esFavorito(claveFavorito);

        botonFavorito.textContent =
            favorito
                ? "❤️"
                : "🤍";

        botonFavorito.title =
            favorito
                ? "Quitar de favoritos"
                : "Añadir a favoritos";

    });

    return tarjeta;

}