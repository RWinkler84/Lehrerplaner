import { allSubjects } from "../index.js";
import { timetableChanges } from "../index.js";
import { standardTimetable } from "../index.js";
import Fn from '../inc/utils.js';
import AbstractModel from "./AbstractModel.js";


export default class Lesson extends AbstractModel{

    #class;
    #subject;
    #cssColorClass = undefined;
    #weekday = undefined;
    #date = undefined;
    #timeslot = undefined;
    #status = 'normal'; //can also be canceled or sub for substitute lessons
    
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

            regularLessons.push(lesson);
        });

        return regularLessons;
    }

    static getTimetableChanges(mondayDate, sundayDate) {
        let changes = [];

        timetableChanges.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.date = new Date(entry.date);
            lesson.status = entry.status;
            lesson.timeslot = entry.timeslot;


            if (Fn.isDateInWeek(lesson.date, mondayDate, sundayDate)) changes.push(lesson);
        });

        return changes;
    }

    //public object methods
    save() {
        let lessonData = {
            'date': this.#date,
            'timeslot': this.#timeslot,
            'class': this.#class,
            'subject': this.#subject,
            'status': this.#status,
        };

        timetableChanges.push(lessonData);
        
        this.makeAjaxQuery(this.#controller, 'save', lessonData);

    }

    update() {

        timetableChanges.forEach(entry => {
            if (new Date(entry.date).setHours(12,0,0,0) != this.date.setHours(12,0,0,0)) return;
            if (entry.timeslot != this.timeslot) return;


            entry.date = this.#date;
            entry.timeslot = this.#timeslot;
            entry.class = this.#class;
            entry.subject = this.#subject;
            entry.status = this.#status; 
        })
    }

    cancel() {
        let lessonData = {
            'date': this.#date,
            'timeslot': this.#timeslot,
            'class': this.#class,
            'subject': this.#subject,
            'status': this.#status,
        };
        
        timetableChanges.push(lessonData);
    }

    uncancel() {
        // is uncanceled lesson a regular lesson?
        standardTimetable.forEach((entry) => {
            if (entry.weekday == this.#weekday && entry.timeslot == this.#timeslot) {
                for (let i = 0; i < timetableChanges.length; i++) {
                    if (timetableChanges[i].date == this.#date && timetableChanges[i].timeslot) {
                        timetableChanges.splice(i, 1);
                        
                        return;
                    }
                }
            }
        });

        timetableChanges.forEach((entry) => {
            if (entry.date == this.#date && entry.timeslot == this.#timeslot) entry.status = 'sub';
        })
    }


    //generic getters
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

    get status() {
        return this.#status;
    }

    get cssColorClass() {
        return this.#cssColorClass;
    }

    // generic setters
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

    set status(status) {
        this.#status = status;
    }
}