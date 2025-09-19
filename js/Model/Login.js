import AbstractModel from "./AbstractModel.js";
import Controller from "../Controller/LoginController.js";
import { mailStatus, ONEMIN } from "../index.js";

export default class Login extends AbstractModel {

    async attemptLogin(loginData) {

        const errorMessageDisplay = loginDialog.querySelector('.errorMessageDisplay');
        let result;

        if (loginData) {
            result = await this.makeAjaxQuery('user', 'login', loginData);
            if (result.status == 'success') await this.updateAccountType();

            return result;
        }
    }

    async attemptPasswordReset(formData) {

        let result = await this.makeAjaxQuery('user', 'resetPassword', formData);
        return result;
    }

    async createGuestAccount() {
        let data = {
            id: 1,
            accountType: 'guestUser',
            temporarilyOffline: true
        }

        this.writeToLocalDB('settings', data);
    }

    async updateAccountType() {
        let accountInfo = await this.getAccountInfo();

        if (accountInfo.status == 'failed' || accountInfo.accountType == 'guestUser') {
            let db = await this.openIndexedDB();
            db.transaction('settings', 'readwrite').objectStore('settings').put({ id: 1, accountType: 'registeredUser', temporarilyOffline: false });
        }
    }

    async attemptAccountCreation(accountData) {

        let result = await this.makeAjaxQuery('user', 'createAccount', accountData);
        if (result.status == 'success') this.updateOnLocalDB('settings', { id: 1, accountType: 'registeredUser', temporarilyOffline: false })

        return result;
    }
    async toggleTemperaryOfflineUsage(offlineStatus) {
        let accountInfo = await this.getAccountInfo();
        
        if (accountInfo.status == 'failed'){
            await Controller.createGuestAccount();
            accountInfo = await this.getAccountInfo();
            }

        this.updateOnLocalDB('settings', {id: 1, accountType: accountInfo.accountType, temporarilyOffline: offlineStatus});
    }

    async getAccountInfo() {
        let accountInfo = await this.readFromLocalDB('settings', 1);

        if (!accountInfo) return { status: 'failed' };

        return {
            status: 'success',
            ...accountInfo
        }
    }

    async resendAuthMail(formData) {

        if (!mailStatus.authMailAlreadySend) {
            mailStatus.authMailAlreadySend = true;
            setTimeout(() => { mailStatus.authMailAlreadySend = false; }, ONEMIN * 5); //after 5 minutes you can resend the Authmail again, prevents spam

            let result = await this.makeAjaxQuery('user', 'resendAuthMail', { 'userEmail': formData.userEmail });

            if (result.status == 'failed') mailStatus.authMailAlreadySend = false;

            return result;
        }
    }

    static isAuthMailAlreadySend() {
        if (mailStatus.authMailAlreadySend == true) return true;

        return false;
    }

    async sendResetPasswordMail(formData) {

        if (!mailStatus.resetMailAlreadySend) {
            mailStatus.resetMailAlreadySend = true;
            setTimeout(() => { mailStatus.resetMailAlreadySend = false; }, ONEMIN * 5);

            let result = await this.makeAjaxQuery('user', 'sendPasswortResetMail', { 'userEmail': formData.userEmail });

            if (result.status == 'failed') mailStatus.resetMailAlreadySend = false;

            return result;
        }

        return {
            status: 'failed',
            message: 'Es wurde bereits eine Reset-Mail geschickt. Überprüfe bitte deinen Posteingang oder Spam-Ordner.'
        };
    }
}