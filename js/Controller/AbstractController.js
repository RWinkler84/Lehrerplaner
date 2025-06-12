import Model from "../Model/AbstractModel.js";
import AbstractView from "../View/AbstractView.js";

export default class AbstractController {

    #db

    constructor() {
        this.#db = new Model();
    }

    async getSubjectsFromDatabase() {
        return await this.#db.makeAjaxQuery('abstract', 'getSubjects');
    }

    async getTimetableFromDatabase() {
        return await this.#db.makeAjaxQuery('abstract', 'getTimetable');
    }

    async getTimetableChangesFromDatabase() {
        return await this.#db.makeAjaxQuery('abstract', 'getTimetableChanges');
    }

    async getAllTasksFromDatabase() {
        return await this.#db.makeAjaxQuery('abstract', 'getAllTasks');
    }

    static getAllSubjects() {
        return Model.getAllSubjects();
    }

    static openLoginDialog(event) {
        console.log(event);
        if (event != undefined) event.preventDefault();
        AbstractView.openLoginDialog();
    }

    static closeLoginDialog() {
        AbstractView.closeLoginDialog();
    }

    static closeSendResetPasswordMailDialog() {
        AbstractView.closeSendResetPasswordMailDialog();
    }

    async attemptLogin(loginData) {
        if (loginData.userEmail == '') {
            AbstractView.alertLoginDialogEmailInput();
            return { 'status': 'failed' };
        }

        if (loginData.password == '') {
            AbstractView.alertLoginDialogPasswordInput();
            return { 'status': 'failed' };
        }

        let result = await this.#db.makeAjaxQuery('user', 'login', loginData);

        if (result.status == 'success') {
            AbstractView.closeLoginDialog();
        } else {
            AbstractView.showLoginErrorMessage(result.message);
        }
    }

    async sendResetPasswordMail(event) {
        event.preventDefault();

        let sendResetPasswordMailDialog = document.querySelector('#sendResetPasswordMailDialog');
        let sendResetPasswordButton = sendResetPasswordMailDialog.querySelector('#sendResetPasswordMailButton');
        let errorMessageDisplay = sendResetPasswordMailDialog.querySelector('.errorMessageDisplay');
        let userEmail = sendResetPasswordMailDialog.querySelector('#resetPasswordMail').value;
        let result;

        if (userEmail == '') {
            AbstractView.alertSendAccountResetMailInput();
            return;
        }

        sendResetPasswordButton.style.display = 'none';

        result = await this.#db.makeAjaxQuery('user', 'sendPasswortResetMail', { 'userEmail': userEmail });

        if (result.status == 'success') {
            errorMessageDisplay.style.color = 'var(--matteGreen)';
            errorMessageDisplay.innerText = result.message;
        } else {
            resetMailAlreadySend = false;
            errorMessageDisplay.style.color = 'var(--matteRed)';
            errorMessageDisplay.innerText = result.message;


            setTimeout(() => { sendResetPasswordButton.style.display = 'inline-block' }, ONEMIN * 5); //after 5 minutes you can resend the Authmail again, prevents spam
            return;
        }

    }

    checkDataState() {
        this.#db.checkDataState();
    }
}