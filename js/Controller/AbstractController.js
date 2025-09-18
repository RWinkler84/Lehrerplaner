import Model from "../Model/AbstractModel.js";
import View from "../View/AbstractView.js";
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

    /** @param status 'synced', 'unsynced' */
    static setSyncIndicatorStatus(status) {
        View.setSyncIndicatorStatus(status);
    }

    static async toggleTemperaryOfflineUsage(offlineStatus) {
        await LoginController.toggleTemperaryOfflineUsage(offlineStatus);
    }

    async syncData() {
        await this.#db.syncData();
    }

    static async renderDataChanges(updatedElements = null) {
        if (updatedElements) {
            console.log('updatedElements ', updatedElements);
            if (updatedElements.subjects) await SettingsController.renderSubjectChanges();
            if (updatedElements.timetable) await SettingsController.renderSettingsLessonChanges();
            if (updatedElements.timetableChanges) await LessonController.renderLesson();
            if (updatedElements.tasks) await TaskController.renderTaskChanges();
        }

        TaskController.renderTaskChanges();
        LessonController.renderLesson();
    }
}