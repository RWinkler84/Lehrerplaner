import { ONEDAY, unsyncedDeletedTimetableChanges } from "../index.js";
import { timetableChanges } from "../index.js";
import Fn from '../inc/utils.js';
import AbstractModel from "./AbstractModel.js";
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
    static async getScheduledLessons() {
        let db = new AbstractModel;
        let standardTimetable = await db.readAllFromLocalDB('timetable');
        let regularLessons = [];

        standardTimetable.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.id = entry.id;
            lesson.weekday = entry.weekdayNumber;
            lesson.timeslot = entry.timeslot;
            lesson.validFrom = entry.validFrom;
            lesson.type = 'normal';
            lesson.validFrom = entry.validFrom;
            lesson.validUntil = entry.validUntil;

            regularLessons.push(lesson);
        });

        standardTimetable.sort((a, b) => {
            return new Date(a.validFrom).setHours(12, 0, 0, 0) - new Date(b.validFrom).setHours(12, 0, 0, 0);
        });

        return regularLessons;
    }

    static async getScheduledLessonsForCurrentWeek(monday, sunday) {
        let scheduledLessons = await this.getScheduledLessons()
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

    static getTimetableChanges(startDate, endDate) {
        let changes = [];

        timetableChanges.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.date = new Date(entry.date);
            lesson.id = entry.id;
            lesson.canceled = entry.canceled;
            lesson.type = entry.type;
            lesson.timeslot = entry.timeslot;

            if (Fn.isDateInTimespan(lesson.date, startDate, endDate)) changes.push(lesson);
        });

        if (changes.length > 1) changes.sort(Fn.sortByDate);

        return changes;
    }

    static getLessonById(id) {

        let lesson;

        timetableChanges.forEach(entry => {
            if (entry.id != id) return;

            lesson = new Lesson(entry.class, entry.subject);
            lesson.id = entry.id;
            lesson.date = entry.date;
            lesson.timeslot = entry.timeslot;
            lesson.canceled = entry.canceled;
            lesson.type = entry.type;
        })

        return lesson;
    }

    static async getOldTimetableCopy() {
        let db = new AbstractModel;
        let standardTimetable = await db.readAllFromLocalDB('timetable');
        return JSON.parse(JSON.stringify(standardTimetable));
    };

    static async getOldTimetableChanges() {
        return JSON.parse(JSON.stringify(timetableChanges));

    };

    //public class methods
    async save() {
        if (this.subject == 'Termin') this.type = 'appointement';

        let lessonData = {
            'date': this.formatDate(this.date),
            'timeslot': this.timeslot,
            'class': this.class,
            'subject': this.subject,
            'canceled': this.canceled,
            'type': this.type
        };

        this.id = Fn.generateId(timetableChanges);
        lessonData.id = this.id;

        timetableChanges.push(lessonData);
        let result = await this.makeAjaxQuery('lesson', 'save', lessonData);

        if (result.status == 'failed') this.markUnsynced(this.id, timetableChanges);
    }

    async delete() {
        timetableChanges.forEach(entry => {
            if (entry.id != this.id) return;
            timetableChanges.splice(timetableChanges.indexOf(entry), 1);
        });

        let result = await this.makeAjaxQuery('lesson', 'delete', [{ 'id': this.id }]);

        console.log('lesson', result, this);

        if (result.status == 'failed' || result[0].status == 'failed') unsyncedDeletedTimetableChanges.push({ id: this.id });
    }

    async update() {
        if (this.subject == 'Termin') this.type = 'appointement';

        let lessonData = {
            'date': this.formatDate(this.date),
            'timeslot': this.timeslot,
            'class': this.class,
            'subject': this.subject,
            'canceled': this.canceled,
            'type': this.type
        };

        this.id = Fn.generateId(timetableChanges);

        lessonData.id = this.id;

        timetableChanges.push(lessonData);
        let result = await this.makeAjaxQuery('lesson', 'save', lessonData);

        if (result.status == 'failed') this.markUnsynced(this.id, timetableChanges);
    }

    async cancel() {
        let lessonData = {
            'id': this.id,
            'date': this.formatDate(this.date),
            'timeslot': this.timeslot,
            'class': this.class,
            'subject': this.subject,
            'canceled': this.canceled,
            'type': this.type
        };

        if (this.id != undefined) { //lessons with an id are already on the timetablechanges table and must be updated

            timetableChanges.forEach(entry => {
                if (entry.id == this.id) entry.canceled = 'true';
            })

            let result = await this.makeAjaxQuery('lesson', 'cancel', { 'id': this.id });
            if (result.status == 'failed') this.markUnsynced(this.id, timetableChanges);

            return;
        }

        this.id = Fn.generateId(timetableChanges);
        lessonData.id = this.id;

        timetableChanges.push(lessonData);
        let result = await this.makeAjaxQuery('lesson', 'addCanceled', lessonData);

        if (result.status == 'failed') this.markUnsynced(this.id, timetableChanges);
    }

    async uncancel() {

        timetableChanges.forEach(entry => {
            if (entry.id == this.id) {
                entry.canceled = 'false';
            }
        })

        let result = await this.makeAjaxQuery('lesson', 'uncancel', { 'id': this.id })

        if (result.status == 'failed') this.markUnsynced(this.id, timetableChanges);
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
}