// ==========================================================
// DETECCIÓN DE PÁGINA
// ==========================================================
const ES_BASICO = !!document.getElementById('chkMotogrua');
const ES_CORPORATIVO = !!document.getElementById('inputTipoServicio');

// ==========================================================
// ZONA DE CONFIGURACIÓN — EDITAR AQUÍ LOS VALORES Y PORCENTAJES
// ==========================================================
const PRECIO_HORA = 10000;
const PRECIO_KILOMETRO = 1500;

// --- Básico ---
const TARIFA_MINIMA = 30000;
const KM_UMBRAL_EXTENDIDO = 50;

// --- Corporativo ---
const BANDERAZO_CORPORATIVO = 200000;
const HORAS_INCLUIDAS = 8;
const KM_INCLUIDOS = 50;
const CORTESIA_NODO_MINUTOS = 15;

// Porcentajes de recargo (en formato decimal: 0.35 = 35%)
const PORCENTAJE_NOCTURNO   = 0.35;
const PORCENTAJE_FINDESEMANA = 0.50;
const PORCENTAJE_FORANEO    = 0.25;
const PORCENTAJE_FORANEO_EXTENDIDO = 0.50;
const PORCENTAJE_RETORNO    = 0.50;  // Solo Básico

// Lista de clientes
const LISTA_CLIENTES = [
    "Powerbike Scooter",
    "Didi Cargo",
    "Lubricentro Hamilton",
    "Metalicas Galvis",
    "Clinica Veterinaria Mr Bigotes"
];

const LISTA_CONDUCTORES = [
    "Conductor 01",
    "Conductor 02",
    "Conductor 03"
];
const LISTA_MOVILES = [
    "Movil 01",
    "Movil 02",
    "Movil 03"
];

const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbwF3QmFNIpFsRT7-Hs8gLEWfunBMDHwzuafTpuPKrf25WTp8_q-4ixUrgMQSHgydSJ9/exec";
// ==========================================================

const formateador = new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
});

let datosActuales = {};

// ==========================================================
// FUNCIONES COMPARTIDAS
// ==========================================================

function capturarAhora(id) {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset() * 60000;
    const localISO = (new Date(ahora - offset)).toISOString().slice(0, 16);
    document.getElementById(id).value = localISO;
    calcularTodo();
}

function formatearMoneda(el) {
    const soloDigitos = el.value.replace(/[^\d]/g, '');
    if (soloDigitos === '') {
        el.value = '';
        return;
    }
    el.value = formateador.format(parseInt(soloDigitos, 10));
}

function limpiarMoneda(valor) {
    const soloDigitos = String(valor).replace(/[^\d]/g, '');
    return soloDigitos === '' ? 0 : parseInt(soloDigitos, 10);
}

function formatoHoraMin(horasDecimal) {
    const totalMinutos = Math.round(horasDecimal * 60);
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    return h + "h " + m.toString().padStart(2, '0') + "m";
}

function formatoFechaLarga(valor) {
    if (!valor) return '---';
    const fecha = new Date(valor);
    if (isNaN(fecha)) return '---';
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = meses[fecha.getMonth()];
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return diaSemana + ' ' + dia + ' ' + mes + ' ' + horas + ':' + minutos;
}

// ==========================================================
// GESTIÓN DE LISTAS DESPLEGABLES
// ==========================================================

function poblarListaClientes() {
    const select = document.getElementById('selectCliente');
    LISTA_CLIENTES.forEach(nombre => {
        const opcion = document.createElement('option');
        opcion.value = nombre;
        opcion.textContent = nombre;
        select.appendChild(opcion);
    });
    const opcionOtro = document.createElement('option');
    opcionOtro.value = '__otro__';
    opcionOtro.textContent = 'Otro (escribir)';
    select.appendChild(opcionOtro);
}

function manejarSelectCliente() {
    const esOtro = document.getElementById('selectCliente').value === '__otro__';
    document.getElementById('grupoClienteOtro').style.display = esOtro ? 'flex' : 'none';
    if (!esOtro) {
        document.getElementById('inputClienteOtro').value = '';
    }
    calcularTodo();
}

function poblarListaConductores() {
    const select = document.getElementById('selectConductor');
    LISTA_CONDUCTORES.forEach(nombre => {
        const opcion = document.createElement('option');
        opcion.value = nombre;
        opcion.textContent = nombre;
        select.appendChild(opcion);
    });
    const opcionOtro = document.createElement('option');
    opcionOtro.value = '__otro__';
    opcionOtro.textContent = 'Otro (escribir)';
    select.appendChild(opcionOtro);
}

function manejarSelectConductor() {
    const esOtro = document.getElementById('selectConductor').value === '__otro__';
    document.getElementById('grupoConductorOtro').style.display = esOtro ? 'flex' : 'none';
    if (!esOtro) {
        document.getElementById('inputConductorOtro').value = '';
    }
    calcularTodo();
}

function poblarListaMoviles() {
    const select = document.getElementById('selectMovil');
    LISTA_MOVILES.forEach(nombre => {
        const opcion = document.createElement('option');
        opcion.value = nombre;
        opcion.textContent = nombre;
        select.appendChild(opcion);
    });
    const opcionOtro = document.createElement('option');
    opcionOtro.value = '__otro__';
    opcionOtro.textContent = 'Otro (escribir)';
    select.appendChild(opcionOtro);
}

function manejarSelectMovil() {
    const esOtro = document.getElementById('selectMovil').value === '__otro__';
    document.getElementById('grupoMovilOtro').style.display = esOtro ? 'flex' : 'none';
    if (!esOtro) {
        document.getElementById('inputMovilOtro').value = '';
    }
    calcularTodo();
}

function inicializarEtiquetas() {
    document.getElementById('lblNocturno').textContent =
        "Recargo nocturno (" + (PORCENTAJE_NOCTURNO * 100) + "%)";
    document.getElementById('lblFinSemana').textContent =
        "Domingo o Festivo (" + (PORCENTAJE_FINDESEMANA * 100) + "%)";
    document.getElementById('lblForaneo').textContent =
        "Foráneo (" + (PORCENTAJE_FORANEO * 100) + "%)";
    document.getElementById('lblForaneoExtendido').textContent =
        "Recorrido extendido (" + (PORCENTAJE_FORANEO_EXTENDIDO * 100) + "%)";

    document.getElementById('lblNocturnoRecibo').textContent =
        "Recargo nocturno (" + (PORCENTAJE_NOCTURNO * 100) + "%):";
    document.getElementById('lblFinSemanaRecibo').textContent =
        "Domingo o Festivo (" + (PORCENTAJE_FINDESEMANA * 100) + "%):";
    document.getElementById('lblForaneoRecibo').textContent =
        "Foráneo (" + (PORCENTAJE_FORANEO * 100) + "%):";
    document.getElementById('lblForaneoExtendidoRecibo').textContent =
        "Recorrido extendido (" + (PORCENTAJE_FORANEO_EXTENDIDO * 100) + "%):";

    if (ES_BASICO) {
        document.getElementById('lblRetorno').textContent =
            "Retorno (" + (PORCENTAJE_RETORNO * 100) + "%)";
        document.getElementById('lblRetornoRecibo').textContent =
            "Retorno (" + (PORCENTAJE_RETORNO * 100) + "%):";
    }
}

// ==========================================================
// FUNCIONES COMPARTIDAS: descarga y guardado
// ==========================================================

function descargarReporte() {
    const area = document.getElementById('captura-recibo');
    const ANCHO_CAPTURA = 720;

    html2canvas(area, {
        backgroundColor: '#eeeeee',
        scale: 2,
        windowWidth: ANCHO_CAPTURA,
        width: ANCHO_CAPTURA
    }).then(canvasRecibo => {
        const link = document.createElement('a');
        link.download = 'Recibo.png';
        link.href = canvasRecibo.toDataURL("image/png");
        link.click();
    });
}

function guardarEnGoogleSheets() {
    const boton = document.getElementById('btnGuardarSheet');
    const contenidoOriginal = boton.innerHTML;

    if (!URL_GOOGLE_SHEETS || URL_GOOGLE_SHEETS.includes('PEGA_AQUI')) {
        alert('Falta configurar la URL de Google Sheets.\n\nBusca "URL_GOOGLE_SHEETS" en el código y pega ahí la URL que te dio Google al publicar el Apps Script.');
        return;
    }

    boton.disabled = true;
    boton.innerHTML = '<span>&#9203;</span>Guardando...';

    fetch(URL_GOOGLE_SHEETS, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(datosActuales)
    }).then(() => {
        boton.innerHTML = '<span>&#10004;</span>Guardado';
    }).catch(() => {
        boton.innerHTML = '<span>&#10060;</span>Error de conexi\u00f3n';
    }).finally(() => {
        setTimeout(() => {
            boton.innerHTML = contenidoOriginal;
            boton.disabled = false;
        }, 2000);
    });
}

// ==========================================================
// LÓGICA ESPECÍFICA: SERVICIO BÁSICO
// ==========================================================

if (ES_BASICO) {

    function calcularTodo() {
        const valIni = document.getElementById('inputInicio').value;
        const valFin = document.getElementById('inputFinal').value;

        const serviciosMarcados = [];
        if (document.getElementById('chkMotogrua').checked) serviciosMarcados.push('Motogr\u00faa');
        if (document.getElementById('chkJumpStarter').checked) serviciosMarcados.push('Jump Starter');
        if (document.getElementById('chkCargaLigera').checked) serviciosMarcados.push('Carga Ligera');
        const textoServicios = serviciosMarcados.length ? serviciosMarcados.join(' + ') : '---';
        document.getElementById('dispTipoServicio').textContent = textoServicios;

        const selectCliente = document.getElementById('selectCliente').value;
        const clienteFinal = selectCliente === '__otro__'
            ? document.getElementById('inputClienteOtro').value.trim()
            : selectCliente;

        const selectConductor = document.getElementById('selectConductor').value;
        const conductorFinal = selectConductor === '__otro__'
            ? document.getElementById('inputConductorOtro').value.trim()
            : selectConductor;

        const selectMovil = document.getElementById('selectMovil').value;
        const movilFinal = selectMovil === '__otro__'
            ? document.getElementById('inputMovilOtro').value.trim()
            : selectMovil;

        const ini = new Date(valIni);
        const fin = new Date(valFin);

        let horas = 0;
        if (!isNaN(ini) && !isNaN(fin) && fin > ini) {
            horas = (fin - ini) / (1000 * 60 * 60);
        }

        document.getElementById('resHoras').value = formatoHoraMin(horas);
        document.getElementById('dispDuracion').value = formatoHoraMin(horas);

        const subTiempo = horas * PRECIO_HORA;
        const kms = parseFloat(document.getElementById('kmRecorridos').value) || 0;
        const subKm = kms * PRECIO_KILOMETRO;
        const subtotalReal = subTiempo + subKm;

        const ajusteMinimo = subtotalReal < TARIFA_MINIMA ? (TARIFA_MINIMA - subtotalReal) : 0;
        const subtotalBase = subtotalReal + ajusteMinimo;

        document.getElementById('valAjusteMinimo').value = formateador.format(ajusteMinimo);

        const recargos = limpiarMoneda(document.getElementById('inputRecargos').value);
        const concepto = document.getElementById('inputConcepto').value.trim();

        const chkNocturno = document.getElementById('chkNocturno').checked;
        const chkFinSemana = document.getElementById('chkFinSemana').checked;
        const chkForaneo = document.getElementById('chkForaneo').checked;
        const aplicaForaneoExtendido = kms > KM_UMBRAL_EXTENDIDO;
        const chkRetorno = document.getElementById('chkRetorno').checked;
        const montoDescuento = limpiarMoneda(document.getElementById('inputDescuento').value);

        const montoNocturno = chkNocturno ? subtotalBase * PORCENTAJE_NOCTURNO : 0;
        const montoFinSemana = chkFinSemana ? subtotalBase * PORCENTAJE_FINDESEMANA : 0;
        const montoForaneo = chkForaneo ? subtotalBase * PORCENTAJE_FORANEO : 0;
        const montoForaneoExtendido = aplicaForaneoExtendido ? subtotalBase * PORCENTAJE_FORANEO_EXTENDIDO : 0;
        const montoRetorno = chkRetorno ? subtotalBase * PORCENTAJE_RETORNO : 0;

        document.getElementById('valNocturno').value = formateador.format(montoNocturno);
        document.getElementById('valFinSemana').value = formateador.format(montoFinSemana);
        document.getElementById('valForaneo').value = formateador.format(montoForaneo);
        document.getElementById('valForaneoExtendido').value = formateador.format(montoForaneoExtendido);
        document.getElementById('valRetorno').value = formateador.format(montoRetorno);

        const totalCobro = subtotalBase + recargos + montoNocturno + montoFinSemana + montoForaneo + montoForaneoExtendido + montoRetorno - montoDescuento;
        const montoNequi = limpiarMoneda(document.getElementById('inputNequi').value);
        const montoDaviplata = limpiarMoneda(document.getElementById('inputDaviplata').value);
        const montoBreB = limpiarMoneda(document.getElementById('inputBreB').value);
        const montoEfectivo = limpiarMoneda(document.getElementById('inputEfectivo').value);
        const recibido = montoNequi + montoDaviplata + montoBreB + montoEfectivo;
        document.getElementById('inputRecibido').value = formateador.format(recibido);

        document.getElementById('resCostoTiempo').value = formateador.format(subTiempo);
        document.getElementById('resCostoKm').value = formateador.format(subKm);
        document.getElementById('resRecargos').value = formateador.format(recargos);
        document.getElementById('totalCobro').value = formateador.format(totalCobro);
        document.getElementById('resDiferencia').value = formateador.format(recibido - totalCobro);
        document.getElementById('dispRecibido').value = formateador.format(recibido);

        document.getElementById('resAjusteMinimo').value = formateador.format(ajusteMinimo);
        document.getElementById('filaAjusteMinimo').style.display = ajusteMinimo > 0 ? 'block' : 'none';

        document.getElementById('dispCliente').value = clienteFinal;
        document.getElementById('filaCliente').style.display = clienteFinal ? 'flex' : 'none';

        document.getElementById('dispConductor').value = conductorFinal;
        document.getElementById('filaConductor').style.display = conductorFinal ? 'flex' : 'none';

        document.getElementById('dispMovil').value = movilFinal;
        document.getElementById('filaMovil').style.display = movilFinal ? 'flex' : 'none';

        document.getElementById('dispConcepto').value = concepto;
        document.getElementById('filaConcepto').style.display = concepto ? 'flex' : 'none';

        document.getElementById('resNocturno').value = formateador.format(montoNocturno);
        document.getElementById('filaNocturno').style.display = chkNocturno ? 'flex' : 'none';

        document.getElementById('resFinSemana').value = formateador.format(montoFinSemana);
        document.getElementById('filaFinSemana').style.display = chkFinSemana ? 'flex' : 'none';

        document.getElementById('resForaneo').value = formateador.format(montoForaneo);
        document.getElementById('filaForaneo').style.display = chkForaneo ? 'block' : 'none';

        document.getElementById('resForaneoExtendido').value = formateador.format(montoForaneoExtendido);
        document.getElementById('filaForaneoExtendido').style.display = aplicaForaneoExtendido ? 'block' : 'none';

        document.getElementById('resRetorno').value = formateador.format(montoRetorno);
        document.getElementById('filaRetorno').style.display = chkRetorno ? 'flex' : 'none';

        document.getElementById('resDescuento').value = "-" + formateador.format(montoDescuento);
        document.getElementById('filaDescuento').style.display = montoDescuento > 0 ? 'flex' : 'none';

        document.getElementById('dispInicio').value = formatoFechaLarga(valIni);
        document.getElementById('dispFinal').value = formatoFechaLarga(valFin);
        document.getElementById('dispKm').value = kms.toFixed(1) + " Km";

        datosActuales = {
            inicio: valIni ? valIni.replace('T', ' ') : '',
            final: valFin ? valFin.replace('T', ' ') : '',
            horas: horas.toFixed(2),
            km: kms,
            costoTiempo: Math.round(subTiempo),
            costoKm: Math.round(subKm),
            recargosManual: recargos,
            concepto: concepto,
            nocturno: Math.round(montoNocturno),
            finSemana: Math.round(montoFinSemana),
            foraneo: Math.round(montoForaneo),
            foraneoExtendido: Math.round(montoForaneoExtendido),
            retorno: Math.round(montoRetorno),
            descuento: Math.round(montoDescuento),
            total: Math.round(totalCobro),
            recibido: recibido,
            cambio: Math.round(recibido - totalCobro),
            ajusteMinimo: Math.round(ajusteMinimo),
            tiposServicio: textoServicios,
            nequi: montoNequi,
            daviplata: montoDaviplata,
            breB: montoBreB,
            efectivo: montoEfectivo,
            cliente: clienteFinal,
            formulario: 'basico',
            conductor: conductorFinal,
            movil: movilFinal
        };
    }

    function nuevoServicio() {
        if(confirm("\u00bfLimpiar todo?")) {
            document.getElementById("calcForm").reset();
            document.getElementById('grupoClienteOtro').style.display = 'none';
            document.getElementById('grupoConductorOtro').style.display = 'none';
            document.getElementById('grupoMovilOtro').style.display = 'none';
            calcularTodo();
        }
    }

}

// ==========================================================
// LÓGICA ESPECÍFICA: SERVICIO CORPORATIVO
// ==========================================================

if (ES_CORPORATIVO) {

    let contadorNodos = 0;

    function agregarNodo() {
        contadorNodos++;
        const id = contadorNodos;

        const bloque = document.createElement('fieldset');
        bloque.id = 'nodo-' + id;
        bloque.style.marginTop = '10px';
        bloque.innerHTML = `
            <legend>Nodo ${id}</legend>
            <div class="grid-inputs">
                <div class="input-group">
                    <label>Nombre del Nodo</label>
                    <input type="text" id="nodoNombre-${id}" class="input-libre campo-texto" placeholder="Ej: Bodega Norte" oninput="calcularTodo()">
                </div>
                <div class="input-group">
                    <label>Kilometraje Actual</label>
                    <input type="number" id="nodoKm-${id}" step="0.1" class="input-libre campo-texto" placeholder="0.0" oninput="calcularTodo()">
                </div>
                <div class="input-group">
                    <label>Hora de Llegada</label>
                    <input type="datetime-local" id="nodoLlegada-${id}" class="input-libre campo-tiempo" onchange="calcularTodo()">
                    <button type="button" class="btn-ahora" onclick="capturarAhora('nodoLlegada-${id}')">Llegada a Nodo</button>
                </div>
                <div class="input-group">
                    <label>Hora de Retomar</label>
                    <input type="datetime-local" id="nodoRetomar-${id}" class="input-libre campo-tiempo" onchange="calcularTodo()">
                    <button type="button" class="btn-ahora" onclick="capturarAhora('nodoRetomar-${id}')">Retomar Recorrido</button>
                </div>
                <div class="input-group">
                    <label>Tiempo en Nodo</label>
                    <input type="text" id="nodoTiempo-${id}" class="campo-tiempo" readonly value="0h 00m">
                </div>
                <div class="input-group">
                    <label>Cortes\u00eda / Facturable</label>
                    <input type="text" id="nodoDetalle-${id}" class="campo-tiempo" readonly value="---">
                </div>
            </div>
            <button type="button" class="btn-nuevo" style="margin-top:10px;" onclick="quitarNodo(${id})">Quitar este Nodo</button>
        `;
        document.getElementById('listaNodos').appendChild(bloque);
        calcularTodo();
    }

    function quitarNodo(id) {
        const bloque = document.getElementById('nodo-' + id);
        if (bloque) bloque.remove();
        calcularTodo();
    }

    function calcularTodo() {
        const valIni = document.getElementById('inputInicio').value;
        const valFin = document.getElementById('inputFinal').value;

        const textoServicios = document.getElementById('inputTipoServicio').value.trim() || '---';
        document.getElementById('dispTipoServicio').textContent = textoServicios;

        const selectCliente = document.getElementById('selectCliente').value;
        const clienteFinal = selectCliente === '__otro__'
            ? document.getElementById('inputClienteOtro').value.trim()
            : selectCliente;

        const selectConductor = document.getElementById('selectConductor').value;
        const conductorFinal = selectConductor === '__otro__'
            ? document.getElementById('inputConductorOtro').value.trim()
            : selectConductor;

        const selectMovil = document.getElementById('selectMovil').value;
        const movilFinal = selectMovil === '__otro__'
            ? document.getElementById('inputMovilOtro').value.trim()
            : selectMovil;

        const ini = new Date(valIni);
        const fin = new Date(valFin);

        let horas = 0;
        if (!isNaN(ini) && !isNaN(fin) && fin > ini) {
            horas = (fin - ini) / (1000 * 60 * 60);
        }

        document.getElementById('resHoras').value = formatoHoraMin(horas);

        const cortesiaHorasUnitaria = CORTESIA_NODO_MINUTOS / 60;
        let sumaCortesias = 0;
        const resumenNodos = [];

        document.querySelectorAll('#listaNodos fieldset').forEach(bloque => {
            const id = bloque.id.replace('nodo-', '');
            const nombreNodo = document.getElementById('nodoNombre-' + id).value.trim() || ('Nodo ' + id);
            const kmNodo = document.getElementById('nodoKm-' + id).value;
            const valLlegada = document.getElementById('nodoLlegada-' + id).value;
            const valRetomar = document.getElementById('nodoRetomar-' + id).value;

            const llegada = new Date(valLlegada);
            const retomar = new Date(valRetomar);

            let horasNodo = 0;
            if (!isNaN(llegada) && !isNaN(retomar) && retomar > llegada) {
                horasNodo = (retomar - llegada) / (1000 * 60 * 60);
            }

            const cortesiaNodo = Math.min(cortesiaHorasUnitaria, horasNodo);
            const facturableNodo = Math.max(0, horasNodo - cortesiaHorasUnitaria);
            sumaCortesias += cortesiaNodo;

            document.getElementById('nodoTiempo-' + id).value = formatoHoraMin(horasNodo);
            document.getElementById('nodoDetalle-' + id).value =
                'Cortes\u00eda ' + formatoHoraMin(cortesiaNodo) + ' / Factura ' + formatoHoraMin(facturableNodo);

            resumenNodos.push({
                nombre: nombreNodo,
                km: kmNodo,
                llegada: valLlegada ? valLlegada.replace('T', ' ') : '---',
                llegadaLarga: formatoFechaLarga(valLlegada),
                espera: formatoHoraMin(horasNodo)
            });
        });

        const horasFacturable = Math.max(0, horas - sumaCortesias);
        document.getElementById('resHorasFacturable').value = formatoHoraMin(horasFacturable);

        const kms = parseFloat(document.getElementById('kmRecorridos').value) || 0;

        const horasExtra = Math.max(0, horasFacturable - HORAS_INCLUIDAS);
        const kmExtra = Math.max(0, kms - KM_INCLUIDOS);
        const costoHorasExtra = horasExtra * PRECIO_HORA;
        const costoKmExtra = kmExtra * PRECIO_KILOMETRO;

        document.getElementById('valHorasExtra').value = formateador.format(costoHorasExtra);
        document.getElementById('valKmExtra').value = formateador.format(costoKmExtra);
        document.getElementById('dispHorasExtraCampo').value = formatoHoraMin(horasExtra);
        document.getElementById('dispKmExtraCampo').value = kmExtra.toFixed(1) + ' km';

        const subtotalBase = BANDERAZO_CORPORATIVO + costoHorasExtra + costoKmExtra;

        const recargos = limpiarMoneda(document.getElementById('inputRecargos').value);
        const concepto = document.getElementById('inputConcepto').value.trim();

        const chkNocturno = document.getElementById('chkNocturno').checked;
        const chkFinSemana = document.getElementById('chkFinSemana').checked;
        const chkForaneo = document.getElementById('chkForaneo').checked;
        const aplicaForaneoExtendido = kms > KM_INCLUIDOS;
        const montoDescuento = limpiarMoneda(document.getElementById('inputDescuento').value);

        const montoNocturno = chkNocturno ? subtotalBase * PORCENTAJE_NOCTURNO : 0;
        const montoFinSemana = chkFinSemana ? subtotalBase * PORCENTAJE_FINDESEMANA : 0;
        const montoForaneo = chkForaneo ? subtotalBase * PORCENTAJE_FORANEO : 0;
        const montoForaneoExtendido = aplicaForaneoExtendido ? subtotalBase * PORCENTAJE_FORANEO_EXTENDIDO : 0;

        document.getElementById('valNocturno').value = formateador.format(montoNocturno);
        document.getElementById('valFinSemana').value = formateador.format(montoFinSemana);
        document.getElementById('valForaneo').value = formateador.format(montoForaneo);
        document.getElementById('valForaneoExtendido').value = formateador.format(montoForaneoExtendido);

        const totalCobro = subtotalBase + recargos + montoNocturno + montoFinSemana + montoForaneo + montoForaneoExtendido - montoDescuento;
        const montoNequi = limpiarMoneda(document.getElementById('inputNequi').value);
        const montoDaviplata = limpiarMoneda(document.getElementById('inputDaviplata').value);
        const montoBreB = limpiarMoneda(document.getElementById('inputBreB').value);
        const montoEfectivo = limpiarMoneda(document.getElementById('inputEfectivo').value);
        const recibido = montoNequi + montoDaviplata + montoBreB + montoEfectivo;
        document.getElementById('inputRecibido').value = formateador.format(recibido);

        document.getElementById('resBanderazo').value = formateador.format(BANDERAZO_CORPORATIVO);
        document.getElementById('resRecargos').value = formateador.format(recargos);
        document.getElementById('totalCobro').value = formateador.format(totalCobro);
        document.getElementById('resDiferencia').value = formateador.format(recibido - totalCobro);
        document.getElementById('dispRecibido').value = formateador.format(recibido);
        document.getElementById('dispHorasBruto').value = formatoHoraMin(horas);
        document.getElementById('dispHorasFacturable').value = formatoHoraMin(horasFacturable);

        document.getElementById('resHorasExtra').value = formatoHoraMin(horasExtra) + '  \u2192  ' + formateador.format(costoHorasExtra);
        document.getElementById('filaHorasExtra').style.display = horasExtra > 0 ? 'block' : 'none';

        document.getElementById('resKmExtra').value = kmExtra.toFixed(1) + ' km  \u2192  ' + formateador.format(costoKmExtra);
        document.getElementById('filaKmExtra').style.display = kmExtra > 0 ? 'block' : 'none';

        const contenedorResumen = document.getElementById('listaNodosRecibo');
        contenedorResumen.innerHTML = '';
        resumenNodos.forEach((n, i) => {
            const linea = document.createElement('div');
            linea.style.marginBottom = '4px';
            linea.textContent = (i + 1) + '. ' + n.nombre + ' \u2014 Llegada: ' + n.llegadaLarga + ' \u2014 Espera: ' + n.espera + (n.km ? ' \u2014 Km: ' + n.km : '');
            contenedorResumen.appendChild(linea);
        });
        document.getElementById('resumenNodosRecibo').style.display = resumenNodos.length > 0 ? 'block' : 'none';

        document.getElementById('dispCliente').value = clienteFinal;
        document.getElementById('filaCliente').style.display = clienteFinal ? 'flex' : 'none';

        document.getElementById('dispConductor').value = conductorFinal;
        document.getElementById('filaConductor').style.display = conductorFinal ? 'flex' : 'none';

        document.getElementById('dispMovil').value = movilFinal;
        document.getElementById('filaMovil').style.display = movilFinal ? 'flex' : 'none';

        document.getElementById('dispConcepto').value = concepto;
        document.getElementById('filaConcepto').style.display = concepto ? 'flex' : 'none';

        document.getElementById('resNocturno').value = formateador.format(montoNocturno);
        document.getElementById('filaNocturno').style.display = chkNocturno ? 'flex' : 'none';

        document.getElementById('resFinSemana').value = formateador.format(montoFinSemana);
        document.getElementById('filaFinSemana').style.display = chkFinSemana ? 'flex' : 'none';

        document.getElementById('resForaneo').value = formateador.format(montoForaneo);
        document.getElementById('filaForaneo').style.display = chkForaneo ? 'block' : 'none';

        document.getElementById('resForaneoExtendido').value = formateador.format(montoForaneoExtendido);
        document.getElementById('filaForaneoExtendido').style.display = aplicaForaneoExtendido ? 'block' : 'none';

        document.getElementById('resDescuento').value = "-" + formateador.format(montoDescuento);
        document.getElementById('filaDescuento').style.display = montoDescuento > 0 ? 'flex' : 'none';

        document.getElementById('dispInicio').value = formatoFechaLarga(valIni);
        document.getElementById('dispFinal').value = formatoFechaLarga(valFin);
        document.getElementById('dispKm').value = kms.toFixed(1) + " Km";

        datosActuales = {
            formulario: 'corporativo',
            cliente: clienteFinal,
            conductor: conductorFinal,
            movil: movilFinal,
            inicio: valIni ? valIni.replace('T', ' ') : '',
            final: valFin ? valFin.replace('T', ' ') : '',
            horasBruto: horas.toFixed(2),
            horasFacturable: horasFacturable.toFixed(2),
            km: kms,
            banderazo: BANDERAZO_CORPORATIVO,
            horasExtra: horasExtra.toFixed(2),
            costoHorasExtra: Math.round(costoHorasExtra),
            kmExtra: kmExtra.toFixed(1),
            costoKmExtra: Math.round(costoKmExtra),
            recargosManual: recargos,
            concepto: concepto,
            nocturno: Math.round(montoNocturno),
            finSemana: Math.round(montoFinSemana),
            foraneo: Math.round(montoForaneo),
            foraneoExtendido: Math.round(montoForaneoExtendido),
            descuento: Math.round(montoDescuento),
            total: Math.round(totalCobro),
            nequi: montoNequi,
            daviplata: montoDaviplata,
            breB: montoBreB,
            efectivo: montoEfectivo,
            recibido: recibido,
            cambio: Math.round(recibido - totalCobro),
            tiposServicio: textoServicios,
            cantidadNodos: resumenNodos.length,
            nodos: resumenNodos.map(n => n.nombre + ' (Llegada ' + n.llegada + ', Espera ' + n.espera + (n.km ? ', Km ' + n.km : '') + ')').join(' | ')
        };
    }

    function nuevoServicio() {
        if(confirm("\u00bfLimpiar todo?")) {
            document.getElementById("calcForm").reset();
            document.getElementById('grupoClienteOtro').style.display = 'none';
            document.getElementById('grupoConductorOtro').style.display = 'none';
            document.getElementById('grupoMovilOtro').style.display = 'none';
            document.getElementById('listaNodos').innerHTML = '';
            contadorNodos = 0;
            calcularTodo();
        }
    }

}

// ==========================================================
// INICIALIZACIÓN
// ==========================================================

window.onload = function() {
    poblarListaClientes();
    poblarListaConductores();
    poblarListaMoviles();
    inicializarEtiquetas();
    calcularTodo();
};
