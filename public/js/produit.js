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


// Handle modal visibility
function handleModalVisibility() {
    modal.classList.toggle('hidden');
    modal.style.display = modal.classList.contains('hidden') ? 'none' : 'flex';
}

addProductButton.addEventListener('click', handleModalVisibility);
closeModal.addEventListener('click', handleModalVisibility);
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        handleModalVisibility();
    }
});

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
    row.className="mb-4 p-20 bg-gray-100 rounded-lg shadow-sm cursor-pointer ";
    
    row.innerHTML = `
        <td class="flex items-center my-4 rounded-lg shadow-sm cursor-pointer p-4 bg-white">
            <img class="w-16 h-16 object-cover rounded" src="https://dummyimage.com/100x100/F3F4F7/000000.jpg" alt="Product Image">
            <div class="ml-3 flex-1">
                <h3 class="text-gray-900 font-semibold">${name}</h3>
                <p class="text-gray-700 mt-1">Prix: ${price}</p>
                <p class="text-gray-700 mt-1">Quantité: ${quantity}</p>
            </div>
            <div class="flex items-center space-x-4">
                <span class="text-green-600">Total : ${total}</span>
                <button class="edit-button" data-id="${id}">
                    <i class="fas fa-edit text-blue-500"></i>
                </button>
                <button class="delete-button" data-id="${id}">
                    <i class="fas fa-trash text-red-500"></i>
                </button>
            </div>
        </td>
    `;

    tbody.appendChild(row);


    row.querySelector('.delete-button').addEventListener('click', async (event) => {
        const productId = event.target.dataset.id;
        await deleteProduct(productId);
        loadUserProducts(); // Recharge les produits après la suppression
    });
    
}

// Check if there are issues with data fetching
loadUserProducts().then(() => {
    console.log('Products loaded successfully');
}).catch(error => {
    console.error('Error loading products:', error);
});




// Set the default date to today's date
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('shoppingDate').value = today;
    loadUserProducts(); // Load products for today by default
});

// Add product form submission
// Écouter l'événement de soumission du formulaire
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Récupérer les valeurs des champs
    const productName = document.getElementById('productName').value.trim();
    const productPrice = document.getElementById('productPrice').value.trim();
    const productQuantity = document.getElementById('productQuantity').value.trim();
    const shoppingDate = document.getElementById('shoppingDate').value; // Récupérer la date choisie
    const status = document.getElementById('status').value; // Acheter ou pas
    const user = auth.currentUser;

    // Afficher la date pour le débogage
    console.log(`Date sélectionnée: ${shoppingDate}`);

    // Valider les champs
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

    if (!user || !shoppingDate) { // Vérifier que l'utilisateur et la date sont présents
        displayMessage('error', 'Vous devez être connecté et avoir sélectionné une date.');
        return;
    }

    // Déterminer si le produit est marqué comme acheté ou non
    const boughtStatus = status === 'acheter';

    // Sauvegarder le produit avec la date
    await setDoc(doc(db, 'products', `${user.uid}-${shoppingDate}-${productName}`), {
        userId: user.uid,
        productName,
        productPrice,
        productQuantity,
        shoppingDate, // Utiliser la date récupérée
        bought: boughtStatus
    });

    addProductToTable(`${user.uid}-${shoppingDate}-${productName}`, productName, productPrice, productQuantity, shoppingDate, boughtStatus);
    displayMessage('success', 'Produit ajouté avec succès !');
    document.getElementById('productForm').reset();
    // Fermer la fenêtre modale après soumission
    modal.classList.add('hidden');
    modal.style.display = 'none';
});

// Autres fonctions comme loadUserProducts(), validateFields(), displayMessage(), etc.




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

        const totalPriceForProduct = data.productPrice * data.productQuantity;
        dateMap.get(shoppingDate).totalPrice += totalPriceForProduct;
        dateMap.get(shoppingDate).products.push({ ...data, id: doc.id });

        if (!data.purchased) {
            dateMap.get(shoppingDate).allPurchased = false;
        }
    });

    dateMap.forEach((value, date) => {
        const dateItem = document.createElement('div');
        const bgColorClass = value.allPurchased ? 'bg-green-100' : 'bg-gray-100';
        const textColorClass = value.allPurchased ? 'text-green-500' : 'text-gray-500';

        dateItem.className = `mb-4 p-4 ${bgColorClass} rounded-lg shadow-sm cursor-pointer`;
        dateItem.dataset.date = date;

        dateItem.innerHTML = `
            <h3 class="text-gray-900 font-semibold">Date: ${date}</h3>
            <p>Total: <span class="${textColorClass}">${value.totalPrice}F</span></p>
        `;

        dateItem.addEventListener('click', () => showDateDetails(date, value.products));
        scheduledDatesList.appendChild(dateItem);
    });
}

    
    // Example function to show details of a particular date
       
    async function showDateDetails(date, products) {
        const dateDetailsCard = document.createElement('div');
        dateDetailsCard.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
        
        // Calculate initial totals
        let totalPrice = products.reduce((total, product) => total + product.productPrice * product.productQuantity, 0);
        let purchasedTotalPrice = products.reduce((total, product) => product.purchased ? total + product.productPrice * product.productQuantity : total, 0);
    
        // Determine card background color based on purchase status
        const isAllPurchased = products.every(product => product.purchased);
        const cardBgColor = isAllPurchased ? 'bg-green-100' : 'bg-white';
        const totalPriceColor = isAllPurchased ? 'text-green-500' : 'text-gray-500';
    
        dateDetailsCard.innerHTML = `
            <div class="${cardBgColor} p-6 rounded-lg shadow-md relative w-full max-w-4xl mx-auto">
                <div id="totalPrice" class="mt-4 font-bold ${totalPriceColor}">
                    Total: ${totalPrice}F
                </div>
                <div id="purchasedTotalPrice" class="mt-4 font-bold ${totalPriceColor}">
                    Total des produits achetés: ${purchasedTotalPrice}F
                </div>
                
                <button class="absolute top-2 right-2 bg-red-500 text-white py-1 px-3 rounded-full hover:bg-red-600 transition" id="closeDateDetailsCard">
                    Fermer
                </button>
                <h2 class="text-lg font-bold mt-4">Détails pour ${date}</h2>
                <div id="dateDetailsList" class="mt-4">
                 ${products.map(product => {
    // Determine the background color based on the purchased status
    const cardBgColor = product.purchased ? 'bg-green-300' : 'bg-gray-50';
    
    return `
        <div class="flex items-center p-4 ${cardBgColor} rounded-lg shadow-sm mb-4">
            <img class="w-16 h-16 object-cover rounded" src="https://dummyimage.com/100x100/F3F4F7/000000.jpg" alt="Product Image">
            <div class="ml-3 flex-1">
                <h3 class="text-gray-900 font-semibold">${product.productName}</h3>
                <p class="text-gray-700 mt-1">Prix: ${product.productPrice}F</p>
                <p class="text-gray-700 mt-1">Quantité: ${product.productQuantity}</p>
            </div>
            <div class="flex items-center space-x-4">
                <span class="text-green-600 font-bold">Total: ${product.productQuantity * product.productPrice}F</span>
                <input type="checkbox" ${product.purchased ? 'checked' : ''} data-id="${product.id}" class="purchase-checkbox">
                <button class="edit-button" data-id="${product.id}">
                    <i class="fas fa-edit text-blue-500"></i>
                </button>
                <button class="delete-button" data-id="${product.id}">
                    <i class="fas fa-trash text-red-500"></i>
                </button>
            </div>
        </div>
    `;
}).join('')}

                </div>
            </div>
        `;
        
        document.body.appendChild(dateDetailsCard);
        
        // Event listener to close the date details card
        document.getElementById('closeDateDetailsCard').addEventListener('click', () => {
            dateDetailsCard.remove();
            document.getElementById('dateSelection').classList.remove('hidden');
        });
        
        // Event listeners for purchase checkboxes
        document.querySelectorAll('.purchase-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (event) => {
                const productId = event.target.dataset.id;
                const purchased = event.target.checked;
        
                // Update the purchase status in the database
                await updatePurchaseStatus(productId, purchased);
        
                // Recalculate the totals
                purchasedTotalPrice = products.reduce((total, product) => {
                    if (product.id === productId) {
                        product.purchased = purchased;
                    }
                    return product.purchased ? total + product.productPrice * product.productQuantity : total;
                }, 0);
                totalPrice = products.reduce((total, product) => total + product.productPrice * product.productQuantity, 0);
        
                // Update the display for totals and card background
                const isAllPurchased = products.every(product => product.purchased);
                const cardBgColor = isAllPurchased ? 'bg-green-100' : 'bg-white';
                const totalPriceColor = isAllPurchased ? 'text-green-200' : 'text-gray-500';
    
                document.querySelector('.bg-white').classList.remove('bg-white');
                document.querySelector('.bg-green-100').classList.add(cardBgColor);
                document.getElementById('totalPrice').classList.replace('text-gray-500', totalPriceColor);
                document.getElementById('purchasedTotalPrice').classList.replace('text-gray-500', totalPriceColor);
                document.getElementById('totalPrice').innerText = `Total: ${totalPrice}F`;
                document.getElementById('purchasedTotalPrice').innerText = `Total des produits achetés: ${purchasedTotalPrice}F`;
        
                // Refresh the scheduled dates
                loadScheduledDates();
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
    document.getElementById('dateSelection').style.display = 'block';
    document.getElementById('productsList').style.display = 'block';

});



async function deleteProduct(productId) {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce produit ?');
    if (confirmed) {

  
        const productRef = doc(db, 'products', productId);
        await deleteDoc(productRef);
        loadUserProducts();

    } 
}


async function markAsBought(target) {
    const id = target.getAttribute('data-id');
    const bought = target.checked;
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, { bought: bought });
    loadUserProducts(); // Refresh the products list
}



// Helper function to validate fields
function validateFields(fields) {
    for (const [field, value] of Object.entries(fields)) {
        if (!value) {
            return `Le champ "${field}" est requis.`;
        }
    }
    return null;
}

// Helper function to display messages
function displayMessage(type, message) {
    const messageBox = document.getElementById('messageBox');
    messageBox.className = type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    messageBox.textContent = message;
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

// Firebase authentication state change observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loadUserProducts();
    } else {
        // User is signed out
        document.querySelector('#productsTable tbody').innerHTML = '';
    }
});



