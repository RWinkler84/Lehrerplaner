import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";
import AbstractController from "./AbstractController.js";
import LessonController from "./LessonController.js";

export default class SettingsController {

    static saveSubject(subject) {
        let model = new Settings;

        if (subject.subject == '') {
            View.alertSubjectNameInput();
            return;
        }

        if (subject.colorCssClass == undefined) {
            View.alertColorSelection();
            return;
        }

        model.saveSubject(subject);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
    }

    static deleteSubject(id) {
        let model = new Settings;

        model.deleteSubject(id);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
    }

    static saveNewTimetable(validFrom, lessons) {
        let model = new Settings;

        if (validFrom == '') {
            View.alertValidFromPicker();
            return;
        }

        if (lessons.length == 0) {
            View.alertTimetable();
            return;
        }

        model.saveNewTimetable(lessons);

        View.discardNewTimetable();
    }

    static saveTimetableChanges(validFrom, lessons) {
        let model = new Settings;

        if (lessons.length == 0) {
            View.alertTimetable();
            return;
        }

        model.saveTimetableChanges(validFrom, lessons);

        View.discardNewTimetable();
    }

    static getScheduledLessons() {
        return LessonController.getScheduledLessons();
    }

    static getLessonObject(lessonData) {
        return LessonController.getLessonObject(lessonData);
    }

    static getAllSubjects(){
        return AbstractController.getAllSubjects();
    }
}