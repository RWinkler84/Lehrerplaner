import AbstractController from "./AbstractController.js";
import View from "../View/LoginView.js";
import Model from "../Model/Login.js";

export default class LoginController extends AbstractController {

    static async openLoginDialog(event, forceOpen = false) {
        event?.preventDefault();
        
        console.log(event);
        let db = new Model;
        let accountInfo = await db.getAccountInfo();

        if (accountInfo.status == 'success' && accountInfo.temporarilyOffline == true) return;
        if (accountInfo.status == 'success' && accountInfo.accountType == 'guestUser' && !forceOpen) return;

        View.openLoginDialog();
        View.closeSendResetPasswordMailDialog();
        View.closeCreateAccountDialog();
        View.closeResetPasswordDialog();
    }

    static openCreateAccountDialog(event) {
        event?.preventDefault();

        View.openCreateAccountDialog();
        View.closeLoginDialog();
    }

    static openSendResetPasswordMailDialog(event) {
        event?.preventDefault();

        View.openSendResetPasswordMailDialog();
        View.closeLoginDialog();
    }

    static closeLoginDialog() {
        View.closeLoginDialog();
    }

    static closeSendResetPasswordMailDialog() {
        View.closeSendResetPasswordMailDialog();
    }

    static async attemptLogin(event) {
        event.preventDefault();

        let db = new Model;
        let loginData = View.getLoginDataFromForm();
        if (loginData.userEmail == '') {
            View.alertLoginDialogEmailInput();
            return { 'status': 'failed' };
        }

        if (loginData.password == '') {
            View.alertLoginDialogPasswordInput();
            return { 'status': 'failed' };
        }

        let result = await db.attemptLogin(loginData);


        if (result.status == 'success') {
            let abstCtrl = new AbstractController;

            View.closeLoginDialog();
            AbstractController.renderTopMenu();
            abstCtrl.syncData();
            window.history.replaceState('', '', `${window.location.origin}${window.location.pathname}`)
        } else {
            if (result.error == 'mail auth missing' && result.status == 'failed') View.showLoginErrorMessage('mail auth missing', result.message);
            if (result.error == 'wrong login credentials' && result.status == 'failed') View.showLoginErrorMessage('wrong login credentials', result.message);
            if (result.error == 'no server response' && result.status == 'failed') View.showLoginErrorMessage('no server response', result.message);
        }
    }

    static async attemptAccountCreation(event) {
        event.preventDefault();

        let accountData = View.getAccountDataFromForm();
        console.log(accountData);

        const mailRegEx = /^[^@]+@[^@]+\.[^@]+$/;
        const passwordRegEx = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        //empty
        if (accountData.userEmail == '') {
            View.alertAccountCreationEmail();
            return false;
        }

        if (accountData.password == '') {
            View.alertAccountCreationNewPassword();
            return false;
        }

        if (accountData.passwordRepeat == '') {
            alertAccountCreationNewPasswordRepeat();
            return false;
        }

        //different passwords
        if (accountData.password != accountData.passwordRepeat) {
            View.alertAccountCreationNewPassword('Die Passwörter müssen identisch sein.');
            View.alertAccountCreationNewPasswordRepeat();
            return false;
        }

        //regex
        if (!mailRegEx.test(accountData.userEmail)) {
            View.alertAccountCreationEmail('Ungültige E-Mail-Adresse');
            return false;
        }

        if (!passwordRegEx.test(accountData.password)) {
            let message = 'Das Passwort muss mindestens 8 Zeichen lang sein, Großbuchstaben, mindestens eine Zahl und ein Sonderzeichen enthalten.'
            View.alertAccountCreationNewPassword(message);
            return false;
        }

        if (accountData) {
            let db = new Model;

            document.querySelector('#submitNewAccountDataButton').style.display = 'none';
            let result = await db.attemptAccountCreation(accountData);

            if (result.message == 'Confirmation email send') {
                accountCreationErrorMessageDisplay.style.color = 'var(--matteGreen)';
                accountCreationErrorMessageDisplay.innerText = 'Erfolg! Eine Bestätigungsmail wurde an die angegebene Adresse gesendet. Bitte klicke den darin enthaltenen Link, damit du loslegen kannst.'
            } else {
                accountCreationErrorMessageDisplay.innerText = result.message;
                createAccountDialog.querySelector('#submitNewAccountDataButton').removeAttribute('style');

                View.alertAccountCreationErrorMessageDisplay();
            }
        }
    }

    static async createGuestAccount() {
        let db = new Model;
        await db.createGuestAccount();
    }

    static async sendResetPasswordMail(event) {
        event.preventDefault();

        let sendResetPasswordMailDialog = document.querySelector('#sendResetPasswordMailDialog');
        let sendResetPasswordButton = sendResetPasswordMailDialog.querySelector('#sendResetPasswordMailButton');

        let formData = View.getResetPasswordMail();
        let result;

        if (formData.userEmail == '') {
            View.alertSendAccountResetMailInput();
            return;
        }

        sendResetPasswordButton.style.display = 'none';

        let db = new Model;

        result = await db.sendResetPasswordMail(formData)

        let status = result.status == 'success' ? 'success' : 'failed';

        View.showSendResetPasswordMailResult(status, result.message);
    }

    static async attemptPasswordReset(event) {
        event.preventDefault();

        const passwordRegEx = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        let formData = View.getPasswordResetDataFromForm();

        if (formData) {
            //empty
            if (formData.newPassword == '') {
                View.alertResetPassword();
                return false;
            }

            if (formData.newPasswordRepeat == '') {
                View.alertResetPasswordRepeat();
                return false;
            }

            //different passwords
            if (formData.newPassword != formData.newPasswordRepeat) {
                View.alertResetPassword('Die Passwörter müssen identisch sein.');
                View.alertResetPasswordRepeat();
                return false;
            }

            //regex
            if (!passwordRegEx.test(formData.newPassword)) {
                let message = 'Das Passwort muss mindestens 8 Zeichen lang sein, Großbuchstaben, mindestens eine Zahl und ein Sonderzeichen enthalten.'
                View.alertResetPassword(message);
                return false;
            }

            let db = new Model;
            let result = await db.attemptPasswordReset(formData);
            let status = result.status == 'success' ? 'success' : 'failed';

            View.showResetPasswordResult(status, result.message);
        }
    }

    static async resendAuthMail(event) {
        event.preventDefault();

        if (Model.isAuthMailAlreadySend()) {
            View.showMailAuthAlreadySendMessage();
            return;
        }

        let db = new Model;
        let formData = View.getLoginDataFromForm();

        if (!formData.userEmail) {
            View.alertLoginDialogEmailInput();
            return;
        }

        let result = await db.resendAuthMail(formData);            
        let status = result.status == 'success' ? 'success' : 'failed';

        View.showResendAuthMailResult(status, result.message);
    }
    /** @param offlineStatus boolean: Should the app work temporarily offline or not? */
    static async toggleTemperaryOfflineUsage(offlineStatus, event = null) {
        if (event) {
            event.preventDefault();
            View.closeLoginDialog();
        }

        let db = new Model;
        await db.toggleTemperaryOfflineUsage(offlineStatus);
    }

    static isReset() {
        View.isReset();
    }

    static isAuth() {
        View.isAuth()
    }

    static isRegister() {
        View.isRegister()
    }
}