import { allSubjects } from "../index.js";
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
    // #status = 'normal'; //can also be canceled or sub for substitute lessons
    // #initialStatus = undefined;
    #type = undefined;
    #canceled = false;
    #validFrom = undefined; //date a regular lesson was added to to the schuduled timetable
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

    //public class methods
    save() {

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
        this.makeAjaxQuery('lesson', 'save', lessonData);
    }

    update() {

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
        this.makeAjaxQuery('lesson', 'save', lessonData);
    }

    cancel() {

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
                if (entry.id == this.id) entry.canceled = true;
            })

            this.makeAjaxQuery('lesson', 'cancel', { 'id': this.id });

            return;
        }

        this.id = Fn.generateId(timetableChanges);
        lessonData.id = this.id;

        timetableChanges.push(lessonData);
        this.makeAjaxQuery('lesson', 'addCanceled', lessonData);
    }

    uncancel() {

        timetableChanges.forEach(entry => {
            if (entry.id == this.id) {
                entry.canceled = 'false';
            }
        })

        this.makeAjaxQuery('lesson', 'uncancel', { 'id': this.id })
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
}