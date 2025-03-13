import Fn from '../inc/utils.js'
import { taskBackupArray } from '../index.js'

export default class Task {

    // now static, should later be filled from DB
    static #allTasksArray = [
        {
            'id': 1,
            'date': '2025-03-11',
            'timeslot': '2',
            'class': '6A',
            'subject': 'Gesch',
            'description': 'die Schafe hüten',
            'status': 'open',
            'fixedTime': false
        },
        {
            'id': 2,
            'date': '2025-02-10',
            'timeslot': '3',
            'class': '7B',
            'subject': 'Deu',
            'description': 'den Klassenraum streichen',
            'status': 'open',
            'fixedTime': false
        },
        {
            'id': 3,
            'date': '2025-03-18',
            'timeslot': '2',
            'class': '6A',
            'subject': 'Gesch',
            'description': 'Wette verloren! Kopfstand auf dem Lehrertisch',
            'status': 'open',
            'fixedTime': true
        },
        {
            'id': 4,
            'date': '2025-03-06',
            'timeslot': '5',
            'class': '7A',
            'subject': 'Gesch',
            'description': 'Napoleon war ein kleiner Mann und hatte rote Röcke an',
            'status': 'open',
            'fixedTime': false
        },
        {
            'id': 5,
            'date': '2025-03-10',
            'timeslot': '2',
            'class': '7A',
            'subject': 'Gesch',
            'description': 'Napoleon war ein kleiner Mann und hatte rote Röcke an',
            'status': 'open',
            'fixedTime': false
        },
        {
            'id': 6,
            'date': '2025-03-13',
            'timeslot': '5',
            'class': '7A',
            'subject': 'Gesch',
            'description': 'Napoleon war ein kleiner Mann und hatte rote Röcke an',
            'status': 'open',
            'fixedTime': true
        }
    ];

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

        this.#allTasksArray.forEach((task) => {
            if (task.status == 'open') openTasks.push(new Task(task.id));
        })

        openTasks.sort(Fn.sortByDate);

        return openTasks;
    }

    static getAllInProgressTasks() {

        let inProgressTasks = [];

        this.#allTasksArray.forEach((task) => {
            if (task.status == 'inprogress') inProgressTasks.push(new Task(task.id));
        })

        return inProgressTasks;
    }

    static getAllTasks() {
        let allTasks = [];

        this.#allTasksArray.forEach((element) => {
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

    backupData(){
        taskBackupArray[this.#id] = {
            'id': this.#id,
            'class': this.#class,
            'suject': this.#subject,
            'date': this.#date,
            'timeslot': this.#timeslot,
            'description': this.#description,
            'fixedTime' : this.#fixedTime
        }
        console.log(taskBackupArray);
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