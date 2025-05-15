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

    static saveNewTimetable(validFrom, lessons) {
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

        model.saveNewTimetable(lessons);

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