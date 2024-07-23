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


function calculateDaysDifference(date) {
    const now = new Date();
    const futureDate = new Date(date);
    const diffTime = futureDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('fr-FR', options);
}

async function loadUpcomingDates() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'products'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const upcomingDatesList = document.getElementById('upcomingDatesList');
    upcomingDatesList.innerHTML = '';

    const dateMap = new Map();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const shoppingDate = new Date(data.shoppingDate);
        
        if (shoppingDate > new Date()) {
            const formattedDate = formatDate(shoppingDate);
            if (!dateMap.has(formattedDate)) {
                dateMap.set(formattedDate, { totalPrice: 0, products: [] });
            }

            const totalPriceForProduct = data.productPrice * data.productQuantity;
            dateMap.get(formattedDate).totalPrice += totalPriceForProduct;
            dateMap.get(formattedDate).products.push({ ...data, id: doc.id });
        }
    });

    dateMap.forEach((value, date) => {
        const daysDifference = calculateDaysDifference(date);
        const daysText = daysDifference === 1 ? 'Arrive demain' : `Arrive en ${daysDifference} jours`;

        const dateItem = document.createElement('div');
        dateItem.className = 'mb-4 p-4 bg-gray-100 rounded-lg shadow-sm cursor-pointer';

        dateItem.innerHTML = `
            <h3 class="text-gray-900 font-semibold">${date}</h3>
            <p>${value.totalPrice}F</p>
            <p>${daysText}</p>
        `;

        dateItem.addEventListener('click', () => showDateDetails(date, value.products));
        upcomingDatesList.appendChild(dateItem);
    });
}

