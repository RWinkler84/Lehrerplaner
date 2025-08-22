import Lesson from '../Model/Lesson.js';
import View from '../View/LessonView.js';
import SettingsController from './SettingsController.js';
import TaskController from './TaskController.js';

export default class LessonController {

    static async getAllRegularLessons() {
        return await Lesson.getAllRegularLessons();
    }

    static async getRegularLessonsForCurrentWeek(monday, sunday){
        return await Lesson.getRegularLessonsForCurrentWeek(monday, sunday);
    }

    static async getAllTimetableChanges() {
        return await Lesson.getAllTimetableChanges();
    }

    static async getTimetableChanges(startDate, endDate) {
        return await Lesson.getTimetableChanges(startDate, endDate);
    }

    static getLessonObject(lessonData) {
        return this.#lessonDataToLessonObject(lessonData);
    }

    static async getLessonById(id) {
        return await Lesson.getLessonById(id);
    }

    static renderLesson(){
        View.renderLesson();
    }

    static async saveNewLesson(lessonData) {

        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();

        if (lessonData.class == '' && lessonData.subject != 'Termin') {
            View.alertClassInput();
            return false;
        }

        if (lessonData.subject == '') {
            View.alertSubjectSelect();
            return false;
        }

        await lesson.save();

        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        this.renderLesson();
    }

    static deleteLessonById(id) {
        let lesson = Lesson.getLessonById(id);

        lesson.delete();
    }

    static async updateLesson(lessonData, oldLessonData) {

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
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();
        
        await lesson.update();

        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        this.renderLesson();
    }

    static async setLessonCanceled(lessonData) {
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();

        await lesson.cancel();

        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        this.renderLesson();

        return lesson.id;
    }

    static async setLessonNotCanceled(lessonData) {
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();

        await lesson.uncancel();

        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        this.renderLesson();
    }

    static createNewTask(event) {
        TaskController.createNewTask(event);
    }

    static async getOldTimetableCopy() {
        return await Lesson.getOldTimetableCopy();
    };

    static async getOldTimetableChanges() {
        return await Lesson.getOldTimetableChanges();
    };

    static async getAllSubjects() {
        return await SettingsController.getAllSubjects();
    }

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