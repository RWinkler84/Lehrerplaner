import Lesson from '../Models/Lesson.js';

export default class LessonController{
    lesson;

    constructor(){
        this.lesson = new Lesson;
    }

    static getScheduledLessons() {
        return Lesson.getScheduledLessons();
    }

    static getTimetableChanges(mondayDate, sundayDate) {
        return Lesson.getTimetableChanges(mondayDate, sundayDate);
    }

}