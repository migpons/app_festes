"use strict";

function mostrarDia(indice) {
    const contenido = document.getElementById("contenido");
    vaciar(contenido);
    const dia = obtenerDia(indice);
    diaSeleccionado = dia ? indice : -1;
    actualizarMenu(diaSeleccionado);
    if (!dia) {
        contenido.appendChild(crearElemento("h2", "titulo-dia", "Programa de fiestas"));
        contenido.appendChild(crearElemento("div", "sin-actos", "No hay días publicados en este programa."));
        return;
    }
    contenido.appendChild(crearElemento("h2", "titulo-dia", dia.titulo));
    if (dia.descripcion) contenido.appendChild(crearElemento("p", "descripcion-dia", dia.descripcion));
    if (!dia.actos.length) contenido.appendChild(crearElemento("div", "sin-actos", "No hay actos programados para este día."));
    dia.actos.forEach(acto => contenido.appendChild(crearTarjeta(acto, dia)));
}

function crearTarjeta(acto, dia) {
    const tarjeta = crearElemento("article", "tarjeta");
    const clave = `${dia ? dia.fecha : acto.fecha}_${acto.id}`;
    tarjeta.dataset.clave = clave;
    if (acto.destacado) tarjeta.classList.add("destacado");
    const categoria = obtenerCategoria(acto.categoria) || {nombre: "Otros", icono: "📌", color: "#607D8B"};
    const cabecera = crearElemento("div", "tarjeta-cabecera");
    const izquierda = crearElemento("div", "cabecera-izquierda");
    const categoriaNodo = crearElemento("span", "categoria", `${categoria.icono || "📌"} ${categoria.nombre}`);
    categoriaNodo.style.backgroundColor = categoria.color;
    izquierda.appendChild(categoriaNodo);
    if (acto.destacado) {
        const estrella = crearElemento("span", "icono-destacado", "⭐");
        estrella.title = "Acto destacado";
        estrella.setAttribute("aria-label", "Acto destacado");
        izquierda.appendChild(estrella);
    }
    const derecha = crearElemento("div", "cabecera-derecha");
    derecha.appendChild(crearElemento("span", "hora", `${acto.hora || "Hora por confirmar"}${acto.horaFin ? " - " + acto.horaFin : ""}`));
    const boton = crearElemento("button", "boton-favorito");
    boton.type = "button";
    boton.dataset.id = acto.id;
    const actualizarCorazon = () => {
        const favorito = esFavorito(clave);
        const etiqueta = favorito ? "Quitar de favoritos" : "Añadir a favoritos";
        boton.textContent = favorito ? "❤️" : "🤍";
        boton.title = etiqueta;
        boton.setAttribute("aria-label", `${etiqueta}: ${acto.titulo}`);
        boton.setAttribute("aria-pressed", String(favorito));
    };
    actualizarCorazon();
    boton.onclick = () => {
        const contenido = document.getElementById("contenido");
        const indice = [...contenido.querySelectorAll(".boton-favorito")].indexOf(boton);
        const scroll = window.scrollY;
        cambiarFavorito(clave);
        if (viendoFavoritos) {
            if (document.getElementById("buscador").value.trim()) mostrarResultadosBusqueda();
            else mostrarFavoritos();
            const botones = contenido.querySelectorAll(".boton-favorito");
            const siguiente = botones[Math.min(indice, botones.length - 1)] || document.getElementById("botonFavoritos");
            siguiente.focus({preventScroll: true});
            window.scrollTo({top: scroll, behavior: "instant"});
        } else actualizarCorazon();
    };
    derecha.appendChild(boton);
    cabecera.append(izquierda, derecha);
    tarjeta.appendChild(cabecera);
    const rutaImagen = urlSegura(acto.imagen, true);
    if (rutaImagen) {
        const imagen = crearElemento("img", "imagen-acto");
        imagen.src = rutaImagen;
        imagen.alt = acto.titulo;
        imagen.loading = "lazy";
        imagen.decoding = "async";
        tarjeta.appendChild(imagen);
    }
    tarjeta.appendChild(crearElemento("h3", "", acto.titulo));
    if (acto.descripcion) tarjeta.appendChild(crearElemento("p", "", acto.descripcion));
    const datos = crearElemento("div", "datos");
    if (acto.ubicacion) {
        const ubicacion = crearElemento("div", "ubicacion");
        const maps = urlSegura(acto.maps);
        if (maps) {
            const enlace = crearElemento("a", "", "📍 " + acto.ubicacion);
            enlace.href = maps;
            enlace.target = "_blank";
            enlace.rel = "noopener noreferrer";
            ubicacion.appendChild(enlace);
        } else ubicacion.textContent = "📍 " + acto.ubicacion;
        datos.appendChild(ubicacion);
    }
    if (acto.organiza) datos.appendChild(crearElemento("div", "", "👥 " + acto.organiza));
    if (acto.precio) datos.appendChild(crearElemento("div", "", "💶 " + acto.precio));
    if (datos.childElementCount) tarjeta.appendChild(datos);
    if (acto.observaciones) tarjeta.appendChild(crearElemento("p", "observaciones", "ℹ️ " + acto.observaciones));
    if (Array.isArray(acto.etiquetas) && acto.etiquetas.length) {
        const etiquetas = crearElemento("div", "etiquetas");
        acto.etiquetas.forEach(texto => etiquetas.appendChild(crearElemento("span", "etiqueta", texto)));
        tarjeta.appendChild(etiquetas);
    }
    return tarjeta;
}
