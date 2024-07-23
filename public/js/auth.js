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

// Initialize UI
function initializeUI() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('deccon').style.display = 'none';
            document.getElementById('connec').style.display = 'block';
            document.getElementById('mainSection').style.display = 'block';

            deccon
            loadUserProducts();
        } else {
            document.getElementById('deccon').style.display = 'block';
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('mainSection').style.display = 'none';
            document.getElementById('connec').style.display = 'none';

        }
    });
}

// Call initialize UI
initializeUI();

// Sign up form submission
document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            setDoc(doc(db, 'users', user.uid), {
                firstName,
                lastName,
                phone,
                email
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

// Sign in form submission
document.getElementById('signInForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value.trim();
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            displayMessage('success', 'Connexion réussie !');
        })
        .catch((error) => {
            displayMessage('error', `Erreur de connexion: ${error.message}`);
        });
});

// Sign out
document.getElementById('signOutButton').addEventListener('click', () => {
    signOut(auth).then(() => {
        displayMessage('success', 'Déconnexion réussie !');
    }).catch((error) => {
        displayMessage('error', `Erreur de déconnexion: ${error.message}`);
    });
});


function validateFields(fields) {
    for (const [field, value] of Object.entries(fields)) {
        const errorMessage = validateField(field, value);
        if (errorMessage) {
            return errorMessage;
        }
    }
    return '';
}

function displayMessage(type, message) {
    const messageBox = document.getElementById('messageBox');
    messageBox.classList.remove('hidden', 'bg-red-100', 'bg-green-100', 'text-red-700', 'text-green-700');
    messageBox.classList.add(type === 'error' ? 'bg-red-100' : 'bg-green-100', type === 'error' ? 'text-red-700' : 'text-green-700');
    messageBox.textContent = message;

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 2000);
}

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