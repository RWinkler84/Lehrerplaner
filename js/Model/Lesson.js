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
    #status = 'normal'; //can also be canceled or sub for substitute lessons
    #initialStatus = undefined;
    #validFrom = undefined; //date a regular lesson was added to to the schuduled timetable

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
            lesson.initialStatus = 'normal'

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
            lesson.status = entry.status;
            lesson.initialStatus = entry.initialStatus;
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
            lesson.status = entry.status;
            lesson.initialStatus = entry.initialStatus;

        })

        return lesson;
    }

    static #generateLessonId() {

        let lessonIds = [];

        timetableChanges.forEach((entry) => {
            lessonIds.push(entry.id);
        })

        if (lessonIds.length == 0) lessonIds = [0];

        return Math.max(...lessonIds) + 1; //adds 1 to the highest existing lesson id
    }

    //public object methods
    save() {

        let lessonData = {
            'date': this.date,
            'timeslot': this.timeslot,
            'class': this.class,
            'subject': this.subject,
            'status': this.status,
            'initialStatus': this.initialStatus
        };

        this.makeAjaxQuery('lesson', 'save', lessonData);

        this.id = Lesson.#generateLessonId();
        lessonData.id = this.id;

        timetableChanges.push(lessonData);
    }

    //checks, if the updates lesson already has an Id and therefore is part of timetableChanges.
    //if not, saves it to this table via the save function
    update() {

        let lessonData = {
            'date': this.date,
            'timeslot': this.timeslot,
            'class': this.class,
            'subject': this.subject,
            'status': this.status,
            'initialStatus': this.initialStatus
        };

        if (this.id != undefined) {
            timetableChanges.forEach(entry => {
                if (entry.id != this.id) return;

                entry.class = this.class;
                entry.subject = this.subject;
                entry.status = this.status;
                entry.initialStatus = this.initialStatus;

            });

            this.makeAjaxQuery('lesson', 'update', lessonData);

            return;
        }

        this.makeAjaxQuery('lesson', 'save', lessonData);

        timetableChanges.push(lessonData);

        this.id = Lesson.#generateLessonId();
        lessonData.id = this.id;



    }

    cancel() {
        
        let lessonData = {
            'date': this.date,
            'timeslot': this.timeslot,
            'class': this.class,
            'subject': this.subject,
            'status': this.status,
            'initialStatus': this.initialStatus
        };

        if (this.id != undefined){
            timetableChanges.forEach(entry => {
                
                if (entry.id != this.id) return;
                
                entry.class = this.class;
                entry.subject = this.#subject;
                entry.status = 'canceled';
                entry.initialStatus = this.initialStatus;
            });

            // timetableChanges.forEach(entry => console.log(entry));

        this.makeAjaxQuery('lesson', 'cancel', lessonData);

        return;

        }

        this.makeAjaxQuery('lesson', 'cancel', lessonData);

        this.id = Lesson.#generateLessonId();
        lessonData.id = this.id;

        timetableChanges.push(lessonData);

    }

    uncancel() {

        let lessonData = {
            'id': this.id,
            'class': this.class,
            'subject': this.subject,
            'date': this.date,
            'timeslot': this.timeslot,
            'status': this.initialStatus
        }

        // is uncanceled lesson a regular lesson?
        standardTimetable.forEach((entry) => {
            if (entry.weekday == this.#weekday && entry.timeslot == this.#timeslot) {
                for (let i = 0; i < timetableChanges.length; i++) {
                    if (timetableChanges[i].date == this.#date && timetableChanges[i].timeslot) {
                        timetableChanges.splice(i, 1);

                        // create a function by id in db
                        this.makeAjaxQuery('lesson', 'delete', lessonData);

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

    get status() {
        return this.#status;
    }

    get initialStatus() {
        return this.#initialStatus;
    }

    get cssColorClass() {
        return this.#cssColorClass;
    }

    get validFrom() {
        return this.#validFrom;
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

    set initialStatus(initialStatus) {
        this.#initialStatus = initialStatus;
    }

    set status(status) {
        this.#status = status;
    }

    set validFrom(added) {
        this.#validFrom = added;
    }
}