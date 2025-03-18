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

        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;
        lesson.status = 'sub';

        lesson.save();
        View.renderNewLesson(lesson);
    }

    static setLessonCanceled(lessonData) {
        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;
        lesson.status = 'canceled';

        lesson.cancel();
    }

    static setLessonNotCanceled(lessonData) {
        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;

        lesson.uncancel();       
    }

    static createNewTask(event) {
        TaskController.createNewTask(event);
    }
}