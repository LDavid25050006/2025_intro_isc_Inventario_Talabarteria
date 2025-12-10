// Keys
const PRODUCTS_KEY = 'inventario_products_v1';
const LOG_KEY = 'inventario_log_v1';

// Helpers localStorage
function load(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }
function save(key, data){ localStorage.setItem(key, JSON.stringify(data)); }

// Inicializar
let products = load(PRODUCTS_KEY);
let log = load(LOG_KEY);

// DOM
const form = document.getElementById('product-form');
const tbody = document.querySelector('#products-table tbody');
const logTableBody = document.querySelector('#log-table tbody');
const monthInput = document.getElementById('log-month');

function renderProducts(){
    tbody.innerHTML = '';
    products.forEach(p=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.name}</td><td>${p.quantity}</td><td>${p.price.toFixed(2)}</td>
      <td>
        <button data-id="${p.id}" class="edit">Editar</button>
        <button data-id="${p.id}" class="delete">Eliminar</button>
        <button data-id="${p.id}" class="in">Entrada</button>
        <button data-id="${p.id}" class="out">Salida</button>
      </td>`;
        tbody.appendChild(tr);
    });
}

function addLog(productName, type, qty){
    log.push({date:new Date().toISOString(), product:productName, type, qty});
    save(LOG_KEY, log);
}

form.addEventListener('submit', e=>{
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('name').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value,10);
    const price = parseFloat(document.getElementById('price').value);

    if(id){
        const p = products.find(x=>x.id===id);
        p.name = name; p.quantity = quantity; p.price = price;
    } else {
        products.push({id:Date.now().toString(), name, quantity, price});
    }
    save(PRODUCTS_KEY, products);
    renderProducts();
    form.reset();
    document.getElementById('product-id').value = '';
});

tbody.addEventListener('click', e=>{
    const id = e.target.dataset.id;
    if(e.target.classList.contains('edit')){
        const p = products.find(x=>x.id===id);
        document.getElementById('product-id').value = p.id;
        document.getElementById('name').value = p.name;
        document.getElementById('quantity').value = p.quantity;
        document.getElementById('price').value = p.price;
    } else if(e.target.classList.contains('delete')){
        products = products.filter(x=>x.id!==id);
        save(PRODUCTS_KEY, products);
        renderProducts();
    } else if(e.target.classList.contains('in') || e.target.classList.contains('out')){
        const p = products.find(x=>x.id===id);
        const qty = parseInt(prompt('Cantidad:'),10);
        if(!isNaN(qty)){
            if(e.target.classList.contains('in')){ p.quantity += qty; addLog(p.name,'entrada',qty); }
            else { p.quantity = Math.max(0, p.quantity - qty); addLog(p.name,'salida',qty); }
            save(PRODUCTS_KEY, products);
            renderProducts();
        }
    }
});

document.getElementById('show-log').addEventListener('click', ()=>{
    const month = monthInput.value; // format YYYY-MM
    logTableBody.innerHTML = '';
    const filtered = month ? log.filter(item => item.date.startsWith(month)) : log;
    filtered.forEach(l=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${new Date(l.date).toLocaleString()}</td><td>${l.product}</td><td>${l.type}</td><td>${l.qty}</td>`;
        logTableBody.appendChild(tr);
    });
});

// Inicial
renderProducts();
