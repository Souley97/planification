// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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

// Écouteur d'événement pour la soumission du formulaire d'inscription
document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault(); // Empêche la soumission par défaut du formulaire

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validation des champs
    const validationMessage = validateFields({ firstName, lastName, phone, email, password });
    if (validationMessage) {
        displayMessage('error', validationMessage);
        return;
    }

    // Création de l'utilisateur avec Firebase Authentication
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Stockage des informations supplémentaires dans Firestore
            setDoc(doc(db, 'users', user.uid), {
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                email: email
            }).then(() => {
                displayMessage('success', 'Inscription réussie !');
                document.getElementById('signupForm').reset();
            }).catch((error) => {
                displayMessage('error', `Erreur lors de l'enregistrement des informations: ${error.message}`);
            });
        })
        .catch((error) => {
            displayMessage('error', `Erreur d'inscription: ${error.message}`);
        });
});

// Fonction de validation des champs
function validateFields(fields) {
    for (const [field, value] of Object.entries(fields)) {
        const errorMessage = validateField(field, value);
        if (errorMessage) {
            return errorMessage;
        }
    }
    return '';
}

// Fonction pour afficher les messages de feedback à l'utilisateur
function displayMessage(type, message) {
    const messageBox = document.getElementById('messageBox');
    messageBox.classList.remove('hidden', 'bg-red-100', 'bg-green-100', 'text-red-700', 'text-green-700');
    messageBox.classList.add(type === 'error' ? 'bg-red-100' : 'bg-green-100', type === 'error' ? 'text-red-700' : 'text-green-700');
    messageBox.textContent = message;

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 2000);
}

// Fonction pour valider les champs
function validateField(field, value) {
    if (!value || value.trim() === '') {
        return `Le champ ${field} est requis.`;
    }
    if (field === 'firstName' || field === 'lastName') {
        if (value.length < 3 || value.length > 50) {
            return `Le ${field} doit contenir entre 3 et 50 caractères.`;
        }
    }
    if (field === 'phone') {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(value)) {
            return 'Le téléphone doit être un numéro valide à 10 chiffres.';
        }
    }
    if (field === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'L\'email doit être une adresse valide.';
        }
    }
    if (field === 'password') {
        if (value.length < 6) {
            return 'Le mot de passe doit contenir au moins 6 caractères.';
        }
    }
    return '';
}

document.getElementById('signInForm').addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent default form submission

    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value.trim();

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            displayMessage('success', 'Connexion réussie !');
            document.getElementById('signIn').style.display = 'none';
            document.getElementById('shoppingForm').style.display = 'block';
            document.getElementById('productsTable').style.display = 'block';
        })
        .catch((error) => {
            displayMessage('error', `Erreur de connexion: ${error.message}`);
        });
});



document.getElementById('shoppingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const shoppingDate = document.getElementById('shoppingDate').value;
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productQuantity = document.getElementById('productQuantity').value;

    try {
        // Add product to table
        addProductToTable(productName, productPrice, productQuantity, shoppingDate);

        // Store product data in Firestore
        const user = auth.currentUser;
        await setDoc(doc(db, 'Produit', `${user.uid}-${productName}-${shoppingDate}`), {
            productName: productName,
            productPrice: productPrice,
            productQuantity: productQuantity,
            shoppingDate: shoppingDate
        });

        displayMessage('success', 'Produit ajouté avec succès!');
        // Clear form fields
        document.getElementById('shoppingForm').reset();
    } catch (error) {
        displayMessage('error', `Erreur lors de l'enregistrement des informations: ${error.message}`);
    }
});

function addProductToTable(name, price, quantity, date) {
    const tbody = document.querySelector('#productsTable tbody');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${name}</td>
        <td>${price}</td>
        <td>${quantity}</td>
        <td>${date}</td>
        <td><button class="mark-as-bought">Acheter</button></td>
    `;

    tbody.appendChild(row);
    document.getElementById('productsTable').style.display = 'block';

    // Add event listener for the "Acheter" button
    row.querySelector('.mark-as-bought').addEventListener('click', function() {
        this.closest('tr').style.textDecoration = 'line-through';
    });
}

// Function to display messages
function displayMessage(type, message) {
    const messageBox = document.getElementById('messageBox');
    messageBox.classList.remove('hidden', 'bg-red-100', 'bg-green-100', 'text-red-700', 'text-green-700');
    messageBox.classList.add(type === 'error' ? 'bg-red-100' : 'bg-green-100', type === 'error' ? 'text-red-700' : 'text-green-700');
    messageBox.textContent = message;

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 2000);
};
