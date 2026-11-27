(() => {
    'use strict';

    const ARTICULOS_DEMO = [
        {
            id: 'pos-104',
            codigo: 'POS-104',
            nombre: 'Impresora térmica POS',
            descripcion: 'Impresora térmica de 80 mm con conexión USB y Ethernet.',
            tipo: 'Producto',
            subcuenta: '143505',
            costo: 495000,
            precio: 680000,
            aplicaDescuento: true,
            descuento: 5,
            total: 646000,
            estado: 'Activo'
        },
        {
            id: 'lec-220',
            codigo: 'LEC-220',
            nombre: 'Lector de código de barras',
            descripcion: 'Lector de código de barras para punto de venta.',
            tipo: 'Producto',
            subcuenta: '143505',
            costo: 220000,
            precio: 315000,
            aplicaDescuento: false,
            descuento: 0,
            total: 315000,
            estado: 'Activo'
        },
        {
            id: 'ser-015',
            codigo: 'SER-015',
            nombre: 'Instalación y configuración',
            descripcion: 'Instalación y configuración inicial del equipo.',
            tipo: 'Servicio',
            subcuenta: '513550',
            costo: 90000,
            precio: 180000,
            aplicaDescuento: false,
            descuento: 0,
            total: 180000,
            estado: 'Activo'
        },
        {
            id: 'ins-080',
            codigo: 'INS-080',
            nombre: 'Rollo térmico 80 mm x 10',
            descripcion: 'Paquete de diez rollos térmicos de 80 mm.',
            tipo: 'Producto',
            subcuenta: '143505',
            costo: 58000,
            precio: 92000,
            aplicaDescuento: false,
            descuento: 0,
            total: 92000,
            estado: 'Inactivo'
        }
    ];

    const moneda = new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 2
    });

    function mostrarMensaje(mensaje, tipo) {
        const elemento = document.getElementById('mensaje-articulos');
        if (!elemento) {
            console.error(mensaje);
            return;
        }

        elemento.textContent = mensaje;
        elemento.dataset.tipo = tipo || 'info';
        elemento.hidden = !mensaje;
    }

    function obtenerClaveAlmacenamiento() {
        try {
            const empresaId = sessionStorage.getItem('id_empresa_activa') || 'sin-empresa';
            return `articulos_empresa_${empresaId}`;
        } catch (error) {
            console.error('No se pudo acceder al almacenamiento de sesión.', error);
            mostrarMensaje('El navegador no permitió acceder al almacenamiento de artículos.', 'error');
            return null;
        }
    }

    const claveAlmacenamiento = obtenerClaveAlmacenamiento();

    function esArticuloValido(articulo) {
        return articulo &&
            typeof articulo.id === 'string' &&
            typeof articulo.codigo === 'string' &&
            typeof articulo.nombre === 'string' &&
            typeof articulo.descripcion === 'string' &&
            (articulo.tipo === 'Producto' || articulo.tipo === 'Servicio') &&
            typeof articulo.subcuenta === 'string' &&
            Number.isFinite(articulo.costo) &&
            Number.isFinite(articulo.precio) &&
            typeof articulo.aplicaDescuento === 'boolean' &&
            Number.isFinite(articulo.descuento) &&
            Number.isFinite(articulo.total) &&
            (articulo.estado === 'Activo' || articulo.estado === 'Inactivo');
    }

    function cargarArticulos() {
        if (!claveAlmacenamiento) {
            return null;
        }

        try {
            const datos = sessionStorage.getItem(claveAlmacenamiento);
            if (datos === null) {
                const articulosIniciales = ARTICULOS_DEMO.map((articulo) => ({ ...articulo }));
                sessionStorage.setItem(claveAlmacenamiento, JSON.stringify(articulosIniciales));
                return articulosIniciales;
            }

            const articulos = JSON.parse(datos);
            if (!Array.isArray(articulos) || !articulos.every(esArticuloValido)) {
                throw new Error('Los datos de artículos no tienen un formato válido.');
            }
            return articulos;
        } catch (error) {
            console.error('No se pudieron cargar los artículos de esta sesión.', error);
            mostrarMensaje('No se pudieron cargar los artículos. Recarga la página e inténtalo de nuevo.', 'error');
            return null;
        }
    }

    function guardarArticulos(articulos) {
        if (!claveAlmacenamiento) {
            return false;
        }

        try {
            sessionStorage.setItem(claveAlmacenamiento, JSON.stringify(articulos));
            return true;
        } catch (error) {
            console.error('No se pudieron guardar los artículos de esta sesión.', error);
            mostrarMensaje('No se pudieron guardar los cambios.', 'error');
            return false;
        }
    }

    function formatearMoneda(valor) {
        return `$ ${moneda.format(valor)}`;
    }

    function convertirMonto(valor) {
        const entrada = String(valor).trim().replace(/\$/g, '').replace(/\s/g, '');
        if (!entrada) {
            return null;
        }

        let normalizado = entrada;
        if (normalizado.includes(',') && normalizado.includes('.')) {
            normalizado = normalizado.replace(/\./g, '').replace(',', '.');
        } else if (normalizado.includes(',')) {
            normalizado = normalizado.replace(',', '.');
        } else if (/^\d{1,3}(\.\d{3})+$/.test(normalizado)) {
            normalizado = normalizado.replace(/\./g, '');
        }

        if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) {
            return NaN;
        }

        const monto = Number(normalizado);
        return Number.isFinite(monto) ? monto : NaN;
    }

    function normalizarTexto(texto) {
        return texto.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function leerOpcionSeleccionada(grupo) {
        const boton = grupo.querySelector('button[aria-pressed="true"]');
        return boton ? boton.textContent.trim() : '';
    }

    function seleccionarOpcion(grupo, valor) {
        const valorNormalizado = normalizarTexto(valor);
        grupo.querySelectorAll('button').forEach((boton) => {
            const seleccionado = normalizarTexto(boton.textContent) === valorNormalizado;
            boton.setAttribute('aria-pressed', String(seleccionado));
        });
    }

    function configurarSelectorOpciones() {
        document.querySelectorAll('[data-options]').forEach((grupo) => {
            grupo.addEventListener('click', (evento) => {
                const boton = evento.target.closest('button');
                if (!boton || !grupo.contains(boton)) {
                    return;
                }

                grupo.querySelectorAll('button').forEach((opcion) => {
                    opcion.setAttribute('aria-pressed', String(opcion === boton));
                });

                if (grupo.id === 'opciones-descuento-articulo') {
                    actualizarCampoDescuento();
                    actualizarTotal();
                }
            });
        });
    }

    function actualizarCampoDescuento() {
        const grupo = document.getElementById('opciones-descuento-articulo');
        const campo = document.getElementById('porcentaje-descuento');
        if (!grupo || !campo) {
            return;
        }

        const aplicaDescuento = normalizarTexto(leerOpcionSeleccionada(grupo)) === 'si';
        campo.disabled = !aplicaDescuento;
        if (!aplicaDescuento) {
            campo.value = '0';
        }
    }

    function actualizarTotal() {
        const precio = document.getElementById('precio-articulo');
        const porcentaje = document.getElementById('porcentaje-descuento');
        const total = document.getElementById('total-articulo');
        const grupoDescuento = document.getElementById('opciones-descuento-articulo');
        if (!precio || !porcentaje || !total || !grupoDescuento) {
            return;
        }

        const precioNumerico = convertirMonto(precio.value);
        const descuentoActivo = normalizarTexto(leerOpcionSeleccionada(grupoDescuento)) === 'si';
        const porcentajeNumerico = descuentoActivo
            ? (porcentaje.value.trim() ? Number(porcentaje.value) : NaN)
            : 0;
        if (precioNumerico === null || Number.isNaN(precioNumerico) ||
            !Number.isFinite(porcentajeNumerico) || porcentajeNumerico < 0 || porcentajeNumerico > 100) {
            total.value = '';
            return;
        }

        const valorFinal = precioNumerico * (1 - porcentajeNumerico / 100);
        total.value = formatearMoneda(Math.round(valorFinal * 100) / 100);
    }

    function configurarCalculoFormulario() {
        const formulario = document.getElementById('formulario-articulo');
        if (!formulario) {
            return;
        }

        const precio = document.getElementById('precio-articulo');
        const costo = document.getElementById('costo-articulo');
        const porcentaje = document.getElementById('porcentaje-descuento');

        [precio, costo].forEach((campo) => {
            campo.addEventListener('input', actualizarTotal);
            campo.addEventListener('blur', () => {
                const monto = convertirMonto(campo.value);
                if (monto !== null && Number.isFinite(monto)) {
                    campo.value = formatearMoneda(monto);
                }
            });
        });
        porcentaje.addEventListener('input', actualizarTotal);
        configurarSelectorOpciones();
    }

    function crearArticuloDesdeFormulario() {
        const grupoTipo = document.getElementById('opciones-tipo-articulo');
        const grupoDescuento = document.getElementById('opciones-descuento-articulo');
        const grupoEstado = document.getElementById('botones-selector');
        const costo = convertirMonto(document.getElementById('costo-articulo').value);
        const precio = convertirMonto(document.getElementById('precio-articulo').value);
        const aplicaDescuento = normalizarTexto(leerOpcionSeleccionada(grupoDescuento)) === 'si';
        const porcentaje = document.getElementById('porcentaje-descuento').value.trim();
        const descuento = aplicaDescuento ? (porcentaje ? Number(porcentaje) : NaN) : 0;
        const codigo = document.getElementById('codigo-articulo').value.trim();
        const nombre = document.getElementById('nombre-articulo').value.trim();

        if (!codigo || !nombre) {
            mostrarMensaje('Ingresa el código y el nombre del artículo.', 'error');
            return null;
        }
        if (costo === null || precio === null || !Number.isFinite(costo) || !Number.isFinite(precio)) {
            mostrarMensaje('Ingresa valores válidos para el costo y el precio de venta.', 'error');
            return null;
        }
        if (costo < 0 || precio < 0 || !Number.isFinite(descuento) || descuento < 0 || descuento > 100) {
            mostrarMensaje('El costo, el precio y el descuento deben estar dentro de los valores permitidos.', 'error');
            return null;
        }

        const valorFinal = precio * (1 - descuento / 100);
        return {
            codigo,
            nombre,
            descripcion: document.getElementById('descripcion-articulo').value.trim(),
            tipo: leerOpcionSeleccionada(grupoTipo),
            subcuenta: document.getElementById('subcuenta-articulo').value.trim(),
            costo,
            precio,
            aplicaDescuento,
            descuento,
            total: Math.round(valorFinal * 100) / 100,
            estado: leerOpcionSeleccionada(grupoEstado)
        };
    }

    function configurarFormulario(articulos) {
        const formulario = document.getElementById('formulario-articulo');
        if (!formulario) {
            return;
        }

        configurarCalculoFormulario();
        const parametros = new URLSearchParams(window.location.search);
        const idEdicion = parametros.get('id');
        const articuloExistente = idEdicion
            ? articulos.find((articulo) => articulo.id === idEdicion)
            : null;

        if (idEdicion && !articuloExistente) {
            mostrarMensaje('No se encontró el artículo que intentas editar en esta sesión.', 'error');
            formulario.querySelector('[type="submit"]').disabled = true;
            return;
        }

        if (articuloExistente) {
            document.title = 'Editar Artículo - Mi Caja PLUS';
            document.querySelector('#barra-superior h1').textContent = 'Editar artículo';
            document.querySelector('#encabezado-pagina > span').textContent = 'EDICIÓN DE REGISTRO';
            document.getElementById('codigo-articulo').value = articuloExistente.codigo;
            document.getElementById('nombre-articulo').value = articuloExistente.nombre;
            document.getElementById('descripcion-articulo').value = articuloExistente.descripcion;
            document.getElementById('subcuenta-articulo').value = articuloExistente.subcuenta;
            document.getElementById('costo-articulo').value = formatearMoneda(articuloExistente.costo);
            document.getElementById('precio-articulo').value = formatearMoneda(articuloExistente.precio);
            document.getElementById('porcentaje-descuento').value = String(articuloExistente.descuento);
            seleccionarOpcion(document.getElementById('opciones-tipo-articulo'), articuloExistente.tipo);
            seleccionarOpcion(
                document.getElementById('opciones-descuento-articulo'),
                articuloExistente.aplicaDescuento ? 'Sí' : 'No'
            );
            seleccionarOpcion(document.getElementById('botones-selector'), articuloExistente.estado);
            actualizarCampoDescuento();
            formulario.querySelector('[type="submit"]').textContent = 'Guardar cambios';
            document.getElementById('total-articulo').value = formatearMoneda(articuloExistente.total);
        } else {
            actualizarCampoDescuento();
        }

        formulario.addEventListener('submit', (evento) => {
            evento.preventDefault();
            mostrarMensaje('', 'info');
            if (!formulario.reportValidity()) {
                return;
            }

            const datos = crearArticuloDesdeFormulario();
            if (!datos) {
                return;
            }

            const codigoDuplicado = articulos.some((articulo) =>
                normalizarTexto(articulo.codigo) === normalizarTexto(datos.codigo) &&
                articulo.id !== idEdicion
            );
            if (codigoDuplicado) {
                mostrarMensaje('Ya existe un artículo con ese código. Usa un código diferente.', 'error');
                document.getElementById('codigo-articulo').focus();
                return;
            }

            if (idEdicion) {
                const indice = articulos.findIndex((articulo) => articulo.id === idEdicion);
                articulos[indice] = { ...articulos[indice], ...datos };
            } else {
                datos.id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                articulos.push(datos);
            }

            if (guardarArticulos(articulos)) {
                window.location.href = 'servicios_producto.html';
            }
        });

        document.getElementById('cancelar-articulo').addEventListener('click', () => {
            window.location.href = 'servicios_producto.html';
        });
    }

    function crearElemento(tag, texto, clase) {
        const elemento = document.createElement(tag);
        if (texto !== undefined) {
            elemento.textContent = texto;
        }
        if (clase) {
            elemento.className = clase;
        }
        return elemento;
    }

    function configurarListado(articulos) {
        const lista = document.getElementById('lista-articulos');
        if (!lista) {
            return;
        }

        const busqueda = document.getElementById('buscar-articulos');
        const contador = document.getElementById('contador-articulos');
        const filtros = {
            tipo: 'Todos',
            estado: 'Todos'
        };

        function renderizar() {
            const consulta = normalizarTexto(busqueda.value);
            const visibles = articulos.filter((articulo) => {
                const coincideConsulta = normalizarTexto(`${articulo.nombre} ${articulo.codigo}`).includes(consulta);
                const coincideTipo = filtros.tipo === 'Todos' || articulo.tipo === filtros.tipo;
                const coincideEstado = filtros.estado === 'Todos' || articulo.estado === filtros.estado;
                return coincideConsulta && coincideTipo && coincideEstado;
            });

            lista.replaceChildren();
            visibles.forEach((articulo) => {
                const tarjeta = crearElemento('article');
                tarjeta.tabIndex = 0;
                tarjeta.setAttribute('role', 'link');
                tarjeta.setAttribute('aria-label', `Ver detalle de ${articulo.nombre}`);
                tarjeta.dataset.articuloId = articulo.id;

                const informacion = crearElemento('div');
                const tituloEstado = crearElemento('div');
                tituloEstado.append(
                    crearElemento('h4', articulo.nombre),
                    crearElemento('span', articulo.estado)
                );
                tituloEstado.lastElementChild.dataset.status = articulo.estado;
                informacion.append(
                    tituloEstado,
                    crearElemento('p', `${articulo.codigo} · ${articulo.tipo}`)
                );

                const precio = crearElemento('span', formatearMoneda(articulo.precio));
                const icono = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                icono.setAttribute('viewBox', '0 0 24 24');
                icono.setAttribute('aria-hidden', 'true');
                const trazo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                trazo.setAttribute('d', 'M9.62012 18.25L15.8701 12L9.62012 5.75');
                trazo.setAttribute('stroke', '#323544');
                trazo.setAttribute('stroke-width', '1.5');
                trazo.setAttribute('stroke-linecap', 'round');
                trazo.setAttribute('stroke-linejoin', 'round');
                icono.append(trazo);
                tarjeta.append(informacion, precio, icono);
                lista.append(tarjeta);
            });

            if (!visibles.length) {
                lista.append(crearElemento('p', 'No se encontraron artículos con esos criterios.', 'sin-resultados-articulos'));
            }
            contador.textContent = `${visibles.length} ${visibles.length === 1 ? 'registro' : 'registros'}`;
        }

        function configurarGrupoFiltro(id, atributo, clave) {
            const grupo = document.getElementById(id);
            grupo.querySelectorAll('button').forEach((boton) => {
                boton.addEventListener('click', () => {
                    filtros[clave] = boton.dataset[atributo];
                    grupo.querySelectorAll('button').forEach((opcion) => {
                        const activo = opcion === boton;
                        opcion.classList.toggle('activo', activo);
                        opcion.setAttribute('aria-pressed', String(activo));
                    });
                    renderizar();
                });
            });
        }

        busqueda.addEventListener('input', renderizar);
        configurarGrupoFiltro('filtro-tipo-articulo', 'tipoFilter', 'tipo');
        configurarGrupoFiltro('filtro-estado-articulo', 'estadoFilter', 'estado');
        lista.addEventListener('click', (evento) => {
            const tarjeta = evento.target.closest('[data-articulo-id]');
            if (tarjeta) {
                window.location.href = `detalle_produc_servi.html?id=${encodeURIComponent(tarjeta.dataset.articuloId)}`;
            }
        });
        lista.addEventListener('keydown', (evento) => {
            const tarjeta = evento.target.closest('[data-articulo-id]');
            if (tarjeta && (evento.key === 'Enter' || evento.key === ' ')) {
                evento.preventDefault();
                window.location.href = `detalle_produc_servi.html?id=${encodeURIComponent(tarjeta.dataset.articuloId)}`;
            }
        });

        renderizar();
    }

    function configurarDetalle(articulos) {
        const botonEditar = document.getElementById('editar-articulo');
        if (!botonEditar) {
            return;
        }

        const parametros = new URLSearchParams(window.location.search);
        const id = parametros.get('id') || 'pos-104';
        const articulo = articulos.find((registro) => registro.id === id);
        if (!articulo) {
            mostrarMensaje('No se encontró el artículo solicitado en esta sesión.', 'error');
            botonEditar.disabled = true;
            document.getElementById('cambiar-estado-articulo').disabled = true;
            return;
        }

        const valores = {
            'nombre-articulo-detalle': articulo.nombre,
            'resumen-articulo-detalle': `${articulo.tipo} · ${articulo.estado} · Código: ${articulo.codigo}`,
            'codigo-articulo-detalle': articulo.codigo,
            'nombre-articulo-dato': articulo.nombre,
            'descripcion-articulo-detalle': articulo.descripcion || 'Sin descripción',
            'tipo-articulo-detalle': articulo.tipo.toUpperCase(),
            'subcuenta-articulo-detalle': articulo.subcuenta || '—',
            'estado-articulo-detalle': articulo.estado.toUpperCase(),
            'costo-articulo-detalle': formatearMoneda(articulo.costo),
            'precio-articulo-detalle': formatearMoneda(articulo.precio),
            'aplica-descuento-detalle': articulo.aplicaDescuento ? 'Sí' : 'No',
            'descuento-articulo-detalle': articulo.aplicaDescuento ? `${articulo.descuento}%` : '—',
            'total-articulo-detalle': formatearMoneda(articulo.total)
        };

        Object.entries(valores).forEach(([idElemento, valor]) => {
            const elemento = document.getElementById(idElemento);
            if (elemento) {
                elemento.textContent = valor;
            }
        });

        botonEditar.addEventListener('click', () => {
            window.location.href = `añadir_produc_servi.html?id=${encodeURIComponent(articulo.id)}`;
        });

        const botonEstado = document.getElementById('cambiar-estado-articulo');
        botonEstado.textContent = articulo.estado === 'Activo' ? 'Inhabilitar' : 'Activar';
        botonEstado.addEventListener('click', () => {
            articulo.estado = articulo.estado === 'Activo' ? 'Inactivo' : 'Activo';
            if (guardarArticulos(articulos)) {
                document.getElementById('resumen-articulo-detalle').textContent =
                    `${articulo.tipo} · ${articulo.estado} · Código: ${articulo.codigo}`;
                document.getElementById('estado-articulo-detalle').textContent = articulo.estado.toUpperCase();
                botonEstado.textContent = articulo.estado === 'Activo' ? 'Inhabilitar' : 'Activar';
            }
        });
    }

    const articulos = cargarArticulos();
    if (articulos) {
        configurarListado(articulos);
        configurarFormulario(articulos);
        configurarDetalle(articulos);
    }
})();
