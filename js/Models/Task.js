import Fn from '../inc/utils.js'
import { taskBackupArray } from '../index.js'
import { allTasksArray } from '../index.js';

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
                    this.#date = task.date;
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
            task.date = element.date;
            task.timeslot = element.timeslot;
            task.status = element.status;
            task.fixedTime = element.fixedTime;

            allTasks.push(task)
        });

        return allTasks;
    }

    setBackupData(){
        taskBackupArray[this.#id] = {
            'id': this.#id,
            'class': this.#class,
            'subject': this.#subject,
            'date': this.#date,
            'timeslot': this.#timeslot,
            'description': this.#description,
            'fixedTime' : this.#fixedTime
        }
    }

    getBackupData(){
        return taskBackupArray[this.#id];
    }

    update() {
        allTasksArray.forEach(element => {
            if (element.id == this.#id){
                element.class = this.#class;
                element.subject = this.#subject;
                element.description = this.#description;
            }
        });
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