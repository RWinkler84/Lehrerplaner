import Fn from '../inc/utils.js';
import Controller from '../Controller/TaskController.js';
import { taskBackupArray } from '../index.js';
import { allTasksArray } from '../index.js';
import AbstractModel from './AbstractModel.js';

export default class Task {

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

    static reorderTasks(lesson, lessonCanceled) {

        //new lessons in the past won't be processed
        if (new Date(lesson.date).setHours(12,0,0,0) < new Date().setHours(12,0,0,0)) return;

        let affectedTasks = Task.#getAllAffectedTasks(lesson);

        //nothing affected? Stop...
        if (affectedTasks.length == 0) return;

        let lastTaskDate = affectedTasks[affectedTasks.length - 1].date
        let allLessonDates = AbstractModel.calculateAllLessonDates(lastTaskDate, lesson.class, lesson.subject,);

        if (!lessonCanceled) {

            //if there is a substitute lesson, all tasks without a fixed date after this lesson will be moved to the date prior
            affectedTasks.forEach(task => {
                for (let i = 0; i < allLessonDates.length; i++) {

                    if (task.date.setHours(12,0,0,0) == allLessonDates[i].date.setHours(12,0,0,0)) {

                        let count = 1;

                        while (allLessonDates[i - count].status == 'canceled') {
                            count++
                        }

                        task.date = allLessonDates[i - count].date;
                        task.update()
                    }
                }
            })

            Controller.renderTaskChanges();
            return;
        }

        //if a lessons is canceled all task without a fixed date will be shifted to the next possible date
        affectedTasks.forEach(task => {

            for (let i = 0; i < allLessonDates.length; i++) {
                if (task.date.setHours(12,0,0,0) == allLessonDates[i].date.setHours(12,0,0,0)) {
                    let taskCopy = new Task(task.id);
                    let count = 1;
                    
                    while (allLessonDates[i + count].status == 'canceled') {
                        count++
                    }

                    taskCopy.date = allLessonDates[i + count].date;
                    taskCopy.update()
                }
            }
        })

        Controller.renderTaskChanges();
    }

    static #getAllAffectedTasks(lesson) {
        let affectedTasks = [];

        allTasksArray.sort(Fn.sortByDate);

        allTasksArray.forEach(entry => {
            let task = new Task(entry.id);

            if (task.class != lesson.class) return;
            if (task.subject != lesson.subject) return;
            if (task.date.setHours(12,0,0,0) < new Date(lesson.date).setHours(12,0,0,0)) return;
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

    update() {
        allTasksArray.forEach(element => {
            if (element.id == this.#id) {
                element.date = this.#date;
                element.class = this.#class;
                element.subject = this.#subject;
                element.description = this.#description;
                element.fixedTime = this.#fixedTime;
            }
        });
    }

    save() {
        console.log(this);
        allTasksArray.push(this);

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