import Lesson from '../Model/Lesson.js';
import View from '../View/LessonView.js';
import TaskController from './TaskController.js';

export default class LessonController {

    static getScheduledLessons() {
        return Lesson.getScheduledLessons();
    }

    static getTimetableChanges(mondayDate, sundayDate) {
        return Lesson.getTimetableChanges(mondayDate, sundayDate);
    }

    static getLessonObject(lessonData) {
        return this.#lessonDataToLessonObject(lessonData);
    }

    static getLessonById(id){
        return Lesson.getLessonById(id);
    }

    static saveNewLesson(lessonData) {

        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        
        lesson.save();
        View.renderNewLesson(lesson);
    }

    static updateLesson(lessonData){
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);

        lesson.update();
        View.renderNewLesson(lesson);
    }

    static setLessonCanceled(lessonData) {
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);

        lesson.cancel();
        
        return lesson.id;
    }

    static setLessonNotCanceled(lessonData) {
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);

        lesson.uncancel();       
    }

    static createNewTask(event) {
        TaskController.createNewTask(event);
    }

    static reorderTasks(lessonData, lessonCanceled = false){
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        
        TaskController.reorderTasks(lesson, lessonCanceled);
    }

    static #lessonDataToLessonObject (lessonData) {
        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.id = lessonData.id;
        lesson.weekday = lessonData.weekday;
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;
        lesson.status = lessonData.status = undefined ? 'normal' : lessonData.status;
        lesson.initialStatus = lessonData.initialStatus = undefined ? 'normal' : lessonData.initialStatus;

        return lesson;
    }
}