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



document.getElementById('viewScheduledDatesButton').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('productsList').classList.add('hidden');
    document.getElementById('dateSelection').classList.add('hidden');
});

