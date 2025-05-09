import Fn from '../inc/utils.js';
import Controller from '../Controller/TaskController.js';
import { standardTimetable, taskBackupArray, timetableChanges } from '../index.js';
import { allTasksArray } from '../index.js';
import AbstractModel from './AbstractModel.js';

export default class Task extends AbstractModel {

    // now static, should later be filled from DB

    #id;
    #class;
    #subject;
    #description;
    #date;
    #timeslot;
    #status;
    #fixedTime = false;

    constructor(id = undefined) {
        super()
        if (id == undefined) {
            this.#id = id;
        } else {
            Task.getAllTasks().forEach((task) => {
                if (id == task.id) {
                    this.#id = id;
                    this.#class = task.class;
                    this.#subject = task.subject;
                    this.#description = task.description;
                    this.#date = new Date(task.date);
                    this.#timeslot = task.timeslot;
                    this.#status = task.status;
                    this.fixedTime = task.fixedTime;
                }
            });
        }
    }

    //class methods

    update() {
        allTasksArray.forEach(element => {
            if (element.id == this.id) {
                element.date = this.date;
                element.class = this.class;
                element.subject = this.subject;
                element.timeslot = this.timeslot;
                element.description = this.description;
                element.fixedTime = this.fixedTime;
            }
        });

        let taskData = {
            'id': this.id,
            'class': this.class,
            'subject': this.subject,
            'date': this.formatDate(this.date),
            'timeslot': this.timeslot,
            'description': this.description,
            'status': this.status,
            'fixedTime': this.fixedTime
        }

        // this.makeAjaxQuery('task', 'update', taskData);
    }

    save() {
        let taskData = {
            'id': this.id,
            'class': this.class,
            'subject': this.subject,
            'date': this.formatDate(this.date),
            'timeslot': this.timeslot,
            'description': this.description,
            'status': this.status,
            'fixedTime': this.fixedTime
        }

        allTasksArray.push(this);
        this.makeAjaxQuery('task', 'save', taskData);
    }

    setInProgress() {
        allTasksArray.forEach(entry => {
            if (entry.id != this.id) return;
            entry.status = 'inProgress';
        });

        this.makeAjaxQuery('task', 'setInProgress', { 'id': this.id });
    }

    setDone() {
        allTasksArray.forEach(entry => {
            if (entry.id != this.id) return;

            entry.status = 'done';
        })

        this.makeAjaxQuery('task', 'setDone', { 'id': this.id });
    }

    // Getter

    static getAllOpenTasks() {

        let openTasks = [];

        allTasksArray.forEach((task) => {
            if (task.status == 'open') openTasks.push(new Task(task.id));
        })

        openTasks.sort(Fn.sortByDate);

        return openTasks;
    }

    static getAllInProgressTasks() {

        let inProgressTasks = [];

        allTasksArray.forEach((task) => {
            if (task.status == 'inProgress') inProgressTasks.push(new Task(task.id));
        })

        inProgressTasks.sort(Fn.sortByDate);

        return inProgressTasks;
    }

    static getTaskById(id) {

        let task;

        allTasksArray.forEach(entry => {
            if (entry.id != id) return;
            task = new Task(id);
        })

        return task;
    }

    static getAllTasks() {
        let allTasks = [];

        allTasksArray.forEach((element) => {
            let task = new Task();
            task.id = element.id;
            task.class = element.class;
            task.subject = element.subject;
            task.description = element.description;
            task.date = new Date(element.date);
            task.timeslot = element.timeslot;
            task.status = element.status;
            task.fixedTime = element.fixedTime;

            allTasks.push(task)
        });

        return allTasks;
    }

    static reorderTasks(oldTimetable, oldTimetableChanges) {

        let allAffectedTasks = this.#getAllAffectedTasks()
        let endDate = new Date(allAffectedTasks[allAffectedTasks.length - 1].date).setHours(12, 0, 0, 0) + 86400000 * 30;

        let subjectsByClass = {};

        console.log(allAffectedTasks);
        allAffectedTasks.forEach(task => {
            subjectsByClass[task.class] ? '' : subjectsByClass[task.class] = [];
            if (!subjectsByClass[task.class].includes(task.subject)) subjectsByClass[task.class].push(task.subject);
        });

        console.log(subjectsByClass);
        Object.keys(subjectsByClass).forEach(key => {
            let className = key;
            let subjectsArray = subjectsByClass[key];

            subjectsArray.forEach(subject => {
                let allOldLessonDates = this.calculateAllLessonDates(className, subject, endDate, oldTimetable, oldTimetableChanges)
                let allNewLessonDates = this.calculateAllLessonDates(className, subject, endDate);

                console.log(className + ' ' + subject);

                console.log('allOldLessonDates');
                console.log(allOldLessonDates);
                console.log('allNewLessonDates');
                console.log(allNewLessonDates);


            })
        });

    }

    //adding a new timetable reorders tasks by changing their date while maintaining the number of lessons between them.
    //It takes all old lesson dates and new dates, finds the index of the task.date and sets the date as the new task.date
    //that has the same index on allNewDates
    static reorderTasksAfterTimetableChanges(lessons) {

        let timetableValidDates = AbstractModel.getCurrentlyAndFutureValidTimetableDates();

        lessons.forEach(lesson => {
            lesson.date = lesson.validFrom;
            let allAffectedTasks = this.#getAllAffectedTasks(lesson);

            if (allAffectedTasks.length == 0) return;

            let lastTaskDate = allAffectedTasks[allAffectedTasks.length - 1].date;
            let oldTimetableDate = timetableValidDates[timetableValidDates.indexOf(lesson.validFrom) - 1];
            let allNewDates = AbstractModel.calculateAllLessonDates(lastTaskDate, lesson.class, lesson.subject, lessons);
            let allOldDates = AbstractModel.calculatePotentialLessonDates(oldTimetableDate, lastTaskDate, lesson.class, lesson.subject);

            console.log(allNewDates);

            //count the lesson between the reference date and the current task according to the old timetable
            //and switch the task to its new date, preserving the number of lessons in between
            allAffectedTasks.forEach(task => {
                let indexOfTaskDate;

                allOldDates.forEach(entry => {
                    if (new Date(entry.date).setHours(12, 0, 0, 0) == new Date(task.date).setHours(12, 0, 0, 0)) {
                        indexOfTaskDate = allOldDates.indexOf(entry);
                    }
                });

                //now get the date with the exact same indexDifference on the new timetable and asign it as the new date to the task
                task.date = allNewDates[indexOfTaskDate].date;
                task.timeslot = allNewDates[indexOfTaskDate].timeslot;
                task.update();
            });
        });

        Controller.renderTaskChanges();
    }

    static #getAllAffectedTasks() {
        let affectedTasks = [];

        allTasksArray.sort(Fn.sortByDate);

        allTasksArray.forEach(entry => {
            let task = new Task(entry.id);

            if (task.date.setHours(12, 0, 0, 0) < new Date().setHours(12, 0, 0, 0)) return;
            if (task.fixedTime == true) return;

            affectedTasks.push(task);
        })

        return affectedTasks;
    }

    setBackupData() {
        taskBackupArray[this.#id] = {
            'id': this.#id,
            'class': this.#class,
            'subject': this.#subject,
            'date': this.#date,
            'timeslot': this.#timeslot,
            'description': this.#description,
            'fixedTime': this.#fixedTime
        }
    }

    getBackupData() {
        return taskBackupArray[this.#id];
    }


    get id() {
        return this.#id;
    }

    get class() {
        return this.#class;
    }

    get subject() {
        return this.#subject;
    }

    get description() {
        return this.#description;
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

    get fixedTime() {
        return this.#fixedTime;
    }

    // Setter

    set id(id) {
        this.#id = id;
    }

    set class(className) {
        this.#class = className;
    }

    set subject(subject) {
        this.#subject = subject;
    }

    set description(description) {
        this.#description = description;
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

    set fixedTime(fixedTime) {
        this.#fixedTime = fixedTime;
    }
}