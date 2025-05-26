import { allSubjects, ONEDAY } from "../index.js";
import { timetableChanges } from "../index.js";
import { standardTimetable } from "../index.js";
import Fn from '../inc/utils.js';
import AbstractModel from "./AbstractModel.js";


export default class Lesson extends AbstractModel {

    #id = undefined;
    #class;
    #subject;
    #cssColorClass = undefined;
    #weekday = undefined;
    #date = undefined;
    #timeslot = undefined;
    #type = undefined;
    #canceled = false;
    #validFrom = undefined; //date a regular lesson was added to to the scheduled timetable
    #validUntil = undefined;

    #controller = 'lesson';

    constructor(className, subject) {
        super();

        this.#class = className;
        this.#subject = subject;
        this.#cssColorClass = this.getCssColorClass()
    }

    getCssColorClass() {

        let match = undefined;

        allSubjects.forEach((subject) => {
            if (subject.subject == this.#subject) match = subject.colorCssClass;
        })

        return match;
    }

    // static class methods
    static getScheduledLessons() {
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

        return regularLessons;
    }

    static getScheduledLessonsForCurrentlyDisplayedWeek(monday, sunday) {
        let scheduledLessons = this.getScheduledLessons()
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

    static getTimetableChanges(mondayDate, sundayDate) {
        let changes = [];

        timetableChanges.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.date = new Date(entry.date);
            lesson.id = entry.id;
            lesson.canceled = entry.canceled;
            lesson.type = entry.type;
            lesson.timeslot = entry.timeslot;


            if (Fn.isDateInWeek(lesson.date, mondayDate, sundayDate)) changes.push(lesson);
        });

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

    static getOldTimetableCopy() {
        return JSON.parse(JSON.stringify(standardTimetable));
    };

    static getOldTimetableChanges() {
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
        console.log(timetableChanges);
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
            console.log(timetableChanges);

            return;
        }

        this.id = Fn.generateId(timetableChanges);
        lessonData.id = this.id;

        timetableChanges.push(lessonData);
        let result = await this.makeAjaxQuery('lesson', 'addCanceled', lessonData);

        if (result.status == 'failed') this.markUnsynced(this.id, timetableChanges);
        console.log(timetableChanges);
    }

    async uncancel() {

        timetableChanges.forEach(entry => {
            if (entry.id == this.id) {
                entry.canceled = 'false';
            }
        })

        let result = await this.makeAjaxQuery('lesson', 'uncancel', { 'id': this.id })

        if (result.status == 'failed') this.markUnsynced(this.id, timetableChanges);
        console.log(timetableChanges);
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

    get cssColorClass() {
        return this.#cssColorClass;
    }

    get validFrom() {
        return this.#validFrom;
    }

    get validUntil() {
        return this.#validUntil;
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

    set cssColorClass(colorClass) {
        this.#cssColorClass = colorClass;
    }
}