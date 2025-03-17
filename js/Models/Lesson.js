import { allSubjects } from "../index.js";
import { timetableChanges } from "../index.js";
import Fn from '../inc/utils.js';


export default class Lesson {

    static #standardTimetable = [
        {
            'class': '7B',
            'subject': 'Deu',
            'weekdayNumber': 1,
            'timeslot': 3
        },
        {
            'class': '6A',
            'subject': 'Gesch',
            'weekdayNumber': 2,
            'timeslot': 2
        },
        {
            'class': '7B',
            'subject': 'Deu',
            'weekdayNumber': 4,
            'timeslot': 3
        }, {
            'class': '7A',
            'subject': 'Gesch',
            'weekdayNumber': 4,
            'timeslot': 5
        }
    ];



    #class;
    #subject;
    #cssColorClass = undefined;
    #weekday = undefined;
    #date = undefined;
    #timeslot = undefined;
    #status = 'normal'; //can also be canceled or sub for substitute lessons

    constructor(className, subject) {
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

        this.#standardTimetable.forEach((entry) => {
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
            lesson.date = new Date (entry.date);
            lesson.status = entry.status;
            lesson.timeslot = entry.timeslot;


            if (Fn.isDateInWeek(lesson.date, mondayDate, sundayDate)) changes.push(lesson);
        });

        return changes;
    }

    save(){
        let lessonData =         {
            'date': this.#date,
            'timeslot': this.#timeslot,
            'class': this.#class,
            'subject': this.#subject,
            'status': 'sub',
        };

        timetableChanges.push(lessonData);
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
        this.#date = date;
    }

    set timeslot(timeslot) {
        this.#timeslot = timeslot;
    }

    set status(status) {
        this.#status = status;
    }
}