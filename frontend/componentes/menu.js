// =====================================================================
// MENÚ LATERAL (se escribe una sola vez aquí y se usa en todas las páginas)
// - Dibuja el menú dentro de <aside id="menu-lateral"></aside>
// - Abre/cierra con la hamburguesa (celular y tablet)
// - Abre y cierra los submenús (Empresas, Compras, Ventas)
// - Marca la página actual
// =====================================================================

const OPCIONES_MENU = [
    {
        titulo: "Empresas",
        enlaces: [
            { texto: "Información de empresa", href: "informacion_empresa.html" },
            { texto: "Cambiar de empresa", href: "dashboard_principal.html" }
        ]
    },
    {
        titulo: "Compras",
        enlaces: [
            { texto: "Proveedores", href: "proveedores.html" },
            { texto: "Catálogo", href: "catalogo.html" }
        ]
    },
    {
        titulo: "Ventas",
        enlaces: [
            { texto: "Clientes", href: "clientes.html" },
            { texto: "Productos y servicios", href: "productos_servicios.html" }
        ]
    }
];

document.addEventListener("DOMContentLoaded", function () {
    const menuLateral = document.getElementById("menu-lateral");
    const botonMenu = document.getElementById("boton-menu");
    if (!menuLateral) return;

    // ---------- 1. Dibujar el menú ----------
    const opcionesHTML = OPCIONES_MENU.map(function (opcion) {
        const enlacesHTML = opcion.enlaces.map(function (enlace) {
            return '<li><a href="' + enlace.href + '"><span>' + enlace.texto + '</span></a></li>';
        }).join("");

        return '<li class="opcion-menu">' +
                   '<a href="#" class="enlace-principal"><span>' + opcion.titulo + '</span></a>' +
                   '<ul class="submenu">' + enlacesHTML + '</ul>' +
               '</li>';
    }).join("");

    menuLateral.innerHTML =
        '<div id="zona-marca">' +
            '<div id="logo"><figure><img src="componentes/simbolo_micaja+.png" alt="Logo MiCaja+"></figure></div>' +
            '<div id="texto-marca"><h2>MiCaja+</h2><p>Gestión Contable</p></div>' +
        '</div>' +
        '<nav class="navegacion-principal">' +
            '<p>MENÚ PRINCIPAL</p>' +
            '<ul>' + opcionesHTML + '</ul>' +
        '</nav>';

    // ---------- 2. Submenús: abrir uno y cerrar los demás ----------
    const opciones = menuLateral.querySelectorAll("li.opcion-menu");

    opciones.forEach(function (opcion) {
        opcion.querySelector(".enlace-principal").addEventListener("click", function (evento) {
            evento.preventDefault();
            const yaEstabaAbierta = opcion.classList.contains("abierta");
            opciones.forEach(function (otra) { otra.classList.remove("abierta"); });
            if (!yaEstabaAbierta) opcion.classList.add("abierta");
        });
    });

    // ---------- 3. Marcar la página actual ----------
    // Si la página no está en el menú (ej. los formularios de crear empresa),
    // se indica en el <body data-menu="crear_empresa.html">
    const paginaActual = (document.body.dataset.menu || location.pathname.split("/").pop()).toLowerCase();

    menuLateral.querySelectorAll("ul.submenu a").forEach(function (enlace) {
        const destino = enlace.getAttribute("href").split("/").pop().toLowerCase();
        if (destino === paginaActual) {
            enlace.classList.add("enlace-activo");
            enlace.closest("li.opcion-menu").classList.add("opcion-activa", "abierta");
        }
    });

    // ---------- 4. Hamburguesa (solo se ve en pantallas pequeñas) ----------
    if (botonMenu) {
        botonMenu.addEventListener("click", function () {
            document.body.classList.toggle("menu-abierto");
        });

        document.addEventListener("click", function (evento) {
            if (!menuLateral.contains(evento.target) && !botonMenu.contains(evento.target)) {
                document.body.classList.remove("menu-abierto");
            }
        });
    }
});
