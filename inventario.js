let nombre="David";
console.log(`Bienvenido ${nombre}`);

 // Array para almacenar los items
let inventario= [];
let modoEdicion = false;
let idEditando = null;
let bitacora = [];

//Referencias a elementos del DOM
const form = document.getElementById('item-form');
const nombreInput = document.getElementById('nombre');
const cantidadInput = document.getElementById('cantidad');
const precioInput = document.getElementById('precio');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tableBody = document.getElementById('table-body');
const inventoryTable = document.getElementById('inventory-table');
const emptyMessage = document.getElementById('empty-message');

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
            <td>${item.nombre}</td>
            <td>${item.cantidad}</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>
                <button onclick="editItem(${item.id})">Editar</button>
                <button onclick="deleteItem(${item.id})">Eliminar</button>
            </td>
        `;

        tableBody.appendChild(fila);
    });
}

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nombre = nombreInput.value.trim();
    const cantidad = parseInt(cantidadInput.value);
    const precio = parseFloat(precioInput.value);

    if (!nombre || isNaN(cantidad) || isNaN(precio)) {
        alert('Por favor completa los datos correctamente');
        return;
    }

    if (modoEdicion) {
        updateItem(idEditando, nombre, cantidad, precio);
        registrarMovimiento('editado',{nombre, cantidad, precio});
    } else {
        const nuevoItem = {
            id: Date.now(),
            nombre,
            cantidad,
            precio
        };
        inventario.push(nuevoItem);
        registrarMovimiento('agregado', nuevoItem);
        renderItems();
        form.reset();
    }
});

function deleteItem(id) {
    const itemEliminado = inventario.find(i => i.id === id);
    if (itemEliminado) {
        registrarMovimiento('eliminado', itemEliminado);
    }
    const confirmar = confirm('¿Estas seguro de eliminar este item?');
    if (!confirmar) return;

    inventario = inventario.filter(item => item.id !== id);
    renderItems();
}

function updateItem(id, nombre, cantidad, precio) {
    const index = inventario.findIndex(i => i.id === id);
    if (index === -1) return;

    inventario[index] = {id, nombre, cantidad, precio};

    modoEdicion = false;
    idEditando = null;
    submitBtn.textContent = 'Agregar';
    cancelBtn.style.display = 'none';
    form.reset();
    renderItems();
}

function editItem(id) {
    const item = inventario.find(i => i.id === id);
    if (!item) return;

    nombreInput.value = item.nombre;
    cantidadInput.value = item.cantidad;
    precioInput.value = item.precio;

    modoEdicion = true;
    idEditando = id;
    submitBtn.textContent = 'Actualizar';
    cancelBtn.style.display = 'inline';
}

cancelBtn.addEventListener('click', () => {
    modoEdicion = false;
    idEditando = null;
    submitBtn.textContent = 'Agregar';
    cancelBtn.style.display = 'none';
    form.reset();
});

function registrarMovimiento(tipo, item) {
    const fecha = new Date();
    bitacora.push({
        tipo, //'agregado', 'editado', 'eliminado'
        nombre: item.nombre,
        cantidad: item.cantidad,
        fecha: fecha.toLocalDateString('es-MX'),
        hora: fecha.toLocalTimeString('es-MX'),
        mes: fecha.getMonth() + 1,
        año: fecha.getFullYear()
    });
}