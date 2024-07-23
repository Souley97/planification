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


// Event listener for edit button click
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
});

// Event listener for close button in product modal
document.getElementById('productModalClose').addEventListener('click', () => {
    const productModal = document.getElementById('productModal');
    productModal.classList.add('hidden');
    productModal.style.display = 'none';
});

// Function to open product modal
function openProductModal(mode, product = null) {
    const productModal = document.getElementById('productModal');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productNameEdit');
    const productPriceInput = document.getElementById('productPriceEdit');
    const productQuantityInput = document.getElementById('productQuantityEdit');
    const productStatusInput = document.getElementById('statusEdit');

    if (mode === 'edit' && product) {
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
        productStatusInput.value = '';
        document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
    }

    productModal.classList.remove('hidden');
    productModal.style.display = 'flex';
}

// Event listener for save button in product modal
document.getElementById('productModalSave').addEventListener('click', async () => {
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productNameEdit').value.trim();
    const productPrice = document.getElementById('productPriceEdit').value.trim();
    const productQuantity = document.getElementById('productQuantityEdit').value.trim();
    const status = document.getElementById('statusEdit').value; // Acheter ou pas
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

    try {
        await updateDoc(doc(db, 'products', productId), {
            productName,
            productPrice,
            productQuantity,
            bought: status === 'acheter',
            userId: user.uid
        });

        loadScheduledDates();
        const productModal = document.getElementById('productModal');
        productModal.classList.add('hidden');
        productModal.style.display = 'none';
        displayMessage('success', 'Produit modifié avec succès!');
    } catch (error) {
        displayMessage('error', `Erreur lors de la modification du produit: ${error.message}`);
    }
});

