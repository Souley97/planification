const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');
const signInForm = document.getElementById('signIn');
const signUpForm = document.getElementById('signup');

signUpButton.addEventListener('click', function(){
    signInForm.style.display = "none";
    signUpForm.style.display = "block";
});

signInButton.addEventListener('click', function(){
    signInForm.style.display = "block";
    signUpForm.style.display = "none";
});


flatpickr("#shoppingDate", {
    dateFormat: "Y-m-d", // Format de la date
    minDate: "today",   // Date minimale (aujourd'hui)
    maxDate: new Date().fp_incr(30), // Date maximale (30 jours à partir d'aujourd'hui)
});


    // Ouverture et fermeture de la fenêtre modale
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
