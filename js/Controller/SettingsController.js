import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";
import AbstractController from "./AbstractController.js";
import LessonController from "./LessonController.js";
import Fn from '../inc/utils.js';
import AbstractModel from "../Model/AbstractModel.js";


export default class SettingsController {

    static logout() {
        let model = new Settings;
        model.logout();
    }

    static async checkForPendingLogout() {
        let model = new Settings;
        model.checkForPendingLogout();
    }

    static async deleteAccount() {
        let model = new Settings;
        let result = await model.deleteAccount();

        if (result.status == 'success') {
            View.showAccountDeletionResult('success');
        } else {
            View.showAccountDeletionResult('failed');
        }
    }

    static async attemptEduplanioPlusPurchase(clickedPurchaseButton, newWindow) {
        const userInfo = await AbstractController.getUserInfo();

        if (userInfo.accountType != 'registeredUser') {
            newWindow.close();
            this.openRegistrationNeededDialog();

            return;
        }

        View.openCheckout(clickedPurchaseButton, newWindow);
    }

    static openRegistrationNeededDialog() {
        View.openRegistrationNeededDialog();
    }

    static closeRegistrationNeededDialog() {
        View.closeRegistrationNeededDialog();
    }


    static setVersion(version) {
        View.setVersionDisplay(version);
    }

    static async openSettings() {
        const userInfo = await AbstractController.getUserInfo();

        View.openAccountSettings(userInfo);
        View.openSettings();
    }

    static async openAccountSettings() {
        const userInfo = await AbstractController.getUserInfo();

        if (userInfo.accountType == 'registeredUser' && userInfo.temporarilyOffline == false) {
            View.openAccountSettings(userInfo);
            return;
        }

        View.openAccountSettings();
    }


    /** If a user purchases is plus licence and returns to the site, the already open account settings window 
        should be rerendered so that the new expiration date is visible without manual reloading. Only executes, if the account window is open. */
    static rerenderAccountSettingsAfterPlusPurchase() {
        if (View.isAccountSettingsOpen()) {
            this.openAccountSettings();
        };
    }

    /**  @param status: boolean true or false */
    static setExpirationWarningDismissedStatus(status) {
        const model = new Settings();
        model.setExpirationWarningDismissedStatus(status);
    }

    static async getExpirationWarningDismissedStatus() {
        const model = new Settings();
        return await model.getExpirationWarningDismissedStatus();
    }

    static async getAllRegularLessons() {
        return await LessonController.getAllRegularLessons();
    }

    static async attemptPlusRevocation() {
        const formData = View.getRevocationFormData();

        if (!formData.userName) {
            View.alertRevocationDialogUserNameInput();
            return;
        }

        if (!formData.email || !Fn.isValidEmail(formData.email)) {
            View.alertRevocationDialogEmailInput();
            return;
        }

        if (!formData.invoiceId) {
            View.alertRevocationInvoiceIdInput();
            return;
        }

        View.toggleRevocationDialogButtons('sending');

        const db = new AbstractModel;
        const result = await db.sendPlusRevocation(formData);

        result.status = 'success';

        if (result.status == 'success') {
            result.message = 'Dein Widerruf wurde erfolgreich übermittelt und eine Bestätigungsmail an die von dir angegeben Adresse gesendet. Wir melden uns schnellstmöglich bei dir.'
            View.toggleRevocationDialogButtons('success');
            View.displayMessageOnRevocationDialog(result);
        } else {
            result.message = 'Da ist etwas schief gelaufen. Versuche es bitte später noch einmal.'
            View.toggleRevocationDialogButtons('failed');
            View.displayMessageOnRevocationDialog(result);
        }
    }

    static openRevocationDialog() {
        View.openRevocationDialog();
    }

    static closeRevocationDialog() {
        View.closeRevocationDialog();
    }

    static async settingsClickEventHandler(event) {
        let target = event.target;

        switch (target.id) {
            //top menu
            case 'openSettingsMenuButton':
                View.toggleSettingsMenu(event);
                break;

            case 'openAccountSettingsButton':
                SettingsController.openAccountSettings();
                break;

            case 'closeSettingsButton':
            case 'closeSettingsButtonResponsive':
                View.closeSettings();
                break;

            //account settings
            case 'oneMonthEduplanioPlusButton':
            case 'oneYearEduplanioPlusButton':
                //just for Safari open the window instantly and then pass it around
                const newWindow = window.open('', '_blank');

                SettingsController.attemptEduplanioPlusPurchase(target, newWindow);
                break;

            case 'revokePlusButton':
                SettingsController.openRevocationDialog();
                break;

            case 'deleteAccountButton':
                View.toggleAccountDeletionMenu(event);
                break;

            case 'approveAccountDeletionButton':
                SettingsController.deleteAccount();

            case 'cancelAccountDeletionButton':
                View.toggleAccountDeletionMenu(event);
                break;

            case 'cancelFailedAccountDeletionButton':
                View.toggleAccountDeletionMenu(event);
                break;
        }
    }
}