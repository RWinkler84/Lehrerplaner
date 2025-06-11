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

    static openLoginDialog() {
        AbstractView.openLoginDialog()
    }

    async attemptLogin(loginData) {
        if (loginData.userEmail == '') {
            AbstractView.alertLoginDialogEmailInput();
            return {'status': 'failed'};
            }

        if (loginData.password == '') {
            AbstractView.alertLoginDialogPasswordInput();
            return {'status': 'failed'};
            }

        let result =  await this.#db.makeAjaxQuery('user', 'login', loginData);

        console.log(result);

        if (result.status == 'success') {
            AbstractView.closeLoginDialog();
        } else {
            AbstractView.showLoginErrorMessage(result.message);
        }
    }

    checkDataState() {
        this.#db.checkDataState();
    }
}