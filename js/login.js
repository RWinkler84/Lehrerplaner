document.querySelector('#createAccount').addEventListener('click', openAccountCreationForm);
document.querySelector('#loginForm').addEventListener('submit', attemptLogin);
document.querySelector('#createForm').addEventListener('submit', attemptAccountCreation);

window.addEventListener('DOMContentLoaded', isAuth);

const loginDialog = document.querySelector('#loginDialog');
const createAccountDialog = document.querySelector('#createAccountDialog');
const loginErrorMessageDisplay = document.querySelector('#loginErrorMessageDisplay');
const accountCreationErrorMessageDisplay = document.querySelector('#accountCreationErrorMessageDisplay');

function isAuth() {
    let params = new URLSearchParams(window.location.search);
    let status = params.get('auth');

    if (status == 'success') {
        loginErrorMessageDisplay.style.color = 'var(--matteGreen)';
        loginErrorMessageDisplay.innerText = 'Du hast deine Mail-Adresse erfolgreich authentifiziert. Du kannst dich jetzt anmelden.';
    } else if (status == 'failed') {
        loginErrorMessageDisplay.innerText = 'Die Authentifizierung ist fehlgeschlagen. Versuche es bitte später erneut.';
    }
}

async function attemptLogin(event) {

    event.preventDefault();

    let result;
    let loginData = getLoginDataFromForm();

    if (loginData) {
        result = await makeAjaxQuery('index.php?c=user&a=login', loginData);

        if (result.message === 'Successfully logged in') {
            window.location = 'index.php';
        } else {
            loginErrorMessageDisplay.style.color = 'var(--matteRed)';
            loginErrorMessageDisplay.innerText = result.message;

            if (result.status == 'mail auth missing') {
                loginErrorMessageDisplay.innerHTML += '<p><a href="" id="resendAuthMail" style="text-decoration: none;">Bestätigungsmail erneut senden?</a></p>';
                loginErrorMessageDisplay.querySelector('#resendAuthMail').addEventListener('click', resendAuthMail);
            }

            if (result.status == 'wrong login data') {
                loginErrorMessageDisplay.innerHTML += '<p><a href="" id="sendResetPasswordMail" style="text-decoration: none;">Passwort vergessen?</a></p>';
                loginErrorMessageDisplay.querySelector('#sendResetPasswordMail').addEventListener('click', resendAuthMail);
            }
            alertLoginErrorMessageDisplay();
        }
    }
}

async function resendAuthMail(event) {
    event.preventDefault();

    let userEmail = loginDialog.querySelector('#userEmail').value;
    let result;

    result = await makeAjaxQuery('index.php?c=user&a=resendAuthMail', {'userEmail': userEmail});

    loginErrorMessageDisplay.innerText = result.message;
    if (result.status == 'success') loginErrorMessageDisplay.style.color = 'var(--matteGreen';

}

function getLoginDataFromForm() {
    let userEmail = document.querySelector('#userEmail').value;
    let password = document.querySelector('#password').value;

    if (userEmail == '') {
        alertUserEmail();
        return false;
    }

    if (password == '') {
        alertPassword();
        return false;
    }

    return {
        'userEmail': userEmail,
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
    let result;
    let accountData = getAccountDataFromForm();

    if (accountData) {
        result = await makeAjaxQuery('index.php?c=user&a=createAccount', accountData);

        if (result.message == 'Confirmation email send') {
            accountCreationErrorMessageDisplay.style.color = 'var(--matteGreen)';
            accountCreationErrorMessageDisplay.innerText = 'Erfolg! Eine Bestätigungsmail wurde an die angegebene Adresse gesendet. Bitte klicke den darin enthaltenen Link, damit du loslegen kannst.'
        } else {
            accountCreationErrorMessageDisplay.innerText = result.message;
            alertAccountCreationErrorMessageDisplay();
        }
    }
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
        'userEmail': email,
        'password': password,
        'passwordRepeat': passwordRepeat
    }
}

async function makeAjaxQuery(url, dataToSend) {
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) throw new Error(`Response status: ${response.status}`)
    }
    catch (error) {
        console.log(error.message);
    }

    result = await response.json();

    return result;
}

//Validation alerts
//Login
function alertUserEmail() {
    let alertRing = document.querySelector('#userEmail').parentElement;

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

function alertLoginErrorMessageDisplay() {
    let alertRing = document.querySelector('dialog');

    loginErrorMessageDisplay.classList.add('validationError');
    setTimeout(() => {
        loginErrorMessageDisplay.classList.remove('validationError');
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

function alertAccountCreationErrorMessageDisplay() {

    accountCreationErrorMessageDisplay.classList.add('validationError');
    setTimeout(() => {
        accountCreationErrorMessageDisplay.classList.remove('validationError');
    }, 300);
}