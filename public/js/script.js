// Gestion des sections d'authentification
document.getElementById('signUpButton').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signIn').classList.add('hidden');
    document.getElementById('signup').classList.remove('hidden');
});

document.getElementById('signInButton').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup').classList.add('hidden');
    document.getElementById('signIn').classList.remove('hidden');
});

// Gestion de la fenêtre modale pour ajouter un produit
const addProductButton = document.getElementById('addProductButton');
const addProductModal = document.getElementById('addProductModal');
const closeModal = document.querySelector('.close-modal');

addProductButton.addEventListener('click', (e) => {
    e.preventDefault();
    addProductModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    addProductModal.classList.add('hidden');
});
