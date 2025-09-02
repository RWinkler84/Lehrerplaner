import AbstractModel from "./AbstractModel.js";
import { ONEDAY} from "../index.js";
import Fn from '../inc/utils.js';
import LessonController from "../Controller/LessonController.js";


export default class Lesson extends AbstractModel {

    #id;
    #class;
    #subject;
    #weekday;
    #date;
    #timeslot;
    #type;
    #canceled;
    #validFrom; //date a regular lesson was added to the scheduled timetable
    #validUntil;
    #cssColorClass
    #lastEdited;

    constructor(className, subject) {
        super();

        this.#class = className;
        this.#subject = subject;
    }

    // static class methods
    static async getAllRegularLessons() {
        let db = new AbstractModel;
        let standardTimetable = await db.readAllFromLocalDB('timetable');
        let regularLessons = [];

        standardTimetable.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.id = entry.id;
            lesson.weekday = entry.weekday;
            lesson.timeslot = entry.timeslot;
            lesson.validFrom = entry.validFrom;
            lesson.type = 'normal';
            lesson.validFrom = entry.validFrom;
            lesson.validUntil = entry.validUntil;
            lesson.lastEdited = entry.lastEdited;

            regularLessons.push(lesson);
        });

        standardTimetable.sort((a, b) => {
            return new Date(a.validFrom).setHours(12, 0, 0, 0) - new Date(b.validFrom).setHours(12, 0, 0, 0);
        });

        return regularLessons;
    }

    static async getRegularLessonsForCurrentWeek(monday, sunday) {
        let scheduledLessons = await this.getAllRegularLessons()
        let mondayDate = new Date(monday).setHours(12, 0, 0, 0);
        let sundayDate = new Date(sunday).setHours(12, 0, 0, 0);
        let validLessons = [];

        scheduledLessons.forEach(lesson => {
            let lessonValidFrom = new Date(lesson.validFrom).setHours(12, 0, 0, 0)
            let lessonValidUntil = new Date(lesson.validUntil).setHours(12, 0, 0, 0);

            //to check whether a lesson is valid for the current week it needs a validUntil date even it has none yet
            //which is the standard for the latest timetable in the database
            if (!lesson.validUntil) lessonValidUntil = new Date().setHours(12, 0, 0, 0) + ONEDAY * 365

            //to make sure weeks with two valid timetables are displayed correctly, every day of the week has to be checked individually
            let currentDayDate = mondayDate;

            while (currentDayDate < sundayDate) {
                //only check against the day, if it's the day the lesson is scheduled for or all lessons will be pushed
                //that would be valid on monday
                if (new Date(currentDayDate).getDay() != lesson.weekday) {
                    currentDayDate += ONEDAY;
                    continue;
                }

                if (lessonValidFrom <= currentDayDate && currentDayDate <= lessonValidUntil) {
                    if (!validLessons.includes(lesson)) validLessons.push(lesson);
                }

                currentDayDate += ONEDAY;
            }
        });

        return validLessons;
    }

    static async getAllTimetableChanges() {
        let db = new AbstractModel;
        let dbData = await db.readAllFromLocalDB('timetableChanges');
        let changes = [];

        dbData.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.id = entry.id;
            lesson.weekday = entry.weekday;
            lesson.date = new Date(entry.date);
            lesson.timeslot = entry.timeslot;
            lesson.validFrom = entry.validFrom;
            lesson.type = entry.type;
            lesson.canceled = entry.canceled;
            lesson.validFrom = entry.validFrom;
            lesson.validUntil = entry.validUntil;
            lesson.lastEdited = entry.lastEdited;

            changes.push(lesson);
        });

        changes.sort(Fn.sortByDate);

        return changes;
    }

    static async getTimetableChanges(startDate, endDate) {
        let timetableChanges = await this.getAllTimetableChanges();
        let changes = [];

        timetableChanges.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.date = entry.date;
            lesson.id = entry.id;
            lesson.canceled = entry.canceled;
            lesson.type = entry.type;
            lesson.timeslot = entry.timeslot;

            if (Fn.isDateInTimespan(lesson.date, startDate, endDate)) changes.push(lesson);
        });

        if (changes.length > 1) changes.sort(Fn.sortByDate);

        return changes;
    }

    static async getLessonById(id) {
        let db = new AbstractModel;
        let lessonData = await db.readFromLocalDB('timetableChanges', id)

        if (!lessonData) {
            console.error('No lesson found!');
            return;
        }

        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.id = lessonData.id;
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;
        lesson.canceled = lessonData.canceled;
        lesson.type = lessonData.type;
        lesson.lastEdited = lessonData.lastEdited;

        return lesson;
    }

    static async getOldTimetableCopy() {
        return await this.getAllRegularLessons();
    };

    static async getOldTimetableChanges() {
        return await this.getAllTimetableChanges();

    };

    //public class methods
    async save() {
        let timetableChanges = await LessonController.getAllTimetableChanges();
        
        if (this.subject == 'Termin') this.type = 'appointement';

        this.id = Fn.generateId(timetableChanges);
        this.lastEdited = this.formatDateTime(new Date());

        await this.writeToLocalDB('timetableChanges', this.serialize());
        let result = await this.makeAjaxQuery('lesson', 'save', this.serialize());

        if (result.status == 'failed') this.writeToLocalDB('unsyncedTimetableChanges', this.serialize());
    }

    async delete() {
        let deletedItem = await this.readFromLocalDB('timetableChanges', this.id);
        this.deleteFromLocalDB('timetableChanges', this.id);

        let result = await this.makeAjaxQuery('lesson', 'delete', [{ 'id': this.id }]);

        if (result.status == 'failed' || result[0].status == 'failed') this.writeToLocalDB('unsyncedDeletedTimetableChanges', deletedItem);
    }

    async update() {
        let timetableChanges = await LessonController.getAllTimetableChanges();

        if (this.subject == 'Termin') this.type = 'appointement';
        this.lastEdited = this.formatDateTime(new Date());
        this.id = Fn.generateId(timetableChanges);

        this.writeToLocalDB('timetableChanges', this.serialize());
        let result = await this.makeAjaxQuery('lesson', 'save', this.serialize());

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedTimetableChanges', this.serialize());
    }

    async cancel() {
        this.canceled = 'true';
        this.lastEdited = this.formatDateTime(new Date());

        //lessons with an id are already on the timetablechanges table and must be updated
        if (this.id != undefined) {

            this.updateOnLocalDB('timetableChanges', this.serialize());
            let result = await this.makeAjaxQuery('lesson', 'cancel', { 'id': this.id, 'lastEdited': this.lastEdited });

            if (result.status == 'failed') this.updateOnLocalDB('unsyncedTimetableChanges', this.serialize());

            return;
        }

        let timetableChanges = await LessonController.getAllTimetableChanges();

        this.id = Fn.generateId(timetableChanges);

        this.writeToLocalDB('timetableChanges', this.serialize());
        let result = await this.makeAjaxQuery('lesson', 'addCanceled', this.serialize());

        if (result.status == 'failed') this.writeToLocalDB('unsyncedTimetableChanges', this.serialize());
    }

    async uncancel() {
        this.canceled = 'false';
        this.lastEdited = this.formatDateTime(new Date());

        this.updateOnLocalDB('timetableChanges', this.serialize())
        let result = await this.makeAjaxQuery('lesson', 'uncancel', { 'id': this.id, 'lastEdited': this.lastEdited })

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedTimetableChanges', this.serialize());
    }

    serialize() {
        let serialized = {
            id: this.id,
            class: this.class,
            subject: this.subject,
            timeslot: this.timeslot,
        }

        if (this.weekday) serialized.weekday = this.weekday;
        if (this.date) serialized.date = this.formatDate(this.date);
        if (this.type) serialized.type = this.type;
        if (this.canceled) serialized.canceled = this.canceled;
        if (this.validFrom) serialized.validFrom = this.validFrom;
        if (this.validUntil) serialized.validUntil = this.validUntil;
        if (this.lastEdited) serialized.lastEdited = this.lastEdited;

        return serialized;
    }

    //generic getters
    get id() {
        return this.#id;
    }

    get class() {
        return this.#class;
    }

    get subject() {
        return this.#subject;
    }

    get weekday() {
        return this.#weekday;
    }

    get date() {
        return this.#date;
    }

    get timeslot() {
        return this.#timeslot;
    }

    get canceled() {
        return this.#canceled;
    }

    get type() {
        return this.#type;
    }

    get validFrom() {
        return this.#validFrom;
    }

    get validUntil() {
        return this.#validUntil;
    }

    get cssColorClass() {
        return this.#cssColorClass;
    }

    get lastEdited() {
        return this.#lastEdited;
    }

    // generic setters
    set id(id) {
        this.#id = id;
    }

    set class(className) {
        this.#class = className;
    }

    set subject(subject) {
        this.#subject = subject;
    }

    set weekday(weekday) {
        this.#weekday = weekday;
    }

    set date(date) {
        this.#date = new Date(date);
    }

    set timeslot(timeslot) {
        this.#timeslot = timeslot;
    }

    set type(type) {
        this.#type = type;
    }

    set canceled(bool) {
        this.#canceled = bool;
    }

    set validFrom(date) {
        this.#validFrom = date;
    }

    set validUntil(date) {
        this.#validUntil = date;
    }

    set cssColorClass(cssClass) {
        this.#cssColorClass = cssClass;
    }

    set lastEdited(lastEdited) {
        this.#lastEdited = lastEdited;
    }
}