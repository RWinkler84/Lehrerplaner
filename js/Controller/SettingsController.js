import { ONEDAY } from "../index.js";
import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";
import AbstractController from "./AbstractController.js";
import LessonController from "./LessonController.js";
import TaskController from "./TaskController.js";

export default class SettingsController {

    static saveSubject(subject) {
        let model = new Settings;

        if (subject.subject == '') {
            View.alertSubjectNameInput();
            return false;
        }

        if (subject.colorCssClass == undefined) {
            View.alertColorSelection();
            return false;
        }

        model.saveSubject(subject);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();

        return true;
    }

    static deleteSubject(id) {
        let model = new Settings;

        model.deleteSubject(id);

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

        if (View.isDateTaken()) {
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

    static saveTimetableChanges(validFrom, lessons) {
        let model = new Settings;
        let oldTimetable = LessonController.getOldTimetableCopy();
        let oldTimetableChanges = LessonController.getOldTimetableChanges();

        if (lessons.length == 0) {
            View.alertTimetable();
            return;
        }

        model.saveTimetableChanges(validFrom, lessons);

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

        console.log(result);

        if (result.status == 'success') {
            View.showAccountDeletionResult('success');
        } else {
            View.showAccountDeletionResult('failed');
        }
    }

    static deleteTaskById(id){
        TaskController.deleteTaskById(id);
    }

    static deleteLessonChangeById(id){
        LessonController.deleteLessonById(id);
    }

    static getScheduledLessons() {
        return LessonController.getScheduledLessons();
    }

    static getLessonObject(lessonData) {
        return LessonController.getLessonObject(lessonData);
    }

    static getAllSubjects() {
        return AbstractController.getAllSubjects();
    }
}