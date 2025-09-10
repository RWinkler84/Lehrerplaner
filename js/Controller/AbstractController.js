import Model from "../Model/AbstractModel.js";
import SettingsController from "./SettingsController.js";
import LessonController from "./LessonController.js";
import TaskController from "./TaskController.js";
import LoginController from "./LoginController.js";

export default class AbstractController {

    #db

    constructor() {
        this.#db = new Model();
    }

    async getAllTasks() {
        return await TaskController.getAllTasks();
    }

    static async getAllSubjects() {
        return await SettingsController.getAllSubjects();
    }

    static async getAllRegularLessons() {
        return await LessonController.getAllRegularLessons();
    }

    static async getAllTimetableChanges() {
        return await LessonController.getAllTimetableChanges();
    }

    static openLoginDialog() {
        LoginController.openLoginDialog();
    }

    /** @param status 'synced', 'unsynced' 'loggedOut' */
    static setSyncIndicatorStatus(status) {
        let syncIndicator = document.querySelector('#syncIndicator');

        syncIndicator.removeAttribute('class');

        switch (status) {
            case 'synced':
                syncIndicator.classList.add('synced');
                break;
            case 'unsynced':
                syncIndicator.classList.add('unsynced');
                break;
            case 'loggedOut':
                syncIndicator.classList.add('loggedOut');
                break;
        }
    }


    async syncData() {
        await this.#db.syncData();
    }

    static renderDataChanges() {
        TaskController.renderTaskChanges();
        LessonController.renderLesson();
    }
}