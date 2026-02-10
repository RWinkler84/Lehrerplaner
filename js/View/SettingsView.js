import Controller from "../Controller/SettingsController.js";
import Fn from "../inc/utils.js";

export default class SettingsView {

    static openSettings() {
        document.querySelector('#settingsContainer').style.display = 'flex';
        document.querySelector('main').style.filter = 'blur(3px)';
        document.querySelector('nav').style.filter = 'blur(3px)';
    }

    static closeSettings() {
        document.querySelector('#settingsContainer').style.display = 'none';
        document.querySelector('main').style.removeProperty('filter');
        document.querySelector('nav').style.removeProperty('filter');

    }

    static toggleSettingsMenu(event) {
        event.stopPropagation();
        let settingsMenuElement = document.querySelector('#settingsMenu');

        if (settingsMenuElement.style.display == 'flex') {
            this.closeSettingsMenu(event);
            return;
        }

        settingsMenuElement.style.display = 'flex';
        document.addEventListener('click', SettingsView.closeSettingsMenu);
    }

    static closeSettingsMenu(event) {
        if (event.target.id != 'settingsMenu') {
            document.querySelector('#settingsMenu').removeAttribute('style');
            document.removeEventListener('click', SettingsView.closeSettingsMenu);
        }
    }

    ////////////////////////////////
    // account settings functions //
    ////////////////////////////////

    static openAccountSettings(userInfo = null) {
        let accountSettingsContainer = document.querySelector('#accountSettingsContainer');

        document.querySelector('#openAccountSettingsButton').classList.add('selected');

        if (userInfo) {
            const notLoggedInMessage = accountSettingsContainer.querySelector('#eduplanioPlusNotLoggedInMessage');
            const eduplanioPlusStatusSpan = document.querySelector('#eduplanioPlusStatusSpan');
            const eduplanioPlusExpirationDateSpan = document.querySelector('#eduplanioPlusExpirationDateSpan');

            let expirationDateString = '-';
            let statusString = 'inaktiv';
            let statusTextClass = 'redText';

            if (userInfo.activeUntil) {
                const expirationDate = new Date(userInfo.activeUntil);
                const todayTimestamp = new Date().setHours(12, 0, 0, 0);

                if (expirationDate.setHours(12, 0, 0, 0) >= todayTimestamp) {
                    statusString = 'aktiv';
                    statusTextClass = 'greenText';
                }

                expirationDateString = Fn.formatDateWithFullYear(expirationDate);
            }

            eduplanioPlusStatusSpan.textContent = statusString;
            eduplanioPlusExpirationDateSpan.textContent = expirationDateString;

            notLoggedInMessage.classList.add('notDisplayed');
            eduplanioPlusStatusSpan.classList.add(statusTextClass);
        }

        //make account settings visible
        accountSettingsContainer.style.display = 'block';
    }

    static isAccountSettingsOpen() {
        let accountSettingsContainer = document.querySelector('#accountSettingsContainer');

        if (accountSettingsContainer.style.display == 'block') return true;

        return false;
    }

    static toogleAccountDeletionMenu(event) {
        let deleteAccountMenu = document.querySelector('#approveAccountDeletionContainer');
        let requestDeletionMenu = document.querySelector('#requestDeletionContainer');
        let deletionErrorDisplay = document.querySelector('#deletionErrorDisplay');

        if (event.target.id == 'deleteAccountButton') {
            requestDeletionMenu.style.display = 'none';
            deletionErrorDisplay.style.display = 'none';
            deleteAccountMenu.style.display = 'block';
        }

        if (event.target.id == 'cancelAccountDeletionButton') {
            requestDeletionMenu.style.display = 'block';
            deleteAccountMenu.style.display = 'none';
            deletionErrorDisplay.style.display = 'none';
        }

        if (event.target.id == 'cancelFailedAccountDeletionButton') {
            requestDeletionMenu.style.display = 'block';
            deleteAccountMenu.style.display = 'none';
            deletionErrorDisplay.style.display = 'none';
        }
    }

    static showAccountDeletionResult(status) {
        if (status == 'success') {
            alert('Dein Account wurde erfolgreich gelöscht.');
            Controller.logout();
        }

        if (status == 'failed') {
            document.querySelector('#deletionErrorDisplay').style.display = 'block';
            document.querySelector('#approveAccountDeletionContainer').style.display = 'none';
        }
    }

    static setVersionDisplay(version) {
        document.querySelector('#versionDisplay').textContent = version;
    }

    static openRegistrationNeededDialog() {
        document.querySelector('#registrationNeededDialog').showModal();
    }

    static closeRegistrationNeededDialog() {
        document.querySelector('#registrationNeededDialog').close();
    }

    static openCheckout(clickedPurchaseButton, newWindow) {
        const baselink = './stripe/checkout.html';

        let purchaseItem;

        if (clickedPurchaseButton.id == 'oneYearEduplanioPlusButton') purchaseItem = 'oneYear';
        if (clickedPurchaseButton.id == 'oneMonthEduplanioPlusButton') purchaseItem = 'oneMonth';

        newWindow.location.href = `${baselink}?item=${purchaseItem}`;
        window.focus();
    }
}