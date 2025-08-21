import { ONEDAY } from "../index.js";
import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";
import LessonController from "./LessonController.js";
import TaskController from "./TaskController.js";

export default class SettingsController {

    static async saveSubject(subject) {
        let model = new Settings;

        if (subject.subject == '') {
            View.alertSubjectNameInput();
            return false;
        }

        if (subject.colorCssClass == undefined) {
            View.alertColorSelection();
            return false;
        }

        await model.saveSubject(subject);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();

        return true;
    }

    static async deleteSubject(id) {
        let model = new Settings;

        await model.deleteSubject(id);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
    }

    static async saveNewTimetable(validFrom, lessons) {
        let model = new Settings;
        let oldTimetable = LessonController.getOldTimetableCopy();
        let oldTimetableChanges = LessonController.getOldTimetableChanges();

        if (validFrom == '') {
            View.alertValidFromPicker();
            return;
        }

        if (lessons.length == 0) {
            View.alertTimetable();
            return;
        }

        if (await View.isDateTaken()) {
            View.alertValidFromPicker();
            return;
        }

        await model.saveNewTimetable(lessons);

        // check, whether lesson Changes exist after the validFrom date of the new timetable
        let validUntil = lessons[0].validUntil ? lessons[0].validUntil : (new Date().setHours(12) + ONEDAY * 365);

        let affectedLessonChanges = LessonController.getTimetableChanges(validFrom, validUntil);
        let affectedTasks = TaskController.getAllTasksInTimespan(validFrom, validUntil);
        console.log('changes', affectedLessonChanges);
        console.log('tasks', affectedTasks);

        if (affectedLessonChanges.length > 0 || affectedTasks.length > 0) View.renderLessonChangesAndTasksToKeepDialog(affectedLessonChanges, affectedTasks);

        //triggers reordering of tasks for each lesson
        LessonController.renderLesson();
        TaskController.reorderTasks(oldTimetable, oldTimetableChanges);

        View.discardNewTimetable();
    }

    static async saveTimetableUpdates(validFrom, lessons) {
        let model = new Settings;
        let oldTimetable = LessonController.getOldTimetableCopy();
        let oldTimetableChanges = LessonController.getOldTimetableChanges();

        if (lessons.length == 0) {
            View.alertTimetable();
            return;
        }

        await model.saveTimetableUpdates(validFrom, lessons);

        LessonController.renderLesson();
        TaskController.reorderTasks(oldTimetable, oldTimetableChanges);

        View.discardNewTimetable();
    }

    static logout() {
        let model = new Settings;
        model.logout();
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

    static deleteTaskById(id) {
        TaskController.deleteTaskById(id);
    }

    static deleteLessonChangeById(id) {
        LessonController.deleteLessonById(id);
    }

    static async getAllRegularLessons() {
        return await LessonController.getAllRegularLessons();
    }

    static async getLessonObject(lessonData) {
        return LessonController.getLessonObject(lessonData);
    }

    static async getAllSubjects() {
        let model = new Settings;
        return await model.getAllSubjects();
    }

        static settingsClickEventHandler(event) {
        let target = event.target.id;

        switch (target) {
            //top menu
            case 'openTimetableSettingsButton':
                View.openTimetableSettings();
                break;

            case 'openAccountSettingsButton':
                View.openAccountSettings();
                break;

            //timetable settings
            case 'createSubjectButton':
                View.saveSubject();
                break;

            case 'timetableBackwardButton':
                View.changeDisplayedTimetable(event);
                break;

            case 'timetableForwardButton':
                View.changeDisplayedTimetable(event);
                break;

            case 'createNewTimetableButton':
                View.makeTimetableEditable();
                break;

            case 'saveNewTimetableButton':
                View.saveNewTimetable();
                break;

            case 'discardNewTimetableButton':
                View.discardNewTimetable();
                break;

            case 'editTimetableButton':
                View.makeLessonsEditable();
                break;

            case 'saveTimetableUpdatesButton':
                View.saveTimetableUpdates();
                break;

            case 'discardTimetableChangesButton':
                View.discardNewTimetable();
                break;

            //account settings
            case 'deleteAccountButton':
                View.toogleAccountDeletionMenu(event);
                break;

            case 'approveAccountDeletionButton':
                SettingsController.deleteAccount();

            case 'cancelAccountDeletionButton':
                View.toogleAccountDeletionMenu(event);
                break;

            case 'cancelFailedAccountDeletionButton':
                View.toogleAccountDeletionMenu(event);
                break;
        }

        //identify items by class
        switch (true) {
            case event.target.classList.contains('deleteItemButton'):
                View.deleteSubject(event);
                break;
        }
    }
}