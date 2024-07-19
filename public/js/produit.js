import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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

// Date change event to load products for selected date
document.getElementById('shoppingDate').addEventListener('change', loadUserProducts);

// Load products for the logged-in user
async function loadUserProducts() {
    const user = auth.currentUser;
    if (!user) return;
    const selectedDate = document.getElementById('shoppingDate').value;
    const q = query(collection(db, 'products'), where('userId', '==', user.uid), where('shoppingDate', '==', selectedDate));
    const querySnapshot = await getDocs(q);
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        addProductToTable(data.productName, data.productPrice, data.productQuantity, data.shoppingDate, data.bought);
    });
}
// Add product to table
function addProductToTable(name, price, quantity, date, bought) {
    const tbody = document.querySelector('#productsTable tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="border p-2">${name}</td>
        <td class="border p-2">${price}</td>
        <td class="border p-2">${quantity}</td>
        <td class="border p-2">${bought ? '<span class="text-green-500">Acheté</span>' : '<input type="checkbox" onclick="markAsBought(this)"> Acheter'}</td>
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

    addProductToTable(productName, productPrice, productQuantity, shoppingDate, boughtStatus);
    displayMessage('success', 'Produit ajouté avec succès !');
    document.getElementById('productForm').reset();
});

// Mark product as bought
async function markAsBought(checkbox) {
    const row = checkbox.parentNode.parentNode;
    const productName = row.children[0].innerText;
    const shoppingDate = document.getElementById('shoppingDate').value;
    const user = auth.currentUser;

    const productDocRef = doc(db, 'products', `${user.uid}-${shoppingDate}-${productName}`);
    await updateDoc(productDocRef, { bought: checkbox.checked });
    row.children[3].innerHTML = checkbox.checked ? '<span class="text-green-500">Acheté</span>' : '<input type="checkbox" onclick="markAsBought(this)"> Acheter';
}

// Display message
function displayMessage(type, message) {
    const messageBox = document.getElementById('messageBox');
    messageBox.classList.remove('hidden', 'bg-red-100', 'bg-green-100', 'text-red-700', 'text-green-700');
    messageBox.classList.add(type === 'error' ? 'bg-red-100' : 'bg-green-100', type === 'error' ? 'text-red-700' : 'text-green-700');
    messageBox.textContent = message;

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 2000);
}


// Mark product as bought



// Auth state change
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserProducts();
    } else {
        document.querySelector('#productsTable tbody').innerHTML = '';
        displayMessage('error', 'Utilisateur non connecté.');
    }
});

// Validation des champs
function validateFields(fields) {
    for (const [field, value] of Object.entries(fields)) {
        const errorMessage = validateField(field, value);
        if (errorMessage) {
            return errorMessage;
        }
    }
    return '';
}

function validateField(field, value) {
    if (!value || value.trim() === '') {
        return `Le champ ${field} est requis.`;
    }
    if (field === 'Nom du produit') {
        if (value.length < 3 || value.length > 50) {
            return `Le ${field} doit contenir entre 3 et 50 caractères.`;
        }
    }
    if (field === 'Prix du produit') {
        if (!/^\d+(\.\d{1,2})?$/.test(value)) {
            return 'Le prix doit être un nombre valide.';
        }
    }
    if (field === 'Quantité du produit') {
        if (!/^\d+$/.test(value)) {
            return 'La quantité doit être un nombre entier.';
        }
    }
    return '';
}
