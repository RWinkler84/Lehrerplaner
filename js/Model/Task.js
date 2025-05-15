import Fn from '../inc/utils.js';
import Controller from '../Controller/TaskController.js';
import { standardTimetable, taskBackupArray, timetableChanges } from '../index.js';
import { allTasksArray } from '../index.js';
import { ONEDAY } from '../index.js';
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

        this.makeAjaxQuery('task', 'update', taskData);
    }

    updateDate() {
        allTasksArray.forEach(element => {
            if (element.id == this.id) {
                element.date = this.date;
            }
        });

        let taskData = {
            'id': this.id,
            'date': this.formatDate(this.date),
        }

        this.makeAjaxQuery('task', 'updateDate', taskData);
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

    //adding a new timetable reorders tasks by changing their date while maintaining the number of lessons between them.
    //It takes all old lesson dates and new dates, finds the index of the task.date and sets the date as the new task.date
    //that has the same index on allNewDates
    static reorderTasks(oldTimetable, oldTimetableChanges) {

        let allAffectedTasks = this.#getAllAffectedTasks()
        let endDate = new Date(allAffectedTasks[allAffectedTasks.length - 1].date).setHours(12, 0, 0, 0) + ONEDAY * 30;

        let subjectsByClass = {};

        //get class names and their subjects for which there are tasks in the allAffacted Tasks
        allAffectedTasks.forEach(task => {
            subjectsByClass[task.class] ? '' : subjectsByClass[task.class] = [];
            if (!subjectsByClass[task.class].includes(task.subject)) subjectsByClass[task.class].push(task.subject);
        });

        //calculate all lesson dates before and after the change for each class/subject combination
        Object.keys(subjectsByClass).forEach(key => {
            let className = key;
            let subjectsArray = subjectsByClass[key];

            subjectsArray.forEach(subject => {
                let allOldLessonDates = this.calculateAllLessonDates(className, subject, endDate, oldTimetable, oldTimetableChanges)
                let allNewLessonDates = this.calculateAllLessonDates(className, subject, endDate);

                //in the unlikely case, a tasks exists without a corresponding lesson, jump to the next subject
                if (allOldLessonDates.length == 0) return;
                if (allNewLessonDates.length == 0) return;

                //find the index of the task.date for this class/subject combination on the old dates and then pick the
                //date with the corresponding index on the new dates and asign it as the new task.date
                allAffectedTasks.forEach(task => {
                    if (task.class != className) return;
                    if (task.subject != subject) return;

                    let taskDate = new Date(task.date).setHours(12, 0, 0, 0)
                    let indexInOldDates = 0;

                    //search for the task.date and get its index
                    while (taskDate != new Date(allOldLessonDates[indexInOldDates].date).setHours(12, 0, 0, 0)) {
                        indexInOldDates++

                        if (!allOldLessonDates[indexInOldDates]) break;
                        if (indexInOldDates > 1000) break;
                    }

                    if (allNewLessonDates[indexInOldDates]) {
                        task.date = allNewLessonDates[indexInOldDates].date;
                        task.timeslot = allNewLessonDates[indexInOldDates].timeslot;
                        task.updateDate();
                    }
                })
            })
        });
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