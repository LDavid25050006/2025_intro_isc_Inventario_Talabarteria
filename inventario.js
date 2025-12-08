let nombre="David";
console.log(`Bienvenido ${nombre}`);

// Variables globales
let inventario = [];
let modoEdicion = false;
let idEditando = null;
let bitacora = [];
let itemMovimientoActual = null;
let filtroActual = 'todos';

// Referencias al DOM
const form = document.getElementById('item-form');
const nombreInput = document.getElementById('nombre');
const cantidadInput = document.getElementById('cantidad');
const precioInput = document.getElementById('precio');
const categoriaInput = document.getElementById('categoria');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tableBody = document.getElementById('table-body');
const inventoryTable = document.getElementById('inventory-table');
const emptyMessage = document.getElementById('empty-message');

// Referencias para bitácora
const bitacoraBody = document.getElementById('bitacora-body');
const bitacoraList = document.getElementById('bitacora-list');
const bitacoraEmpty = document.getElementById('bitacora-empty');

// Referencias para modal de movimientos
const movementModal = document.getElementById('movement-modal');
const movementForm = document.getElementById('movement-form');
const tipoMovimientoInput = document.getElementById('tipo-movimiento');
const cantidadMovimientoInput = document.getElementById('cantidad-movimiento');
const usuarioMovimientoInput = document.getElementById('usuario-movimiento');
const notasMovimientoInput = document.getElementById('notas-movimiento');
const closeModalBtn = document.getElementById('close-modal');
const cancelMovementBtn = document.getElementById('cancel-movement');

// Botones de filtro
const filterAllBtn = document.getElementById('filter-all');
const filterEntradaBtn = document.getElementById('filter-entrada');
const filterSalidaBtn = document.getElementById('filter-salida');
const clearBitacoraBtn = document.getElementById('clear-bitacora');

/**
 * Cargar inventario desde localStorage al iniciar
 */
function cargarInventario() {
    const datosGuardados = localStorage.getItem('inventario');
    if (datosGuardados) {
        try {
            inventario = JSON.parse(datosGuardados);
            renderItems();
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            inventario = [];
        }
    }

    const bitacoraGuardada = localStorage.getItem('bitacora');
    if (bitacoraGuardada) {
        try {
            bitacora = JSON.parse(bitacoraGuardada);
            renderBitacora();
        } catch (error) {
            console.error('Error al cargar bitácora:', error);
            bitacora = [];
        }
    }
}

/**
 * Guardar inventario en localStorage
 */
function guardarInventario() {
    try {
        localStorage.setItem('inventario', JSON.stringify(inventario));
        localStorage.setItem('bitacora', JSON.stringify(bitacora));
    } catch (error) {
        console.error('Error al guardar inventario:', error);
        alert('No se pudo guardar el inventario');
    }
}

/**
 * Renderizar todos los items en la tabla
 */
function renderItems() {
    tableBody.innerHTML = '';

    if (inventario.length === 0) {
        inventoryTable.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    inventoryTable.style.display = 'table';
    emptyMessage.style.display = 'none';

    inventario.forEach((item) => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td><strong>${escapeHtml(item.nombre)}</strong></td>
            <td>${item.cantidad}</td>
            <td>${formatearPrecio(item.precio)}</td>
            <td><span class="category-badge">${escapeHtml(item.categoria || 'Sin categoría')}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editItem(${item.id})">Editar</button>
                    <button class="btn btn-delete" onclick="deleteItem(${item.id})">Eliminar</button>
                </div>
            </td>
        `;

        tableBody.appendChild(fila);
    });
}

/**
 * Formatear precio con separadores de miles y decimales
 */
function formatearPrecio(precio) {
    if (precio === undefined || precio === null || isNaN(precio)) {
        return '0.00';
    }
    return parseFloat(precio).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Registrar movimiento en la bitácora
 */
function registrarMovimiento(tipo, item, cantidad, usuario, notas) {
    const fecha = new Date();
    bitacora.unshift({
        id: Date.now(),
        tipo, // 'entrada', 'salida', 'agregado', 'editado', 'eliminado'
        nombre: item.nombre,
        cantidad: cantidad || item.cantidad,
        precio: item.precio,
        categoria: item.categoria,
        usuario: usuario || 'Sistema',
        notas: notas || '',
        fecha: fecha.toLocaleDateString('es-MX'),
        hora: fecha.toLocaleTimeString('es-MX'),
        timestamp: fecha.getTime()
    });
    console.log('Movimiento registrado:', tipo, item.nombre);
    renderBitacora();
    guardarInventario();
}

/**
 * Manejar envío del formulario
 */
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const nombre = nombreInput.value.trim();
    const cantidad = parseInt(cantidadInput.value);
    const precio = parseFloat(precioInput.value);
    const categoria = categoriaInput.value;

    // Validaciones
    if (!nombre) {
        alert('Por favor ingresa un nombre para el ítem');
        return;
    }

    if (isNaN(cantidad) || cantidad < 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
    }

    if (isNaN(precio) || precio < 0) {
        alert('Por favor ingresa un precio válido');
        return;
    }

    if (modoEdicion) {
        updateItem(idEditando, nombre, cantidad, precio, categoria);
    } else {
        agregarItem(nombre, cantidad, precio, categoria);
    }
});

/**
 * Agregar nuevo item al inventario
 */
function agregarItem(nombre, cantidad, precio, categoria) {
    const nuevoItem = {
        id: Date.now(),
        nombre,
        cantidad,
        precio,
        categoria
    };

    inventario.push(nuevoItem);
    registrarMovimiento('agregado', nuevoItem);
    guardarInventario();
    renderItems();
    form.reset();

    console.log('Item agregado:', nuevoItem);
}

/**
 * Eliminar item del inventario
 */
window.deleteItem = function(id) {
    const item = inventario.find(i => i.id === id);

    if (!item) {
        alert('Item no encontrado');
        return;
    }

    if (!confirm(`¿Estás seguro de eliminar "${item.nombre}"?`)) {
        return;
    }

    registrarMovimiento('eliminado', item);
    inventario = inventario.filter(item => item.id !== id);
    guardarInventario();
    renderItems();

    console.log('Item eliminado:', item.nombre);
};

/**
 * Actualizar item existente
 */
function updateItem(id, nombre, cantidad, precio, categoria) {
    const index = inventario.findIndex(i => i.id === id);

    if (index === -1) {
        alert('Item no encontrado');
        return;
    }

    const itemAnterior = {...inventario[index]};
    inventario[index] = { id, nombre, cantidad, precio, categoria };

    registrarMovimiento('editado', inventario[index]);
    guardarInventario();
    renderItems();

    // Resetear modo edición
    modoEdicion = false;
    idEditando = null;
    submitBtn.innerHTML = `
        <svg class="icon-plus" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Agregar Ítem
    `;
    cancelBtn.style.display = 'none';
    form.reset();

    console.log('Item actualizado:', itemAnterior.nombre, '->', nombre);
}

/**
 * Preparar formulario para editar item
 */
window.editItem = function(id) {
    const item = inventario.find(i => i.id === id);

    if (!item) {
        alert('Item no encontrado');
        return;
    }

    // Llenar formulario con datos del item
    nombreInput.value = item.nombre;
    cantidadInput.value = item.cantidad;
    precioInput.value = item.precio || 0;
    categoriaInput.value = item.categoria || '';

    // Activar modo edición
    modoEdicion = true;
    idEditando = id;
    submitBtn.textContent = 'Actualizar Ítem';
    cancelBtn.style.display = 'block';

    // Scroll al formulario en dispositivos móviles
    if (window.innerWidth < 968) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    console.log('Editando item:', item.nombre);
};

/**
 * Cancelar edición
 */
cancelBtn.addEventListener('click', () => {
    modoEdicion = false;
    idEditando = null;
    submitBtn.innerHTML = `
        <svg class="icon-plus" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Agregar Ítem
    `;
    cancelBtn.style.display = 'none';
    form.reset();

    console.log('Edición cancelada');
});

/**
 * Exportar bitácora (función útil para debugging)
 */
function exportarBitacora() {
    console.table(bitacora);
    return bitacora;
}

/**
 * Limpiar todo el inventario (función útil para debugging)
 */
function limpiarInventario() {
    if (confirm('¿Estás seguro de eliminar TODO el inventario? Esta acción no se puede deshacer.')) {
        inventario = [];
        bitacora = [];
        guardarInventario();
        renderItems();
        renderBitacora();
        console.log('Inventario limpiado');
    }
}

/**
 * Renderizar bitácora de movimientos
 */
function renderBitacora() {
    bitacoraBody.innerHTML = '';

    let movimientosFiltrados = bitacora;

    // Aplicar filtro
    if (filtroActual === 'entrada') {
        movimientosFiltrados = bitacora.filter(m => m.tipo === 'entrada');
    } else if (filtroActual === 'salida') {
        movimientosFiltrados = bitacora.filter(m => m.tipo === 'salida');
    }

    if (movimientosFiltrados.length === 0) {
        bitacoraList.style.display = 'none';
        bitacoraEmpty.style.display = 'block';
        return;
    }

    bitacoraList.style.display = 'block';
    bitacoraEmpty.style.display = 'none';

    movimientosFiltrados.forEach(movimiento => {
        const fila = document.createElement('tr');

        let badgeClass = 'movement-badge ';
        switch(movimiento.tipo) {
            case 'entrada': badgeClass += 'movement-entrada'; break;
            case 'salida': badgeClass += 'movement-salida'; break;
            case 'agregado': badgeClass += 'movement-agregado'; break;
            case 'editado': badgeClass += 'movement-editado'; break;
            case 'eliminado': badgeClass += 'movement-eliminado'; break;
        }

        const tipoTexto = movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1);

        fila.innerHTML = `
            <td>
                <div style="font-size: 0.85rem;">${movimiento.fecha}</div>
                <div style="font-size: 0.75rem; color: #718096;">${movimiento.hora}</div>
            </td>
            <td><span class="${badgeClass}">${tipoTexto}</span></td>
            <td><strong>${escapeHtml(movimiento.nombre)}</strong></td>
            <td>${movimiento.cantidad}</td>
            <td>${escapeHtml(movimiento.usuario)}</td>
        `;

        // Agregar tooltip con notas si existen
        if (movimiento.notas) {
            fila.title = `Notas: ${movimiento.notas}`;
        }

        bitacoraBody.appendChild(fila);
    });
}

/**
 * Abrir modal para registrar entrada/salida
 */
window.openMovementModal = function(id) {
    const item = inventario.find(i => i.id === id);
    if (!item) {
        alert('Item no encontrado');
        return;
    }

    itemMovimientoActual = item;
    document.getElementById('modal-title').textContent = `Movimiento: ${item.nombre}`;
    movementModal.classList.add('active');
    movementForm.reset();
};

/**
 * Cerrar modal de movimientos
 */
function closeMovementModal() {
    movementModal.classList.remove('active');
    itemMovimientoActual = null;
    movementForm.reset();
}

// Event listeners para modal
closeModalBtn.addEventListener('click', closeMovementModal);
cancelMovementBtn.addEventListener('click', closeMovementModal);

// Cerrar modal al hacer click fuera
movementModal.addEventListener('click', (e) => {
    if (e.target === movementModal) {
        closeMovementModal();
    }
});

/**
 * Manejar envío de formulario de movimientos
 */
movementForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (!itemMovimientoActual) return;

    const tipo = tipoMovimientoInput.value;
    const cantidad = parseInt(cantidadMovimientoInput.value);
    const usuario = usuarioMovimientoInput.value.trim() || 'Usuario';
    const notas = notasMovimientoInput.value.trim();

    if (!tipo || isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor completa los datos correctamente');
        return;
    }

    // Encontrar el item en el inventario
    const index = inventario.findIndex(i => i.id === itemMovimientoActual.id);
    if (index === -1) {
        alert('Item no encontrado');
        return;
    }

    // Actualizar cantidad según el tipo de movimiento
    if (tipo === 'entrada') {
        inventario[index].cantidad += cantidad;
    } else if (tipo === 'salida') {
        if (inventario[index].cantidad < cantidad) {
            alert(`No hay suficiente stock. Disponible: ${inventario[index].cantidad}`);
            return;
        }
        inventario[index].cantidad -= cantidad;
    }

    // Registrar en bitácora
    registrarMovimiento(tipo, inventario[index], cantidad, usuario, notas);

    // Actualizar vista
    guardarInventario();
    renderItems();
    closeMovementModal();

    console.log(`${tipo} registrada:`, cantidad, 'unidades de', itemMovimientoActual.nombre);
});

// Event listeners para filtros de bitácora
filterAllBtn.addEventListener('click', () => {
    filtroActual = 'todos';
    actualizarBotonesFiltro();
    renderBitacora();
});

filterEntradaBtn.addEventListener('click', () => {
    filtroActual = 'entrada';
    actualizarBotonesFiltro();
    renderBitacora();
});

filterSalidaBtn.addEventListener('click', () => {
    filtroActual = 'salida';
    actualizarBotonesFiltro();
    renderBitacora();
});

clearBitacoraBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de limpiar toda la bitácora? Esta acción no se puede deshacer.')) {
        bitacora = [];
        guardarInventario();
        renderBitacora();
        console.log('Bitácora limpiada');
    }
});

/**
 * Actualizar estado visual de botones de filtro
 */
function actualizarBotonesFiltro() {
    filterAllBtn.classList.remove('active');
    filterEntradaBtn.classList.remove('active');
    filterSalidaBtn.classList.remove('active');

    if (filtroActual === 'todos') {
        filterAllBtn.classList.add('active');
    } else if (filtroActual === 'entrada') {
        filterEntradaBtn.classList.add('active');
    } else if (filtroActual === 'salida') {
        filterSalidaBtn.classList.add('active');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema de Inventario iniciado');
    cargarInventario();
    actualizarBotonesFiltro();

    // Exponer funciones útiles para debugging en la consola
    window.inventarioDebug = {
        exportarBitacora,
        limpiarInventario,
        verInventario: () => console.table(inventario),
        verBitacora: () => console.table(bitacora)
    };
});