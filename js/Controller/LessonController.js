import Lesson from '../Model/Lesson.js';
import View from '../View/LessonView.js';
import SettingsController from './SettingsController.js';
import TaskController from './TaskController.js';
import LessonNoteController from './LessonNoteController.js';

export default class LessonController {

    static async renderLesson() {
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

    static async deleteLessonById(id) {
        let lesson = await Lesson.getLessonById(id);

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

        await this.setLessonCanceled(oldLessonData);

        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();

        await lesson.save();

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
    /** @param isNewTimetable bool, indicates, if the affected lessons fall into the validity timespan of a new or a an updated timetable, triggering different filter methods */
    static async filterAffectedLessonChanges(affectedLessonChanges, timetable, isNewTimetable) {
        let model = new Lesson;

        return await model.filterAffectedLessonChanges(affectedLessonChanges, timetable, isNewTimetable);
    }

    static async handleTimetableChangesCarryover(remainingLessonIds, timetableValidFromDate) {
        let model = new Lesson;

        await model.handleTimetableChangesCarryover(remainingLessonIds, timetableValidFromDate);
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

    static async getAllRegularLessons() {
        return await Lesson.getAllRegularLessons();
    }

    static async getRegularLessonsForCurrentWeek(monday, sunday) {
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

    static async getAllTasksInTimespan(startDate, endDate) {
        return await TaskController.getAllTasksInTimespan(startDate, endDate);
    }

    static renderLessonNote(event) {
        LessonNoteController.renderLessonNote(event);
    }

    static #lessonDataToLessonObject(lessonData) {
        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.id = lessonData.id;
        lesson.weekday = lessonData.weekday;
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;
        lesson.canceled = lessonData.canceled = undefined ? 'false' : lessonData.canceled;
        lesson.type = lessonData.type = undefined ? 'normal' : lessonData.type;
        lesson.created = lessonData.created;

        return lesson;
    }
}