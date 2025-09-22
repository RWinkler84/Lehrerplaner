import AbstractView from "./AbstractView.js";
import Controller from "../Controller/LoginController.js";
import { ONEMIN } from "../index.js";

export default class LoginView extends AbstractView {

    static isAuth() {
        let loginDialog = document.querySelector('#loginDialog');
        let loginErrorMessageDisplay = loginDialog.querySelector('#loginErrorMessageDisplay');

        let params = new URLSearchParams(window.location.search);
        let status = params.get('auth');

        if (status == 'success') {
            loginErrorMessageDisplay.style.color = 'var(--matteGreen)';
            loginErrorMessageDisplay.innerText = 'Du hast deine Mail-Adresse erfolgreich authentifiziert. Du kannst dich jetzt anmelden.';
            window.history.replaceState('', '', `${window.location.origin}${window.location.pathname}`)
        } else if (status == 'failed') {
            loginErrorMessageDisplay.innerText = 'Die Authentifizierung ist fehlgeschlagen. Versuche es bitte später erneut.';
        }
    }

    static isReset() {
        let params = new URLSearchParams(window.location.search);
        let token = params.get('reset');

        if (token) {
            document.querySelector('#resetPasswordDialog').setAttribute('open', '');
            document.querySelector('#loginDialog').removeAttribute('open');
        }
    }

    static isRegister() {
        let params = new URLSearchParams(window.location.search);
        let token = params.get('register');

        if (token != null) {
            document.querySelector('#createAccountDialog').setAttribute('open', '');
            document.querySelector('#loginDialog').removeAttribute('open');
        }
    }

    static getLoginDataFromForm() {
        let userEmail = document.querySelector('#userEmail').value;
        let password = document.querySelector('#password').value;

        return {
            'userEmail': userEmail,
            'password': password
        };
    }

    static getAccountDataFromForm() {
        let createAccountDialog = document.querySelector('#createAccountDialog');
        let email = createAccountDialog.querySelector('#newUserEmail').value;
        let password = createAccountDialog.querySelector('#newPassword').value;
        let passwordRepeat = createAccountDialog.querySelector('#newPasswordRepeat').value;

        return {
            'userEmail': email,
            'password': password,
            'passwordRepeat': passwordRepeat
        }
    }

    static getResetPasswordMail() {
        let sendResetPasswordMailDialog = document.querySelector('#sendResetPasswordMailDialog');
        let userEmail = sendResetPasswordMailDialog.querySelector('#resetPasswordMail').value;

        return { userEmail: userEmail };
    }

    static openSendResetPasswordMailDialog() {

        let sendResetPasswordMailDialog = document.querySelector('#sendResetPasswordMailDialog');

        document.querySelector('#loginDialog').removeAttribute('open');

        sendResetPasswordMailDialog.setAttribute('open', '');
        sendResetPasswordMailErrorMessageDisplay.style.color = 'var(--matteRed)';
        sendResetPasswordMailErrorMessageDisplay.innerText = '';
    }

    static openLoginDialog() {
        let loginDialog = document.querySelector('#loginDialog');

        loginDialog.setAttribute('open', '');
    }

    static openCreateAccountDialog() {
        let createAccountDialog = document.querySelector('#createAccountDialog');
        createAccountDialog.setAttribute('open', '');
    }

    static closeLoginDialog() {
        let loginDialog = document.querySelector('#loginDialog');

        loginDialog.removeAttribute('open');
        loginDialog.querySelector('#userEmail').value = '';
        loginDialog.querySelector('#password').value = '';
        loginDialog.querySelector('#loginErrorMessageDisplay').innerText = 'Du bist aktuell nicht eingeloggt. Melde dich an, um Datenverlust zu vermeiden.';
    }

    static closeSendResetPasswordMailDialog() {
        let dialog = document.querySelector('#sendResetPasswordMailDialog');

        dialog.querySelector('#resetPasswordMail').value = '';
        dialog.removeAttribute('open');
    }

    static closeCreateAccountDialog() {
        let dialog = document.querySelector('#createAccountDialog');

        dialog.removeAttribute('open');
    }

    static closeResetPasswordDialog() {
        let dialog = document.querySelector('#resetPasswordDialog');

        dialog.removeAttribute('open');
        dialog.querySelector('#resetPassword').value = '';
        dialog.querySelector('#resetPasswordRepeat').value = '';
    }

    static attemptLogin(event) {
        event.preventDefault();
        let controller = new AbstractController;
        let loginDialog = document.querySelector('#loginDialog');

        let loginData = {
            'userEmail': loginDialog.querySelector('#userEmail').value,
            'password': loginDialog.querySelector('#password').value
        }

        controller.attemptLogin(loginData);
    }

    static showLoginErrorMessage(error, message) {
        let loginErrorDisplay = document.querySelector('#loginErrorMessageDisplay');

        loginErrorDisplay.style.color = 'var(--matteRed)';
        loginErrorDisplay.innerText = message;

        if (error == 'mail auth missing') {
            loginErrorDisplay.innerHTML += '<p><a href="" id="resendAuthMail" style="text-decoration: none;">Bestätigungsmail erneut senden?</a></p>';
            loginErrorDisplay.querySelector('#resendAuthMail').addEventListener('click', Controller.resendAuthMail);
        }

        if (error == 'wrong login credentials') {
            loginErrorDisplay.innerHTML += '<p><a href="" id="sendResetPasswordMail" style="text-decoration: none;">Passwort vergessen?</a></p>';
            loginErrorDisplay.querySelector('#sendResetPasswordMail').addEventListener('click', Controller.openSendResetPasswordMailDialog);
        }

        if (error == 'no server response' || error == 'database unreachable') {
            loginErrorDisplay.innerHTML += '<p><a href="" class="useTemporarilyOfflineButton" style="text-decoration: none;">Vorrübergehend offline nutzen</a></p>';
        }

        this.alertLoginErrorMessageDisplay();
    }

    static showSendResetPasswordMailResult(status, message) {
        let sendResetPasswordMailDialog = document.querySelector('#sendResetPasswordMailDialog');
        let errorMessageDisplay = sendResetPasswordMailDialog.querySelector('.errorMessageDisplay');


        if (status == 'success') {
            errorMessageDisplay.style.color = 'var(--matteGreen)';
            errorMessageDisplay.innerText = message;
        } else {
            errorMessageDisplay.style.color = 'var(--matteRed)';
            errorMessageDisplay.innerText = message;

        }
        setTimeout(() => { sendResetPasswordMailDialog.querySelector('#sendResetPasswordMailButton').style.display = 'inline-block' }, ONEMIN); //after 5 minutes you can resend the Authmail again, prevents spam
    }

    static showResetPasswordResult(status, message) {
        const resetPasswordDialog = document.querySelector('#resetPasswordDialog');
        const errorMessageDisplay = resetPasswordDialog.querySelector('.errorMessageDisplay');
        const navigation = resetPasswordDialog.querySelector('.navigation');

        if (status == 'success') {

            errorMessageDisplay.style.color = 'var(--matteGreen)';
            errorMessageDisplay.innerText = message;
            errorMessageDisplay.innerHTML += '<p><a href="" class="backToLoginLink" style="text-decoration: none">Zurück zum Login</a></p>';

            navigation.style.display = 'none';
            window.history.replaceState('', '', `${window.location.origin}${window.location.pathname}`)
            
            return;
        }

        errorMessageDisplay.innerText = message;
    }

    static showResendAuthMailResult(status, message) {
        const errorMessageDisplay = document.querySelector('#loginDialog').querySelector('.errorMessageDisplay');

        if (status == 'success') {
            errorMessageDisplay.style.color = 'var(--matteGreen)';
            errorMessageDisplay.innerHTML = message;
        } else {
            mailStatus.authMailAlreadySend = false;
            errorMessageDisplay.style.color = 'var(--matteRed)';
            errorMessageDisplay.innerText = message;
        }
    }

    static showMailAuthAlreadySendMessage() {
        const errorMessageDisplay = document.querySelector('#loginDialog').querySelector('.errorMessageDisplay');

        errorMessageDisplay.innerText = 'Es wurde bereits eine Authentifierungsmail geschickt. Überprüfe bitte deinen Posteingang oder Spam-Ordner.';
    }

    //form validation errors

    // Account Creation
    static alertAccountCreationEmail(message = false) {
        let createAccountDialog = document.querySelector('#createAccountDialog');
        let alertRing = createAccountDialog.querySelector('#newUserEmail').parentElement;

        if (message) {
            createAccountDialog.querySelector('#accountCreationErrorMessageDisplay').innerText = message;
        }

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertAccountCreationNewPassword(message = false) {
        let createAccountDialog = document.querySelector('#createAccountDialog');
        let alertRing = createAccountDialog.querySelector('#newPassword').parentElement;

        if (message) {
            accountCreationErrorMessageDisplay.innerText = message;
        }

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertAccountCreationNewPasswordRepeat(message = false) {
        let createAccountDialog = document.querySelector('#createAccountDialog');
        let alertRing = createAccountDialog.querySelector('#newPasswordRepeat').parentElement;

        if (message) {
            createAccountDialog.querySelector('#accountCreationErrorMessageDisplay').innerText = message;
        }

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertAccountCreationErrorMessageDisplay() {
        let createAccountDialog = document.querySelector('#createAccountDialog');

        accountCreationErrorMessageDisplay.classList.add('validationError');
        setTimeout(() => {
            accountCreationErrorMessageDisplay.classList.remove('validationError');
        }, 300);
    }

    //login form
    static alertLoginDialogEmailInput() {
        let alertRing = document.querySelector('#userEmail').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertLoginDialogPasswordInput() {
        let alertRing = document.querySelector('#password').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
    // send password reset mail form
    static alertSendAccountResetMailInput() {
        let alertRing = document.querySelector('#resetPasswordMail').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }


    //////////////////////////
    static getPasswordResetDataFromForm() {
        let resetPasswordDialog = document.querySelector('#resetPasswordDialog');
        let newPassword = resetPasswordDialog.querySelector('#resetPassword').value;
        let newPasswordRepeat = resetPasswordDialog.querySelector('#resetPasswordRepeat').value;
        let params = new URLSearchParams(window.location.search);
        let token = params.get('reset');

        return {
            'newPassword': newPassword,
            'newPasswordRepeat': newPasswordRepeat,
            'token': token
        }
    }

    //Validation alerts
    //Login

    static alertLoginErrorMessageDisplay() {
        let loginDialog = document.querySelector('#loginDialog');
        let loginErrorMessageDisplay = loginDialog.querySelector('#loginErrorMessageDisplay');

        loginErrorMessageDisplay.classList.add('validationError');
        setTimeout(() => {
            loginErrorMessageDisplay.classList.remove('validationError');
        }, 300);
    }


    // password reset form
    static alertResetPassword(message) {
        let resetPasswordDialog = document.querySelector('#resetPasswordDialog');
        let alertRing = resetPasswordDialog.querySelector('#resetPassword').parentElement;

        if (message) {
            resetPasswordErrorMessageDisplay.innerText = message;
        }

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertResetPasswordRepeat() {
        let resetPasswordDialog = document.querySelector('#resetPasswordDialog');
        let alertRing = resetPasswordDialog.querySelector('#resetPasswordRepeat').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}