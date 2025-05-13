import Lesson from '../Model/Lesson.js';
import View from '../View/LessonView.js';
import TaskController from './TaskController.js';

export default class LessonController {

    static getScheduledLessons() {
        return Lesson.getScheduledLessons();
    }

    static getScheduledLessonsForCurrentlyDisplayedWeek(monday, sunday){
        return Lesson.getScheduledLessonsForCurrentlyDisplayedWeek(monday, sunday);
    }

    static getTimetableChanges(mondayDate, sundayDate) {
        return Lesson.getTimetableChanges(mondayDate, sundayDate);
    }

    static getLessonObject(lessonData) {
        return this.#lessonDataToLessonObject(lessonData);
    }

    static getLessonById(id) {
        return Lesson.getLessonById(id);
    }

    static renderLesson(){
        View.renderLesson();
    }

    static saveNewLesson(lessonData) {

        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = Lesson.getOldTimetableCopy();
        let oldTimetableChanges = Lesson.getOldTimetableChanges();

        if (lessonData.class == '' && lessonData.subject != 'Termin') {
            View.alertClassInput();
            return false;
        }

        if (lessonData.subject == '') {
            View.alertSubjectSelect();
            return false;
        }

        lesson.save();
        View.renderNewLesson(lesson);

        TaskController.reorderTasks(oldTimetable, oldTimetableChanges);

    }

    static updateLesson(lessonData, oldLessonData) {

        if (lessonData.class == '' && lessonData.subject != 'Termin') {
            View.alertClassInput();
            return false;
        }

        if (lessonData.subject == '') {
            View.alertSubjectSelect();
            return false;
        }

        this.setLessonCanceled(oldLessonData);

        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = Lesson.getOldTimetableCopy();
        let oldTimetableChanges = Lesson.getOldTimetableChanges();
        lesson.update();

        TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        View.renderNewLesson(lesson);
    }

    static setLessonCanceled(lessonData) {
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = Lesson.getOldTimetableCopy();
        let oldTimetableChanges = Lesson.getOldTimetableChanges();

        lesson.cancel();

        TaskController.reorderTasks(oldTimetable, oldTimetableChanges);


        return lesson.id;
    }

    static setLessonNotCanceled(lessonData) {
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = Lesson.getOldTimetableCopy();
        let oldTimetableChanges = Lesson.getOldTimetableChanges();

        lesson.uncancel();

        TaskController.reorderTasks(oldTimetable, oldTimetableChanges);

    }

    static createNewTask(event) {
        TaskController.createNewTask(event);
    }

    static getOldTimetableCopy() {
        return Lesson.getOldTimetableCopy();
    };

    static getOldTimetableChanges() {
        return Lesson.getOldTimetableChanges();
    };

    static #lessonDataToLessonObject(lessonData) {
        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.id = lessonData.id;
        lesson.weekday = lessonData.weekday;
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;
        lesson.canceled = lessonData.canceled = undefined ? 'false' : lessonData.canceled;
        lesson.type = lessonData.type = undefined ? 'normal' : lessonData.type;

        return lesson;
    }
}