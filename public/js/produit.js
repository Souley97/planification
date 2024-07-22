// Firebase and other necessary imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, deleteDoc, doc, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCo1okr8JtdwYLBlxSV0IUx6yMWulFY-iw",
    authDomain: "test-d6588.firebaseapp.com",
    databaseURL: "https://test-d6588-default-rtdb.firebaseio.com",
    projectId: "test-d6588",
    storageBucket: "test-d6588.appspot.com",
    messagingSenderId: "534968866803",
    appId: "1:534968866803:web:249ad3406892ce76146486",
    measurementId: "G-1GQZ63T3EW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

// Modal
const modal = document.getElementById('addProductModal');
const addProductButton = document.getElementById('addProductButton');
const closeModal = document.querySelector('.close-modal');

addProductButton.addEventListener('click', () => {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
});

// Set the default date to today's date
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('shoppingDate').value = today;
    loadUserProducts(); // Load products for today by default
});

// Date change event to load products for selected date
document.getElementById('shoppingDate').addEventListener('change', loadUserProducts);

// Load products for the logged-in user
async function loadUserProducts() {
    const user = auth.currentUser;
    if (!user) return;

    const selectedDate = document.getElementById('shoppingDate').value;
    const formattedDate = new Date(selectedDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('dateTitle').textContent = formattedDate;

    const q = query(collection(db, 'products'), where('userId', '==', user.uid), where('shoppingDate', '==', selectedDate));
    const querySnapshot = await getDocs(q);
    const tbody = document.querySelector('#productsTable tbody');
    const totalPriceElem = document.getElementById('totalPrice');
    let sommeTotal = 0;

    tbody.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const total = data.productQuantity * data.productPrice;
        sommeTotal += total;
        addProductToTable(doc.id, data.productName, data.productPrice, data.productQuantity, data.shoppingDate, data.bought, total);
    });

    totalPriceElem.innerHTML = `Somme: ${sommeTotal}F CFA`;
}

// Add product to table
function addProductToTable(id, name, price, quantity, date, bought, total) {
    const tbody = document.querySelector('#productsTable tbody');
    const row = document.createElement('tr');

    row.innerHTML = `
        <tr class="max-w-md mx-auto mt-6 bg-white rounded-lg overflow-hidden md:max-w-lg border border-gray-200">
            <td class="flex items-center p-4 bg-white">
                <img class="w-16 h-16 object-cover rounded" src="https://dummyimage.com/100x100/F3F4F7/000000.jpg" alt="Product Image">
                <div class="ml-3 flex-1">
                    <h3 class="text-gray-900 font-semibold">${name}</h3>
                    <p class="text-gray-700 mt-1">Prix: ${price}</p>
                    <p class="text-gray-700 mt-1">Quantité: ${quantity}</p>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-green-600">Total : ${total}</span>
                    <input type="checkbox" class="text-green-600 bg-green-200 rounded" ${bought ? 'checked' : ''} disabled>
                </div>
            </td>
        </tr>
    `;
    tbody.appendChild(row);
}

// Add product form submission
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productName = document.getElementById('productName').value.trim();
    const productPrice = document.getElementById('productPrice').value.trim();
    const productQuantity = document.getElementById('productQuantity').value.trim();
    const shoppingDate = document.getElementById('shoppingDate').value;
    const status = document.getElementById('status').value; // Acheter ou pas
    const user = auth.currentUser;

    const fields = {
        "Nom du produit": productName,
        "Prix du produit": productPrice,
        "Quantité du produit": productQuantity,
    };

    const validationMessage = validateFields(fields);
    if (validationMessage) {
        displayMessage('error', validationMessage);
        return;
    }

    if (!user || !shoppingDate) {
        displayMessage('error', 'Vous devez être connecté et avoir sélectionné une date.');
        return;
    }

    // Détermine si le produit est marqué comme acheté ou non
    const boughtStatus = status === 'acheter';

    await setDoc(doc(db, 'products', `${user.uid}-${shoppingDate}-${productName}`), {
        userId: user.uid,
        productName,
        productPrice,
        productQuantity,
        shoppingDate,
        bought: boughtStatus
    });

    addProductToTable(`${user.uid}-${shoppingDate}-${productName}`, productName, productPrice, productQuantity, shoppingDate, boughtStatus);
    displayMessage('success', 'Produit ajouté avec succès !');
    document.getElementById('productForm').reset();
    // Fermer la fenêtre modale après soumission
    modal.classList.add('hidden');
    modal.style.display = 'none';
});

// Suppression d'un produit
document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('delete-button')) {
        const productId = e.target.getAttribute('data-id');
        const user = auth.currentUser;
        const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce produit ?');

        if (confirmed && user) {
            await deleteDoc(doc(db, 'products', productId));
            loadUserProducts(); // Recharge les produits après suppression
        }
    }
});

// Edit and delete product functionality
document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('edit-button')) {
        const id = e.target.getAttribute('data-id');
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const product = {
                id: id,
                name: data.productName,
                price: data.productPrice,
                quantity: data.productQuantity,
                status: data.bought ? 'acheter' : 'non'
            };
            openProductModal('edit', product);
        }
    }

    if (e.target && e.target.classList.contains('delete-button')) {
        const id = e.target.getAttribute('data-id');
        await deleteProduct(id);
    }

    if (e.target && e.target.classList.contains('mark-as-bought')) {
        await markAsBought(e.target);
    }
});

function openProductModal(mode, product = null) {
    const productModal = document.getElementById('productModal');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productNameEdit');
    const productPriceInput = document.getElementById('productPriceEdit');
    const productQuantityInput = document.getElementById('productQuantityEdit');
    const productStatusInput = document.getElementById('statusEdit');

    if (mode === 'edit') {
        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productPriceInput.value = product.price;
        productQuantityInput.value = product.quantity;
        productStatusInput.value = product.status;
        document.getElementById('productModalTitle').textContent = 'Modifier le produit';
    } else {
        productIdInput.value = '';
        productNameInput.value = '';
        productPriceInput.value = '';
        productQuantityInput.value = '';
        productStatusInput.value = 'non';
        document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
        }
        productModal.classList.remove('hidden');
productModal.style.display = 'flex';
}

async function markAsBought(checkbox) {
const id = checkbox.getAttribute('data-id');
const bought = checkbox.checked;
const docRef = doc(db, 'products', id);

await updateDoc(docRef, {
    bought: bought
});

loadUserProducts(); // Reload products after marking as bought
}

function validateFields(fields) {
for (const [key, value] of Object.entries(fields)) {
if (!value) {
return `${key} est requis.`;
}
}
return null;
}

function displayMessage(type, message) {
const messageBox = document.getElementById('messageBox');
messageBox.textContent = message;
messageBox.className = type === 'success' ? 'bg-green-200 text-green-800 p-2 mt-4' : 'bg-red-200 text-red-800 p-2 mt-4';
messageBox.classList.remove('hidden');
setTimeout(() => {
    messageBox.classList.add('hidden');
}, 3000);
}


// Load past shopping dates
async function loadPastShoppingDates() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'products'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const pastDates = {};

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!pastDates[data.shoppingDate]) {
            pastDates[data.shoppingDate] = { total: 0, count: 0 };
        }
        pastDates[data.shoppingDate].total += data.productQuantity * data.productPrice;
        pastDates[data.shoppingDate].count++;
    });

    const pastDatesList = document.getElementById('pastDatesList');
    pastDatesList.innerHTML = '';

    Object.keys(pastDates).sort((a, b) => new Date(a) - new Date(b)).forEach(date => {
        const daysPassed = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
        const listItem = document.createElement('div');
        listItem.className = 'flex justify-between items-center p-4 bg-gray-100 rounded-lg';
        listItem.innerHTML = `
            <div>
                <p class="font-bold">${new Date(date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}</p>
                <p class="text-gray-600">${pastDates[date].total} F</p>
            </div>
            <div>
                <p class="text-gray-600">${daysPassed} jours</p>
            </div>
        `;
        pastDatesList.appendChild(listItem);
    });
}
// Fetch scheduled dates from Firestore
async function loadScheduledDates() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'products'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const scheduledDatesList = document.getElementById('scheduledDatesList');
    scheduledDatesList.innerHTML = '';

    const dateMap = new Map();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const shoppingDate = new Date(data.shoppingDate).toLocaleDateString();

        if (!dateMap.has(shoppingDate)) {
            dateMap.set(shoppingDate, { totalPrice: 0, products: [], allPurchased: true });
        }

        dateMap.get(shoppingDate).totalPrice += data.productPrice;
        dateMap.get(shoppingDate).products.push({ ...data, id: doc.id });

        if (!data.purchased) {
            dateMap.get(shoppingDate).allPurchased = false;
        }
    });

    dateMap.forEach((value, date) => {
        const dateItem = document.createElement('div');
        dateItem.className = 'mb-4 p-4 bg-gray-100 rounded-lg shadow-sm cursor-pointer';
        dateItem.dataset.date = date;

        const totalPriceClass = value.allPurchased ? 'bg-green' : 'bg-gray';

        dateItem.innerHTML = `
            <h3 class="text-gray-900 font-semibold">Date: ${date}</h3>
            <p>Total: <span class="${totalPriceClass}">${value.totalPrice}F</span></p>
        `;

        dateItem.addEventListener('click', () => showDateDetails(date, value.products));
        scheduledDatesList.appendChild(dateItem);
    });
}

function showDateDetails(date, products) {
    const dateDetailsCard = document.createElement('div');
    dateDetailsCard.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50';

    dateDetailsCard.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md relative w-1/2">
            <button class="absolute top-2 right-2 bg-red-500 text-white py-1 px-3 rounded-full hover:bg-red-600 transition" id="closeDateDetailsCard">Fermer</button>
            <h2 class="text-lg font-bold">Détails pour ${date}</h2>
            <div id="dateDetailsList" class="mt-4">
                ${products.map(product => `
                    <div class="mb-4 p-4 bg-gray-100 rounded-lg shadow-sm">
                        <p>Nom du produit: ${product.productName}</p>
                        <p>Prix: ${product.productPrice}F</p>
                        <p>Quantité: ${product.productQuantity}</p>
                        <label>
                            <input type="checkbox" ${product.purchased ? 'checked' : ''} data-id="${product.id}" class="purchase-checkbox"> Acheter
                        </label>
                    </div>
                `).join('')}
            </div>
            <div id="totalPrice" class="mt-4 font-bold ${products.every(product => product.purchased) ? 'text-green-500' : 'text-gray-500'}">Total: ${products.reduce((sum, product) => sum + product.productPrice, 0)}F</div>
        </div>
    `;

    document.body.appendChild(dateDetailsCard);

    // Event listener to close the date details card
    document.getElementById('closeDateDetailsCard').addEventListener('click', () => {
        dateDetailsCard.remove();
    });

    // Event listeners for purchase checkboxes
    document.querySelectorAll('.purchase-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (event) => {
            const productId = event.target.dataset.id;
            const purchased = event.target.checked;
            await updatePurchaseStatus(productId, purchased);
            loadScheduledDates(); // Refresh the scheduled dates
            dateDetailsCard.remove(); // Close the details card
        });
    });
}

// Function to update the purchase status in Firestore
async function updatePurchaseStatus(productId, purchased) {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, { purchased });
}

// Event listener to open the scheduled dates card
document.getElementById('viewScheduledDatesButton').addEventListener('click', () => {
    loadScheduledDates();
    document.getElementById('scheduledDatesCard').classList.remove('hidden');
});

// Event listener to close the scheduled dates card
document.getElementById('closeScheduledDatesCard').addEventListener('click', () => {
    document.getElementById('scheduledDatesCard').classList.add('hidden');
});
