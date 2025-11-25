import { ONEDAY } from "../index.js";
import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";
import CurriculumController from "./CurriculumController.js";
import LessonController from "./LessonController.js";
import LessonNoteController from "./LessonNoteController.js";
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
        LessonController.renderLesson();
        View.renderLessons()

        return true;
    }

    static async deleteSubject(id) {
        let model = new Settings;

        await model.deleteSubject(id);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
        View.renderLessons()
        LessonController.renderLesson();
    }

    static async saveNewTimetable(validFrom, lessons) {
        let model = new Settings;
        let oldTimetable = await LessonController.getOldTimetableCopy();
        let oldTimetableChanges = await LessonController.getOldTimetableChanges();

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
        let validUntil = lessons[0].validUntil == null || lessons[0].validUntil == 'null' ? (new Date().setHours(12) + ONEDAY * 365) : lessons[0].validUntil;

        let affectedLessonChanges = await LessonController.getTimetableChanges(validFrom, validUntil);
        let affectedTasks = await TaskController.getAllTasksInTimespan(validFrom, validUntil);

        if (affectedLessonChanges.length > 0 || affectedTasks.length > 0) {
            let filteredLessonChanges = await LessonController.filterAffectedLessonChanges(affectedLessonChanges, lessons, true);
            View.renderLessonChangesAndTasksToKeepDialog(filteredLessonChanges, affectedTasks, validFrom);
        }

        //triggers reordering of tasks for each lesson
        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        await LessonNoteController.reorderLessonNotes(oldTimetable, oldTimetableChanges);
        LessonController.renderLesson();


        View.discardNewTimetable();
    }

    static async isDateTaken() {
        return await View.isDateTaken();
    }

    static async saveTimetableUpdates(validFrom, lessons) {
        let model = new Settings;
        let oldTimetable = await LessonController.getOldTimetableCopy();
        let oldTimetableChanges = await LessonController.getOldTimetableChanges();
        let today = new Date();
        let startDate = today.getTime() > new Date(validFrom).getTime() ? today : new Date(validFrom);

        if (lessons.length == 0) {
            View.alertTimetable();
            return;
        }

        await model.saveTimetableUpdates(validFrom, lessons);

        // check, whether future lesson changes and tasks exist that are affected by the timetable edit
        let validUntil = lessons[0].validUntil == null || lessons[0].validUntil == 'null' ? (new Date().setHours(12) + ONEDAY * 365) : lessons[0].validUntil;

        let affectedLessonChanges = await LessonController.getTimetableChanges(startDate, validUntil);
        let affectedTasks = await TaskController.getAllTasksInTimespan(startDate, validUntil);

        if (affectedLessonChanges.length > 0 || affectedTasks.length > 0) {
            let filteredLessonChanges = await LessonController.filterAffectedLessonChanges(affectedLessonChanges, lessons, false);
            View.renderLessonChangesAndTasksToKeepDialog(filteredLessonChanges, affectedTasks, validFrom);
        }

        LessonController.renderLesson();
        TaskController.reorderTasks(oldTimetable, oldTimetableChanges);

        View.discardNewTimetable();
    }

    static async handleTimetableChangesCarryover(remainingLessonIds, timetableValidFromDate) {
        await LessonController.handleTimetableChangesCarryover(remainingLessonIds, timetableValidFromDate);
        LessonController.renderLesson();
        TaskController.renderTaskChanges();
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

    static async renderSettingsLessonChanges() {
        await View.setDateOfTimetableToDisplay();
        await View.renderLessons();
    }

    static async renderSubjectChanges() {
        await View.renderExistingSubjects();
    }

    static async renderSelectableLessonColorsChanges() {
        await View.renderSelectableLessonColors();
    }

    static renderLesson() {
        LessonController.renderLesson();
    }

    static renderTaskChanges() {
        TaskController.renderTaskChanges();
    }

    static async getAllSubjects() {
        let model = new Settings;
        return await model.getAllSubjects();
    }

    static setVersion(version) {
        View.setVersionDisplay(version);
    }

    static openSettings() {
        View.openSettings();
    }

    static settingsClickEventHandler(event) {
        let target = event.target.id;

        switch (target) {
            //top menu
            case 'openSettingsMenuButton':
                View.toggleSettingsMenu(event);
                break;

            case 'openTimetableSettingsButton':
                View.openTimetableSettings();
                break;
            
            case 'openCurriculumEditorButton':
                View.openCurriculumEditor();
                CurriculumController.renderEmptyCalendar();
                break

            case 'openAccountSettingsButton':
                View.openAccountSettings();
                break;

            case 'closeSettingsButton': //fall through
            case 'closeSettingsButtonResponsive':
                View.closeSettings();
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