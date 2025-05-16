document.querySelector('#createAccount').addEventListener('click', openAccountCreationForm);
document.querySelector('#loginForm').addEventListener('submit', attemptLogin);
document.querySelector('#createForm').addEventListener('submit', attemptAccountCreation);

const loginDialog = document.querySelector('#loginDialog');
const createAccountDialog = document.querySelector('#createAccountDialog');
const loginErrorMessageDisplay = document.querySelector('#loginErrorMessageDisplay');
const accountCreationErrorMessageDisplay = document.querySelector('#accountCreationErrorMessageDisplay');

async function attemptLogin(event) {

    event.preventDefault();

    let response;
    let result;
    let loginData = getLoginDataFromForm();

    if (loginData) {
        try {
            response = await fetch('index.php?c=user&a=login', {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            })

            if (!response.ok) throw new Error(`Response status: ${response.status}`)
        }
        catch (error) {
            console.log(error.message);
        }

        result = await response.json();

        if (result.message === 'Successfully logged in') {
            window.location = 'index.php';
        } else {
            loginErrorMessageDisplay.innerText = result.message;
            alertLogin();
        }
    }
}

function getLoginDataFromForm() {
    let username = document.querySelector('#username').value;
    let password = document.querySelector('#password').value;

    if (username == '') {
        alertUsername();
        return false;
    }

    if (password == '') {
        alertPassword();
        return false;
    }

    return {
        'username': username,
        'password': password
    };
}

function openAccountCreationForm(event) {
    event.preventDefault();

    loginDialog.removeAttribute('open');
    createAccountDialog.setAttribute('open', '');
}

async function attemptAccountCreation(event) {
    event.preventDefault()
    let accountData = getAccountDataFromForm();

    console.log(accountData);
}

function getAccountDataFromForm() {
    let email = createAccountDialog.querySelector('#newUserEmail').value;
    let password = createAccountDialog.querySelector('#newPassword').value;
    let passwordRepeat = createAccountDialog.querySelector('#newPasswordRepeat').value;

    const mailRegEx = /^[^@]+@[^@]+\.[^@]+$/;
    const passwordRegEx = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    //empty
    if (email == '') {
        alertAccountCreationEmail();
        return false;
    }

    if (password == '') {
        alertAccountCreationNewPassword();
        return false;
    }

    if (passwordRepeat == '') {
        alertAccountCreationNewPasswordRepeat();
        return false;
    }

    //different passwords
    if (password != passwordRepeat) {
        alertAccountCreationNewPassword('Die Passwörter müssen identisch sein.');
        alertAccountCreationNewPasswordRepeat();
        return false;
    }

    //regex
    if (!mailRegEx.test(email)) {
        alertAccountCreationEmail('Ungültige E-Mail-Adresse');
        return false;
    }

    if (!passwordRegEx.test(password)) {
        let message = 'Das Passwort muss mindestens 8 Zeichen lang sein, Großbuchstaben, mindestens eine Zahl und ein Sonderzeichen enthalten.'
        alertAccountCreationNewPassword(message);
        return false;
    }

    return {
        'email': email,
        'password': password,
        'passwordRepeat': passwordRepeat 
    }
}

//Validation
//Login
function alertUsername() {
    let alertRing = document.querySelector('#username').parentElement;

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

function alertPassword() {
    let alertRing = document.querySelector('#password').parentElement;

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

function alertLogin() {
    let alertRing = document.querySelector('dialog');

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

// Account Creation
function alertAccountCreationEmail(message = false) {
    let alertRing = createAccountDialog.querySelector('#newUserEmail').parentElement;

    if (message) {
        accountCreationErrorMessageDisplay.innerText = message;
    }

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

function alertAccountCreationNewPassword(message = false) {
    let alertRing = createAccountDialog.querySelector('#newPassword').parentElement;

    if (message) {
        accountCreationErrorMessageDisplay.innerText = message;
    }

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

function alertAccountCreationNewPasswordRepeat(message = false) {
    let alertRing = createAccountDialog.querySelector('#newPasswordRepeat').parentElement;

    if (message) {
        accountCreationErrorMessageDisplay.innerText = message;
    }

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}