document.querySelector('#createAccount').addEventListener('click', openAccountCreationForm);
document.querySelector('#loginForm').addEventListener('submit', attemptLogin);
document.querySelector('#createAccountForm').addEventListener('submit', attemptAccountCreation);
document.querySelector('#sendResetPasswordMailForm').addEventListener('submit', sendResetPasswordMail);
document.querySelector('#resetPasswordForm').addEventListener('submit', attemptPasswordReset);
document.querySelectorAll('.backToLoginLink').forEach(link => { link.addEventListener('click', openLoginForm); });

window.addEventListener('DOMContentLoaded', isAuth);
window.addEventListener('DOMContentLoaded', isReset);

const ONEMIN = 60000;

const loginDialog = document.querySelector('#loginDialog');
const createAccountDialog = document.querySelector('#createAccountDialog');
const sendResetPasswordMailDialog = document.querySelector('#sendResetPasswordMailDialog');
const resetPasswordDialog = document.querySelector('#resetPasswordDialog');

const loginErrorMessageDisplay = loginDialog.querySelector('#loginErrorMessageDisplay');
const accountCreationErrorMessageDisplay = createAccountDialog.querySelector('#accountCreationErrorMessageDisplay');
const sendResetPasswordMailErrorMessageDisplay = sendResetPasswordMailDialog.querySelector('#sendResetPasswordMailErrorMessageDisplay')
const resetPasswordErrorMessageDisplay = resetPasswordDialog.querySelector('#resetPasswordErrorMessageDisplay')

let authMailAlreadySend = false;
let resetMailAlreadySend = false;

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

function isReset() {
    let params = new URLSearchParams(window.location.search);
    let token = params.get('reset');

    if (token) {
        resetPasswordDialog.setAttribute('open', '');
        loginDialog.removeAttribute('open');
    }
}

async function attemptLogin(event) {

    event.preventDefault();

    const errorMessageDisplay = loginDialog.querySelector('.errorMessageDisplay');
    let result;
    let loginData = getLoginDataFromForm();

    if (loginData) {
        result = await makeAjaxQuery('index.php?c=user&a=login', loginData);

        if (result.message === 'Successfully logged in') {
            window.location = 'index.php';
        } else {
            errorMessageDisplay.style.color = 'var(--matteRed)';
            errorMessageDisplay.innerText = result.message;

            if (result.status == 'mail auth missing') {
                errorMessageDisplay.innerHTML += '<p><a href="" id="resendAuthMail" style="text-decoration: none;">Bestätigungsmail erneut senden?</a></p>';
                errorMessageDisplay.querySelector('#resendAuthMail').addEventListener('click', resendAuthMail);
            }

            console.log(result.status)
            if (result.status == 'wrong login data') {
                errorMessageDisplay.innerHTML += '<p><a href="" id="sendResetPasswordMail" style="text-decoration: none;">Passwort vergessen?</a></p>';
                errorMessageDisplay.querySelector('#sendResetPasswordMail').addEventListener('click', openSendResetPasswordMailDialog);
            }
            alertLoginErrorMessageDisplay();
        }
    }
}

async function attemptPasswordReset(event) {
    event.preventDefault();

    const errorMessageDisplay = resetPasswordDialog.querySelector('.errorMessageDisplay');
    let params = new URLSearchParams(window.location.search);
    let token = params.get('reset');
    let formData = getPasswordResetDataFromForm();

    if (formData) {
        formData['token'] = token;

        let result = await makeAjaxQuery('index.php?c=user&a=resetPassword', formData);

        console.log(result);

        if (result.status == 'success') {
            errorMessageDisplay.style.color = 'var(--matteGreen)';
            errorMessageDisplay.innerText = result.message;
            errorMessageDisplay.innerHTML += '<p><a href="" id="backToLogin" style="text-decoration: none">Zurück zum Login</a></p>';

            errorMessageDisplay.querySelector('#backToLogin').addEventListener('click', openLoginForm);

            return;
        }

        errorMessageDisplay.innerText = result.message;
    }
}

async function resendAuthMail(event) {
    event.preventDefault();

    const errorMessageDisplay = loginDialog.querySelector('.errorMessageDisplay');
    let userEmail = loginDialog.querySelector('#userEmail').value;
    let result;

    if (!authMailAlreadySend) {
        authMailAlreadySend = true;

        result = await makeAjaxQuery('index.php?c=user&a=resendAuthMail', { 'userEmail': userEmail });
        errorMessageDisplay.innerText = result.message;

        if (result.status == 'success') {
            errorMessageDisplay.style.color = 'var(--matteGreen';
        } else {
            authMailAlreadySend = false;
        }

        setTimeout(() => { authMailAlreadySend = false; }, ONEMIN * 5); //after 5 minutes you can resend the Authmail again, prevents spam
        return;
    }

    errorMessageDisplay.innerText = 'Es wurde bereits eine Authentifierungsmail geschickt. Überprüfe bitte deinen Posteingang oder Spam-Ordner.';
}

async function sendResetPasswordMail(event) {
    event.preventDefault();

    const errorMessageDisplay = sendResetPasswordMailDialog.querySelector('.errorMessageDisplay');
    let userEmail = sendResetPasswordMailDialog.querySelector('#resetPasswordMail').value;
    let result;

    if (userEmail == '') {
        alertSendAccountResetMailInput();
        return;
    }

    if (!resetMailAlreadySend) {
        resetMailAlreadySend = true;

        result = await makeAjaxQuery('index.php?c=user&a=sendPasswortResetMail', { 'userEmail': userEmail });

        if (result.status == 'success') {
            errorMessageDisplay.style.color = 'var(--matteGreen';
            errorMessageDisplay.innerText = result.message;
        } else {
            resetMailAlreadySend = false;
        }

        setTimeout(() => { resetMailAlreadySend = false; }, ONEMIN * 5); //after 5 minutes you can resend the Authmail again, prevents spam
        return;
    }

    errorMessageDisplay.innerText = 'Es wurde bereits eine Reset-Mail geschickt. Überprüfe bitte deinen Posteingang oder Spam-Ordner.';

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

function getPasswordResetDataFromForm() {
    const passwordRegEx = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    let newPassword = resetPasswordDialog.querySelector('#resetPassword').value;
    let newPasswordRepeat = resetPasswordDialog.querySelector('#resetPasswordRepeat').value;

    //empty
    if (newPassword == '') {
        alertResetPassword();
        return false;
    }

    if (newPasswordRepeat == '') {
        alertResetPasswordRepeat();
        return false;
    }

    //different passwords
    if (newPassword != newPasswordRepeat) {
        alertResetPassword('Die Passwörter müssen identisch sein.');
        alertResetPasswordRepeat();
        return false;
    }

    //regex
    if (!passwordRegEx.test(newPassword)) {
        let message = 'Das Passwort muss mindestens 8 Zeichen lang sein, Großbuchstaben, mindestens eine Zahl und ein Sonderzeichen enthalten.'
        alertResetPassword(message);
        return false;
    }

    return {
        'newPassword': newPassword,
        'newPasswordRepeat': newPasswordRepeat
    }
}

function openLoginForm(event) {
    event.preventDefault();

    createAccountDialog.removeAttribute('open');
    resetPasswordDialog.removeAttribute('open');
    sendResetPasswordMailDialog.removeAttribute('open');

    loginDialog.setAttribute('open', '');
    loginErrorMessageDisplay.style.color = 'var(--matteRed)';
    loginErrorMessageDisplay.innerText = '';
}

function openAccountCreationForm(event) {
    event.preventDefault();

    loginDialog.removeAttribute('open');

    createAccountDialog.setAttribute('open', '');
    accountCreationErrorMessageDisplay.style.color = 'var(--matteRed)';
    accountCreationErrorMessageDisplay.innerText = '';
}

function openSendResetPasswordMailDialog(event) {
    event.preventDefault();

    loginDialog.removeAttribute('open');

    sendResetPasswordMailDialog.setAttribute('open', '');
    sendResetPasswordMailErrorMessageDisplay.style.color = 'var(--matteRed)';
    sendResetPasswordMailErrorMessageDisplay.innerText = '';
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

// send password reset mail form

function alertSendAccountResetMailInput() {
    let alertRing = sendResetPasswordMailDialog.querySelector('#resetPasswordMail').parentElement;

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

// password reset form
function alertResetPassword(message) {
    let alertRing = resetPasswordDialog.querySelector('#resetPassword').parentElement;

    if (message) {
        resetPasswordErrorMessageDisplay.innerText = message;
    }

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

function alertResetPasswordRepeat() {
    let alertRing = resetPasswordDialog.querySelector('#resetPasswordRepeat').parentElement;

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}