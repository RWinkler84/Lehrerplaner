import Model from "../Model/AbstractModel.js";
import View from "../View/AbstractView.js";
import SettingsController from "./SettingsController.js";
import LessonController from "./LessonController.js";
import TaskController from "./TaskController.js";
import LoginController from "./LoginController.js";
import AbstractModel from "../Model/AbstractModel.js";

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

    /** @param status 'synced', 'unsynced' */
    static setSyncIndicatorStatus(status) {
        View.setSyncIndicatorStatus(status);
    }

    static setVersion(version) {
        let db = new Model;
        db.setVersion(version);
        SettingsController.setVersion(version);
    }

    static async toggleTemperaryOfflineUsage(offlineStatus) {
        await LoginController.toggleTemperaryOfflineUsage(offlineStatus);
    }

    async syncData() {
        await this.#db.syncData();
    }

    static async renderDataChanges(updatedElements = null) {
        if (updatedElements) {
            if (updatedElements.subjects) await SettingsController.renderSubjectChanges();
            if (updatedElements.timetable) await SettingsController.renderSettingsLessonChanges();
            if (updatedElements.timetableChanges) await LessonController.renderLesson();
            if (updatedElements.tasks) await TaskController.renderTaskChanges();
        }

        TaskController.renderTaskChanges();
        LessonController.renderLesson();
    }

    static async renderTopMenu() {
        let db = new AbstractModel;
        let userInfo = await db.getUserInfo();

        View.renderTopMenu(userInfo);
    }

    static topMenuClickEventHandler(event) {
        let target = event.target.id;

        switch (target) {
            case 'logoutButton':
                SettingsController.logout();
                break;

            case 'openLoginButton':
                LoginController.openLoginDialog(event, true);
                break;

            case 'openSettingsButton':
                View.openSettings();
                break;
 
            case 'openMenuButton':
                View.toggleTopMenu(event);
                break;

            case 'createAccountButton':
                LoginController.openCreateAccountDialog();
                break;
        }
    }
}