import Model from "../Model/AbstractModel.js";
import View from "../View/AbstractView.js";
import SettingsController from "./SettingsController.js";
import LessonController from "./LessonController.js";
import TaskController from "./TaskController.js";
import LoginController from "./LoginController.js";
import AbstractModel from "../Model/AbstractModel.js";
import SchoolYearController from "./SchoolYearController.js";
import CurriculumController from "./CurriculumController.js";

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

    static async getAllSchoolYears() {
        return await SchoolYearController.getAllSchoolYears();
    }

    static async greyOutHolidaysAndPassedDays() {
        const schoolYears = await AbstractController.getAllSchoolYears();

        await View.greyOutHolidaysAndPassedDays(schoolYears);
    }

    static openLoginDialog() {
        LoginController.openLoginDialog();
    }

    /** @param status 'synced', 'unsynced' */
    static setSyncIndicatorStatus(status, errorMessage = null) {
        View.setSyncIndicatorStatus(status, errorMessage);
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
            if (updatedElements.schoolYears) {
                await LessonController.renderCurriculaSelection();
                await LessonController.renderSelectedCurricula();
                await CurriculumController.renderSchoolYearCurriculumEditor();
                }
        }

        TaskController.renderTaskChanges();
        LessonController.renderLesson();
    }

    static async renderTopMenu() {
        let userInfo = await this.getUserInfo();

        View.renderTopMenu(userInfo);
    }

    static async getUserInfo() {
        let db = new AbstractModel;

        return await db.getUserInfo();
    }

    static openSupportDialog() {
        View.openSupportDialog();
    }

    static closeSupportDialog() {
        View.closeSupportDialog();
    }

    static async sendSupportTicket(event) {
        event.preventDefault();
        let formData = View.getSupportTicketContentFromForm();

        if (formData.userEmail == '') { View.alertSupportTicketUserEmail(); return; }
        if (formData.ticketTopic == '') { View.alertSupportTicketTopic(); return; }
        if (formData.ticketContent == '') { View.alertSupportTicketContent(); return; }
        // if (formData.captchaAnswer == '') { View.alertSupportTicketCaptcha(); return; } //not yet implemented

        const mailRegEx = /^[^@]+@[^@]+\.[^@]+$/;

        if (!mailRegEx.test(formData.userEmail)) {
            let message = 'Ungültige E-Mail-Adresse'
            View.alertSupportTicketUserEmail(message);
            return false;
        }

        View.toggleSupportDialogButtons('sending');

        let db = new AbstractModel;
        let result = await db.sendSupportTicket(formData);

        if (result.status == 'success') {
            result.message = 'Das Ticket wurde erfolgreich verschickt. Wir melden uns schnellstmöglich bei dir.'
            View.toggleSupportDialogButtons('success');
            View.displayMessageOnSupportDialog(result);
        } else {
            result.message = 'Da ist etwas schief gelaufen. Versuche es bitte später noch einmal.'
            View.toggleSupportDialogButtons('failed');
            View.displayMessageOnSupportDialog(result);
        }
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
                SettingsController.openSettings();
                break;

            case 'openMenuButton':
                View.toggleTopMenu(event);
                break;

            case 'createAccountButton':
                LoginController.openCreateAccountDialog();
                break;

            case 'openSupportDialogButton':
                AbstractController.openSupportDialog();
                break;
        }
    }
}