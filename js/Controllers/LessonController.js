import Lesson from '../Models/Lesson.js';
import View from '../Views/LessonView.js';
import TaskController from './TaskController.js';

export default class LessonController {

    static getScheduledLessons() {
        return Lesson.getScheduledLessons();
    }

    static getTimetableChanges(mondayDate, sundayDate) {
        return Lesson.getTimetableChanges(mondayDate, sundayDate);
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
    }

    static setLessonNotCanceled(lessonData) {
        let lesson = new Lesson(lessonData.class, lessonData.subject);

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

        lesson.weekday = lessonData.weekday;
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;
        lesson.status = lessonData.status = undefined ? 'normal' : lessonData.status;

        return lesson;
    }
}