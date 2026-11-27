document.addEventListener("DOMContentLoaded", function () {
  /* ⚠️ CONFIGURACIÓN DE RUTA DE TU BACKEND
 */
  const API_URL_EMPRESAS = 'http://localhost:3000/api/empresas';
  /* 1. El menú lateral (hamburguesa, submenús, opción activa) ahora está en menu.js */
  /* 2. VALIDAR DÍGITO DE VERIFICACIÓN DEL NIT */
const inputNit = document.getElementById('numero_identificacion');
  const inputDv = document.getElementById('dv');
  const tipoIdentificacion = document.getElementById('tipo_identificacion');
  const mensajeErrorDv = document.getElementById('mensaje-error-dv');
  const pesosNit = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const fechaInicioFiscal = document.getElementById('fecha_inicio_fiscal');

  if (fechaInicioFiscal) {
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    fechaInicioFiscal.max = hoy.toISOString().slice(0, 10);
  }

  if (inputNit && inputDv && tipoIdentificacion && mensajeErrorDv) {
    function mostrarErrorDv(mensaje) {
      mensajeErrorDv.textContent = mensaje;
      mensajeErrorDv.hidden = !mensaje;
      inputDv.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
    }

    function calcularDigitoVerificacion(nit) {
      let suma = 0;

      for (let indice = 0; indice < nit.length; indice += 1) {
        const digito = Number(nit[nit.length - 1 - indice]);
        suma += digito * pesosNit[indice];
      }

      const residuo = suma % 11;
      return residuo <= 1 ? residuo : 11 - residuo;
    }

    function validarDigitoVerificacion() {
      inputNit.setCustomValidity('');
      inputDv.setCustomValidity('');
      inputNit.removeAttribute('aria-invalid');
      mostrarErrorDv('');

      const dv = inputDv.value.trim();
      if (!dv) return;

      if (!/^\d$/.test(dv)) {
        const mensaje = 'El DV debe ser un solo dígito entre 0 y 9.';
        inputDv.setCustomValidity(mensaje);
        mostrarErrorDv(mensaje);
        return;
      }

      if (tipoIdentificacion.value !== 'NIT') return;

      const nit = inputNit.value.trim();
      if (!/^\d{1,11}$/.test(nit)) {
        const mensaje = 'Ingresa un NIT de 1 a 11 dígitos para validar el DV.';
        inputNit.setCustomValidity(mensaje);
        inputNit.setAttribute('aria-invalid', 'true');
        inputDv.setCustomValidity(mensaje);
        mostrarErrorDv(mensaje);
        return;
      }

      const dvEsperado = calcularDigitoVerificacion(nit);
      if (Number(dv) !== dvEsperado) {
        const mensaje = 'El DV ingresado es incorrecto.';
        inputDv.setCustomValidity(mensaje);
        mostrarErrorDv(mensaje);
      }
    }

    inputNit.addEventListener('input', validarDigitoVerificacion);
    inputDv.addEventListener('input', validarDigitoVerificacion);
    tipoIdentificacion.addEventListener('change', validarDigitoVerificacion);
    validarDigitoVerificacion();
  }
  /* 3. CLASIFICACIÓN MIPYME EN TIEMPO REAL */
/* Rangos en pesos colombianos (COP) según decretos/tablas de Manufactura, Comercio y Servicios
 */
  const rangosMiPyME = {
    Manufactura: {
      microMax: 808000000,      // Hasta $808 Millones
      pequenaMax: 7025000000,   // Hasta $7.025 Millones
      medianaMax: 59512000000   // Hasta $59.512 Millones
    },
    Comercio: {
      microMax: 1534000000,     // Hasta $1.534 Millones
      pequenaMax: 14777000000,  // Hasta $14.777 Millones
      medianaMax: 74047000000   // Hasta $74.047 Millones
    },
    Servicios: {
      microMax: 1130000000,     // Hasta $1.130 Millones
      pequenaMax: 4522000000,   // Hasta $4.522 Millones
      medianaMax: 16554000000   // Hasta $16.554 Millones
    }
  };

  const selectSectorMiPyME = document.getElementById('sector_economico_mipyme');
  const inputResultadoMiPyME = document.getElementById('clasificacion_mipyme_resultado');
  const inputRangoMinimoMiPyME = document.getElementById('clasificacion_minimo_cop');
  const inputRangoMaximoMiPyME = document.getElementById('clasificacion_maximo_cop');
  const badgeTamanoMiPyME = document.getElementById('badge-tamano-mipyme');
  const detalleRangoMiPyME = document.getElementById('detalle-rango-mipyme');

  function agregarPuntoMiles(valor) {
    const valorLimpio = valor.replace(/\D/g, '');
    return valorLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  [inputRangoMinimoMiPyME, inputRangoMaximoMiPyME].forEach(input => {
    if (!input) return;

    input.addEventListener('input', function () {
      const posicion = this.selectionStart === null ? this.value.length : this.selectionStart;
      const digitosAntesDelCursor = this.value.slice(0, posicion).replace(/\D/g, '').length;
      this.value = agregarPuntoMiles(this.value);

      let nuevaPosicion = 0;
      let digitosContados = 0;
      while (nuevaPosicion < this.value.length && digitosContados < digitosAntesDelCursor) {
        if (/\d/.test(this.value[nuevaPosicion])) digitosContados += 1;
        nuevaPosicion += 1;
      }
      this.setSelectionRange(nuevaPosicion, nuevaPosicion);
    });
  });

  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.value = input.value.toLowerCase();
    input.addEventListener('input', function () {
      this.value = this.value.toLowerCase();
    });
  });

  function formatoCOP(valor) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor);
  }

  function calcularClasificacionMiPyME() {
    if (!selectSectorMiPyME || !inputResultadoMiPyME || !inputRangoMinimoMiPyME || !inputRangoMaximoMiPyME) return;

    const sector = selectSectorMiPyME.value;
    const tabla = rangosMiPyME[sector];

    if (!tabla) return;

    inputRangoMinimoMiPyME.setCustomValidity('');
    inputRangoMaximoMiPyME.setCustomValidity('');
    delete inputResultadoMiPyME.dataset.tamano;

    const minimo = inputRangoMinimoMiPyME.value === '' ? null : Number(inputRangoMinimoMiPyME.value.replace(/\./g, ''));
    const maximo = inputRangoMaximoMiPyME.value === '' ? null : Number(inputRangoMaximoMiPyME.value.replace(/\./g, ''));

    if (badgeTamanoMiPyME) {
      badgeTamanoMiPyME.textContent = 'Sin calcular';
    }

    if (minimo === null) {
      inputResultadoMiPyME.value = 'Ingresa los límites para calcular';
      if (detalleRangoMiPyME) {
        detalleRangoMiPyME.textContent = `Rangos de ${sector}: Micro ${formatoCOP(0)} a ${formatoCOP(tabla.microMax)}; Pequeña ${formatoCOP(tabla.microMax + 1)} a ${formatoCOP(tabla.pequenaMax)}; Mediana ${formatoCOP(tabla.pequenaMax + 1)} a ${formatoCOP(tabla.medianaMax)}.`;
      }
      return;
    }

    if (!Number.isSafeInteger(minimo) || minimo < 0) {
      inputRangoMinimoMiPyME.setCustomValidity('Ingresa un mínimo entero igual o mayor a cero.');
      inputResultadoMiPyME.value = 'Rango inválido';
      if (detalleRangoMiPyME) detalleRangoMiPyME.textContent = 'El mínimo debe ser un valor entero igual o mayor a cero.';
      return;
    }

    if (maximo !== null && (!Number.isSafeInteger(maximo) || maximo < minimo)) {
      inputRangoMaximoMiPyME.setCustomValidity('El máximo debe ser un entero igual o mayor que el mínimo.');
      inputResultadoMiPyME.value = 'Rango inválido';
      if (detalleRangoMiPyME) detalleRangoMiPyME.textContent = 'El máximo debe ser un valor entero igual o mayor que el mínimo.';
      return;
    }

    let tamano = '';
    let nombreTamano = '';
    if (maximo === null && minimo > tabla.medianaMax) {
      tamano = 'grande';
      nombreTamano = 'Gran empresa';
    } else if (maximo === null) {
      inputRangoMaximoMiPyME.setCustomValidity('Completa el máximo para clasificar el rango.');
      inputResultadoMiPyME.value = 'Completa el máximo del rango';
      if (detalleRangoMiPyME) detalleRangoMiPyME.textContent = `Solo Gran empresa puede dejar el máximo vacío (mínimo superior a ${formatoCOP(tabla.medianaMax)}).`;
      return;
    } else if (maximo <= tabla.microMax) {
      tamano = 'micro';
      nombreTamano = 'Microempresa';
    } else if (minimo >= tabla.microMax + 1 && maximo <= tabla.pequenaMax) {
      tamano = 'pequeña';
      nombreTamano = 'Pequeña empresa';
    } else if (minimo >= tabla.pequenaMax + 1 && maximo <= tabla.medianaMax) {
      tamano = 'mediana';
      nombreTamano = 'Mediana empresa';
    } else if (minimo > tabla.medianaMax) {
      tamano = 'grande';
      nombreTamano = 'Gran empresa';
    } else {
      inputRangoMaximoMiPyME.setCustomValidity('El rango debe estar dentro de una sola categoría MiPyME para el sector seleccionado.');
      inputResultadoMiPyME.value = 'Rango en más de una categoría';
      if (detalleRangoMiPyME) detalleRangoMiPyME.textContent = `El rango cruza los límites de clasificación de ${sector}. Ajusta los valores para que pertenezcan a una sola categoría.`;
      return;
    }

    inputResultadoMiPyME.value = `${nombreTamano} (${sector})`;
    inputResultadoMiPyME.dataset.tamano = tamano;
    if (badgeTamanoMiPyME) badgeTamanoMiPyME.textContent = nombreTamano;
    if (detalleRangoMiPyME) {
      detalleRangoMiPyME.textContent = maximo === null
        ? `Gran empresa en ${sector}: desde ${formatoCOP(minimo)}, sin límite máximo.`
        : `${nombreTamano} en ${sector}: ${formatoCOP(minimo)} a ${formatoCOP(maximo)}.`;
    }
  }

  if (selectSectorMiPyME && inputResultadoMiPyME && inputRangoMinimoMiPyME && inputRangoMaximoMiPyME) {
    selectSectorMiPyME.addEventListener('change', calcularClasificacionMiPyME);
    inputRangoMinimoMiPyME.addEventListener('input', calcularClasificacionMiPyME);
    inputRangoMaximoMiPyME.addEventListener('input', calcularClasificacionMiPyME);
    calcularClasificacionMiPyME();
  }

  const inputTotalDebitos = document.getElementById('total_debitos');
  const inputTotalCreditos = document.getElementById('total_creditos');
  const inputImagenBalance = document.getElementById('imagen_balance_general');
  const textoImagenBalance = document.getElementById('texto-imagen-balance');
  const mensajeErrorSaldos = document.getElementById('mensaje-error-saldos');
  const formularioHistorico = document.getElementById('form-historico-empresa');

  function validarSaldosIniciales(mostrarError) {
    if (!formularioHistorico || !inputTotalDebitos || !inputTotalCreditos || !inputImagenBalance || !mensajeErrorSaldos) return true;

    const archivoImagen = inputImagenBalance.files && inputImagenBalance.files[0];
    const hayDebitos = inputTotalDebitos.value !== '';
    const hayCreditos = inputTotalCreditos.value !== '';
    const ingresoManualCompleto = hayDebitos && hayCreditos;
    let mensaje = '';

    if (archivoImagen && archivoImagen.type && !['image/png', 'image/jpeg', 'image/webp'].includes(archivoImagen.type)) {
      mensaje = 'El archivo debe ser una imagen PNG, JPG o WEBP.';
    } else if (!archivoImagen && !ingresoManualCompleto) {
      mensaje = 'Adjunta una imagen del balance general o completa los totales de débitos y créditos.';
    }

    const mostrar = Boolean(mensaje) && (mostrarError || hayDebitos || hayCreditos || Boolean(archivoImagen));
    mensajeErrorSaldos.textContent = mostrar ? mensaje : '';
    mensajeErrorSaldos.hidden = !mostrar;
    inputTotalDebitos.setCustomValidity(!archivoImagen && hayCreditos && !hayDebitos ? 'Ingresa el total de débitos o adjunta una imagen.' : '');
    inputTotalCreditos.setCustomValidity(!archivoImagen && hayDebitos && !hayCreditos ? 'Ingresa el total de créditos o adjunta una imagen.' : '');
    return !mensaje;
  }

  if (formularioHistorico && inputTotalDebitos && inputTotalCreditos && inputImagenBalance && textoImagenBalance) {
    [inputTotalDebitos, inputTotalCreditos].forEach(input => {
      input.addEventListener('input', () => validarSaldosIniciales(false));
    });

    inputImagenBalance.addEventListener('change', function () {
      const archivoImagen = this.files && this.files[0];
      textoImagenBalance.textContent = archivoImagen
        ? `Imagen seleccionada: ${archivoImagen.name}`
        : 'Haz clic aquí para seleccionar una imagen (PNG, JPG o WEBP)';
      validarSaldosIniciales(false);
    });
  }

  function leerArchivoComoDataUrl(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => {
        if (typeof lector.result === 'string') {
          resolve(lector.result);
        } else {
          reject(new Error('No se pudo leer el archivo seleccionado.'));
        }
      };
      lector.onerror = () => reject(lector.error || new Error('No se pudo leer el archivo seleccionado.'));
      lector.readAsDataURL(archivo);
    });
  }
  /* 4. LISTAR EMPRESAS DESDE EL BACKEND (PANEL) */
const contenedorEmpresas = document.getElementById('contenedor-empresas');
  const buscadorEmpresas = document.getElementById('buscador-empresas');
  let listaEmpresasGlobal = [];

  function renderizarTarjetas(empresas) {
    if (!contenedorEmpresas) return;
    contenedorEmpresas.innerHTML = '';

    if (empresas.length === 0) {
      contenedorEmpresas.innerHTML = `
        <div id="role__tarjetas__estado-lista-empresas" style="text-align: center; color: var(--azul-pizarra); padding: 2rem;">
          No hay empresas registradas o no coinciden con la búsqueda.
        </div>`;
      return;
    }

    const coloresAvatar = ['#011E31', '#0C4160', '#56A396'];

    empresas.forEach((emp, index) => {
      const nombre = emp.razon_social || emp.nombre_comercial || emp.nombre || 'Empresa Sin Nombre';
      const nit = emp.numero_identificacion || emp.nit || 'Sin NIT';
      const dv = (emp.dv !== undefined && emp.dv !== null && emp.dv !== '')
        ? `-${emp.dv}`
        : (emp.digito_verificacion !== undefined && emp.digito_verificacion !== null ? `-${emp.digito_verificacion}` : '');
      const ciudad = emp.ciudad || 'Colombia';
      
      const estadoDato = emp.activo !== undefined && emp.activo !== null
        ? emp.activo
        : emp.estado;
      const valorEstado = typeof estadoDato === 'string'
        ? estadoDato.trim().toLowerCase()
        : estadoDato;
      const empresaActiva = ![false, 0, 'false', '0', 'inactivo', 'inactiva', 'no'].includes(valorEstado);
      const textoEstado = empresaActiva ? 'Activo' : 'Inactivo';
      const claseEstado = empresaActiva
        ? 'estado-empresa-activa'
        : 'estado-empresa-inactiva';

      

      const iniciales = nombre.trim().substring(0, 2).toUpperCase();
      const colorFondo = coloresAvatar[index % coloresAvatar.length];

      const tarjeta = document.createElement('div');
      tarjeta.id = `role__tarjetas__tarjeta-empresa-item__${index}`;
      tarjeta.innerHTML = `
        <div id="info-empresa-${index}">
          <div id="avatar-empresa-${index}" style="background-color: ${colorFondo};">${iniciales}</div>
          <div>
            <h3 id="nombre-empresa-${index}">${nombre} <span class="etiqueta-obligacion ${claseEstado}">${textoEstado}</span></h3>
            <p id="detalles-empresa-${index}">NIT ${nit}${dv} • ${ciudad}</p>
          </div>
        </div>
        <div id="icono-flecha-${index}">&rsaquo;</div>
      `;

      tarjeta.addEventListener('click', () => {
        const identificador = emp.id || emp.nit || emp.numero_identificacion;
        if (identificador) {
          sessionStorage.setItem('id_empresa_activa', identificador);
          window.location.href = `dashboard_empresa.html?id=${encodeURIComponent(identificador)}`;
        }
      });

      contenedorEmpresas.appendChild(tarjeta);
    });
  }

  async function cargarEmpresasDesdeBackend() {
    if (!contenedorEmpresas) return;

    try {
      const respuesta = await fetch(API_URL_EMPRESAS);
      if (!respuesta.ok) throw new Error('Error al consultar el servidor');

      const datos = await respuesta.json();
      listaEmpresasGlobal = Array.isArray(datos) ? datos : (datos.data || datos.empresas || []);
      renderizarTarjetas(listaEmpresasGlobal);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      contenedorEmpresas.innerHTML = `
        <div id="role__tarjetas__error-lista-empresas" style="text-align: center; color: #b91c1c; padding: 2rem;">
          No se pudo conectar con el servidor para cargar las empresas. Verifica que el backend esté encendido.
        </div>`;
    }
  }

  if (contenedorEmpresas) {
    cargarEmpresasDesdeBackend();

    if (buscadorEmpresas) {
      buscadorEmpresas.addEventListener('input', function (e) {
        const texto = e.target.value.toLowerCase().trim();
        const filtradas = listaEmpresasGlobal.filter(emp => {
          const nombre = (emp.razon_social || emp.nombre_comercial || emp.nombre || '').toLowerCase();
          const nit = String(emp.numero_identificacion || emp.nit || '').toLowerCase();
          return nombre.includes(texto) || nit.includes(texto);
        });
        renderizarTarjetas(filtradas);
      });
    }
  }
  /* 5. ENVIAR NUEVA EMPRESA AL BACKEND (POST) */
const formularioEmpresa = document.querySelector('form');
  if (formularioEmpresa && !document.getElementById('form-informacion-empresa')) {
    formularioEmpresa.addEventListener('submit', async function (e) {
      e.preventDefault();

      const formularioActual = e.currentTarget;
      if (formularioActual === formularioHistorico && !validarSaldosIniciales(true)) {
        formularioActual.reportValidity();
        return;
      }

      if (!formularioActual.checkValidity()) {
        formularioActual.reportValidity();
        return;
      }

      try {
        const archivoImagenBalance = inputImagenBalance && inputImagenBalance.files
          ? inputImagenBalance.files[0]
          : null;
        const valorMinimoMiPyME = inputRangoMinimoMiPyME && inputRangoMinimoMiPyME.value !== ''
          ? Number(inputRangoMinimoMiPyME.value.replace(/\./g, ''))
          : null;
        const valorMaximoMiPyME = inputRangoMaximoMiPyME && inputRangoMaximoMiPyME.value !== ''
          ? Number(inputRangoMaximoMiPyME.value.replace(/\./g, ''))
          : null;
        const fechaApertura = document.getElementById('fecha_inicio_fiscal')?.value || null;

        const datosNuevaEmpresa = {
          activo: document.getElementById('activo')
            ? document.getElementById('activo').value === 'true'
            : true,
          razon_social: document.getElementById('razon_social')?.value || '',
          nombre_comercial: document.getElementById('nombre_comercial')?.value || '',
          tipo_identificacion: document.getElementById('tipo_identificacion')?.value || 'NIT',
          pais: document.getElementById('pais')?.value || 'Colombia',
          numero_identificacion: document.getElementById('numero_identificacion')?.value || '',
          dv: document.getElementById('dv')?.value || '',
          departamento: document.getElementById('departamento')?.value || '',
          ciudad: document.getElementById('ciudad')?.value || '',
          direccion: document.getElementById('direccion')?.value || '',
          telefono: document.getElementById('telefono')?.value || '',
          correo_electronico: document.getElementById('correo_electronico')?.value || '',
          fecha_inicio_fiscal: fechaApertura,
          fecha_apertura: fechaApertura,
          codigo_actividad_economica: document.getElementById('codigo_actividad_economica')?.value || '',
          regimen_fiscal: document.getElementById('regimen_fiscal')?.value || '',
          sector_economico_mipyme: selectSectorMiPyME?.value || '',
          clasificacion_mipyme: inputResultadoMiPyME?.dataset.tamano || '',
          clasificacion_minimo_cop: valorMinimoMiPyME,
          clasificacion_maximo_cop: valorMaximoMiPyME,
          total_debitos: inputTotalDebitos && inputTotalDebitos.value !== '' ? Number(inputTotalDebitos.value) : null,
          total_creditos: inputTotalCreditos && inputTotalCreditos.value !== '' ? Number(inputTotalCreditos.value) : null,
          imagen_balance_general: archivoImagenBalance ? await leerArchivoComoDataUrl(archivoImagenBalance) : null,
          nombre_representante: document.getElementById('nombre_representante')?.value || '',
          documento_representante: document.getElementById('documento_representante')?.value || ''
        };

        const respuesta = await fetch(API_URL_EMPRESAS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosNuevaEmpresa)
        });

        if (respuesta.ok) {
          window.location.href = 'dashboard_principal.html';
        } else {
          const errorInfo = await respuesta.json().catch(() => ({}));
          alert('No se pudo guardar la empresa: ' + (errorInfo.message || 'Error en el servidor'));
        }
      } catch (error) {
        console.error('Error al enviar formulario:', error);
        alert('Error de conexión con el servidor al intentar crear la empresa.');
      }
    });
  }
  /* 6. SELECTOR DE DEPARTAMENTOS Y CIUDADES */
  const colombiaData = window.CIUDADES_POR_DEPARTAMENTO;
  const selectDepartamento = document.getElementById('departamento');
  const selectCiudad = document.getElementById('ciudad');

  if (selectDepartamento && selectCiudad && colombiaData) {
    Object.keys(colombiaData).sort().forEach(depto => {
      const option = document.createElement('option');
      option.value = depto;
      option.textContent = depto;
      selectDepartamento.appendChild(option);
    });

    const departamentoInicial = selectDepartamento.dataset.valorInicial;
    const ciudadInicial = selectCiudad.dataset.valorInicial;
    if (departamentoInicial && colombiaData[departamentoInicial]) {
      selectDepartamento.value = departamentoInicial;
      colombiaData[departamentoInicial].sort().forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        option.textContent = ciudad;
        selectCiudad.appendChild(option);
      });
      selectCiudad.value = ciudadInicial || '';
      selectCiudad.disabled = false;
    }

    selectDepartamento.addEventListener('change', function () {
      const deptoSeleccionado = this.value;
      selectCiudad.innerHTML = '<option value="" disabled selected>Selecciona una ciudad...</option>';

      if (deptoSeleccionado && colombiaData[deptoSeleccionado]) {
        selectCiudad.disabled = false;
        colombiaData[deptoSeleccionado].sort().forEach(ciudad => {
          const option = document.createElement('option');
          option.value = ciudad;
          option.textContent = ciudad;
          selectCiudad.appendChild(option);
        });
      } else {
        selectCiudad.disabled = true;
      }
    });
  }
  /* 7. BUSCADOR AUTOCOMPLETE CÓDIGOS CIIU */
const codigosCIIU = [
    { codigo: "0113", desc: "Cultivo de hortalizas, raíces y tubérculos" },
    { codigo: "0123", desc: "Cultivo de café" },
    { codigo: "0141", desc: "Cría de ganado bovino y bufalino" },
    { codigo: "1081", desc: "Elaboración de productos de panadería" },
    { codigo: "1410", desc: "Confección de prendas de vestir, excepto prendas de piel" },
    { codigo: "2511", desc: "Fabricación de productos metálicos para uso estructural" },
    { codigo: "4111", desc: "Construcción de edificios residenciales" },
    { codigo: "4520", desc: "Mantenimiento y reparación de vehículos automotores" },
    { codigo: "4631", desc: "Comercio al por mayor de productos alimenticios" },
    { codigo: "4711", desc: "Comercio al por menor en establecimientos no especializados" },
    { codigo: "4771", desc: "Comercio al por menor de prendas de vestir y sus accesorios" },
    { codigo: "4773", desc: "Comercio al por menor de productos farmacéuticos y medicinales" },
    { codigo: "4791", desc: "Comercio al por menor realizado a través de Internet" },
    { codigo: "5611", desc: "Expendio a la mesa de comidas preparadas (restaurantes)" },
    { codigo: "6201", desc: "Actividades de desarrollo de sistemas informáticos (software)" },
    { codigo: "6202", desc: "Actividades de consultoría informática" },
    { codigo: "6810", desc: "Actividades inmobiliarias" },
    { codigo: "6920", desc: "Actividades de contabilidad, teneduría de libros y auditoría" },
    { codigo: "7020", desc: "Actividades de consultoría de gestión" },
    { codigo: "7310", desc: "Publicidad y marketing" },
    { codigo: "8299", desc: "Otras actividades de servicio de apoyo a las empresas" }
  ];

  const inputCIIU = document.getElementById('codigo_actividad_economica');
  if (inputCIIU) {
    const contenedorAutocomplete = inputCIIU.parentElement;
    contenedorAutocomplete.id += '__contenedor-autocomplete__';

    let listaSugerencias = document.getElementById('lista-sugerencias-ciiu');
    if (!listaSugerencias) {
      listaSugerencias = document.createElement('div');
      listaSugerencias.id = 'lista-sugerencias-ciiu';
      contenedorAutocomplete.appendChild(listaSugerencias);
    }

    function renderizarSugerencias(filtro = '') {
      listaSugerencias.innerHTML = '';
      const textoBusqueda = filtro.toLowerCase().trim();

      const filtrados = codigosCIIU.filter(item =>
        item.codigo.includes(textoBusqueda) ||
        item.desc.toLowerCase().includes(textoBusqueda)
      );

      if (filtrados.length === 0) {
        const divVacio = document.createElement('div');
        divVacio.id = 'lista-sugerencias-sin-resultados';
        divVacio.textContent = 'No se encontraron códigos con ese criterio';
        listaSugerencias.appendChild(divVacio);
      } else {
        filtrados.forEach(item => {
          const divItem = document.createElement('div');
          divItem.id = `opcion-ciiu-${item.codigo}`;
          divItem.innerHTML = `<span id="codigo-ciiu-${item.codigo}">${item.codigo}</span> - ${item.desc}`;

          divItem.addEventListener('mousedown', (e) => {
            e.preventDefault();
            inputCIIU.value = `${item.codigo} - ${item.desc}`;
            listaSugerencias.innerHTML = '';
            listaSugerencias.id = 'lista-sugerencias-ciiu';
          });

          listaSugerencias.appendChild(divItem);
        });
      }
      listaSugerencias.id = 'lista-sugerencias-ciiu-activa';
    }

    inputCIIU.addEventListener('focus', () => renderizarSugerencias(inputCIIU.value));
    inputCIIU.addEventListener('input', () => renderizarSugerencias(inputCIIU.value));

    inputCIIU.addEventListener('blur', () => {
      setTimeout(() => {
        listaSugerencias.id = 'lista-sugerencias-ciiu';
      }, 200);
    });
  }
});


// ---------------------------------EDITAR EMPRESA---------------------------------
// Solo corre en la página de información (si no hay formulario, no hace nada)
document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.getElementById("form-informacion-empresa");
    if (!formulario) return;

    const botonEditar = document.getElementById("btn-editar-empresa");
    const botonCancelar = document.getElementById("btn-cancelar-edicion");
    const nota = document.getElementById("nota-formulario");
    const textoNota = nota.textContent;
    const campos = formulario.querySelectorAll("input, select");
    let valoresOriginales = {};

    // Bloquea o desbloquea todos los campos
    function bloquearCampos(bloquear) {
        campos.forEach(function (campo) {
            if (campo.tagName === "SELECT" || campo.type === "file") {
                campo.disabled = bloquear;
            } else if (campo.dataset.calculado === "true") {
                campo.readOnly = true;
            } else {
                campo.readOnly = bloquear;
            }
        });
        formulario.classList.toggle("modo-edicion", !bloquear);
    }

    function iniciarEdicion() {
        valoresOriginales = {};
        campos.forEach(function (campo) {
            if (campo.type !== "file") valoresOriginales[campo.id] = campo.value;
        });
        bloquearCampos(false);
        botonEditar.textContent = "Guardar cambios";
        botonCancelar.hidden = false;
        nota.textContent = "Estás editando la información de la empresa.";
        document.getElementById("razon_social").focus();
    }

    function terminarEdicion() {
        bloquearCampos(true);
        botonEditar.textContent = "Editar empresa";
        botonCancelar.hidden = true;
    }

    // Al cargar, todo bloqueado
    bloquearCampos(true);

    // El botón es type="submit": se intercepta para que no recargue ni cambie de página
    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        // Primer clic: pasa a modo edición
        if (!formulario.classList.contains("modo-edicion")) {
            iniciarEdicion();
            return;
        }

        // Segundo clic: valida y guarda
        if (!formulario.reportValidity()) return;

        // Actualiza el nombre de la tarjeta superior
        document.querySelector("#tarjeta-info-principal h2").textContent =
            document.getElementById("razon_social").value;

        terminarEdicion();
        nota.textContent = "Cambios guardados.";
        setTimeout(function () { nota.textContent = textoNota; }, 3000);

        // Aquí iría el envío al servidor (fetch) cuando exista el backend
    });

    // Cancelar: restaura lo que había antes de editar
    botonCancelar.addEventListener("click", function () {
        campos.forEach(function (campo) {
            if (campo.type === "file") {
                campo.value = "";
            } else if (campo.id !== "departamento" && campo.id !== "ciudad" && campo.id in valoresOriginales) {
                campo.value = valoresOriginales[campo.id];
            }
        });

        const selectDepartamento = document.getElementById("departamento");
        const selectCiudad = document.getElementById("ciudad");
        if (selectDepartamento && selectCiudad) {
            selectDepartamento.value = valoresOriginales.departamento || "";
            selectDepartamento.dispatchEvent(new Event("change", { bubbles: true }));
            selectCiudad.value = valoresOriginales.ciudad || "";
        }

        ["numero_identificacion", "dv", "clasificacion_minimo_cop", "clasificacion_maximo_cop"].forEach(function (id) {
            const campo = document.getElementById(id);
            if (campo) campo.dispatchEvent(new Event("input", { bubbles: true }));
        });
        const tipoIdentificacion = document.getElementById("tipo_identificacion");
        if (tipoIdentificacion) tipoIdentificacion.dispatchEvent(new Event("change", { bubbles: true }));

        if (textoImagenBalance) {
            textoImagenBalance.textContent = "Haz clic aquí para seleccionar una imagen (PNG, JPG o WEBP)";
        }
        terminarEdicion();
        nota.textContent = textoNota;
    });

    const inputImagenBalance = document.getElementById("imagen_balance_general");
    const textoImagenBalance = document.getElementById("texto-imagen-balance");
    if (inputImagenBalance && textoImagenBalance) {
        inputImagenBalance.addEventListener("change", function () {
            const archivo = this.files && this.files[0];
            textoImagenBalance.textContent = archivo
                ? `Imagen seleccionada: ${archivo.name}`
                : "Haz clic aquí para seleccionar una imagen (PNG, JPG o WEBP)";
        });
    }
});