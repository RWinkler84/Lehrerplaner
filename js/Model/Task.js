import TaskController from '../Controller/TaskController.js';
import Fn from '../inc/utils.js';
import { taskBackupArray } from '../index.js';
import { ONEDAY } from '../index.js';
import AbstractModel from './AbstractModel.js';

export default class Task extends AbstractModel {

    #id;
    #class;
    #subject;
    #description;
    #date;
    #timeslot;
    #status;
    #fixedTime = false;
    #reoccuring = false;
    #reoccuringInterval;
    #created;
    #lastEdited;

    constructor(id = undefined) {
        super()
    }

    //class methods

    async update() {
        this.lastEdited = this.formatDateTime(new Date());
        await this.updateOnLocalDB('tasks', this.serialize());

        let result = await this.makeAjaxQuery('task', 'update', this.serialize());
        if (result.status == 'failed') this.updateOnLocalDB('unsyncedTasks', this.serialize());
    }

    async save() {
        let allTasks = await Task.getAllTasks();

        this.id = Fn.generateId(allTasks);
        this.lastEdited = this.formatDateTime(new Date());
        this.created = this.lastEdited;

        await this.writeToLocalDB('tasks', this.serialize());

        let result = await this.makeAjaxQuery('task', 'save', this.serialize());
        if (result.status == 'failed') this.updateOnLocalDB('unsyncedTasks', this.serialize());

    }

    async delete() {
        this.lastEdited = this.formatDateTime(new Date);
        await this.deleteFromLocalDB('tasks', this.id);
        await this.deleteFromLocalDB('unsyncedTasks', this.id);

        let result = await this.makeAjaxQuery('task', 'delete', [this.serialize()]);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedTasks', this.serialize());
    }

    async setInProgress() {
        this.status = 'inProgress';
        this.lastEdited = this.formatDateTime(new Date());

        this.update();
    }

    async setDone() {
        if (this.reoccuring == true) {
            this.resetDateAccordingToInterval();
            return;
        }
        this.delete();
    }

    async resetDateAccordingToInterval() {
        let oldDate = new Date(this.date).setHours(12, 0, 0, 0);

        switch (this.#reoccuringInterval) {
            case 'weekly':
                this.date = oldDate + ONEDAY * 7;
                break;

            case 'biweekly':
                this.date = oldDate + ONEDAY * 14;
                break;

            case 'monthly':
                this.date = oldDate + ONEDAY * 28;
                break;
        }
        this.status = 'open';
        this.update();
    }

    // Getter

    static async getAllOpenTasks() {
        let allTasksArray = await this.getAllTasks();
        let openTasks = [];

        allTasksArray.forEach((task) => {
            if (task.status == 'open') openTasks.push(task);
        })

        openTasks = Fn.sortByDateAndTimeslot(openTasks);

        

        return openTasks;
    }

    static async getAllInProgressTasks() {
        let allTasksArray = await this.getAllTasks();
        let inProgressTasks = [];

        allTasksArray.forEach((task) => {
            if (task.status == 'inProgress') inProgressTasks.push(task);
        })

        inProgressTasks = Fn.sortByDateAndTimeslot(inProgressTasks);

        return inProgressTasks;
    }

    static async getById(id) {

        let db = new AbstractModel;
        let task = new Task;
        let taskData = await db.readFromLocalDB('tasks', id);

        if (!taskData) {
            console.error('No task found');
            return;
        }

        task.id = id;
        task.class = taskData.class;
        task.subject = taskData.subject;
        task.description = taskData.description;
        task.date = new Date(taskData.date);
        task.timeslot = taskData.timeslot;
        task.status = taskData.status;
        task.fixedTime = taskData.fixedTime;
        task.reoccuring = taskData.reoccuring;
        task.reoccuringInterval = taskData.reoccuringInterval;
        task.created = taskData.created
        task.lastEdited = taskData.lastEdited

        return task;
    }

    static async getAllTasks() {
        let db = new AbstractModel;
        let allTasksArray = await db.readAllFromLocalDB('tasks');
        let allTasks = [];

        allTasksArray.forEach((element) => {
            if (element.status == 'done') return;

            let task = new Task();
            task.id = element.id;
            task.class = element.class;
            task.subject = element.subject;
            task.description = element.description;
            task.date = new Date(element.date);
            task.timeslot = element.timeslot;
            task.status = element.status;
            task.fixedTime = element.fixedTime;
            task.reoccuring = element.reoccuring;
            task.reoccuringInterval = element.reoccuringInterval;
            task.created = element.created;
            task.lastEdited = element.lastEdited;

            allTasks.push(task)
        });

        allTasks.sort(Fn.sortByDate);

        return allTasks;
    }

    static async getAllTasksInTimespan(startDate, endDate) {
        let allTasksArray = await this.getAllTasks();
        let selectedTasks = [];

        allTasksArray.forEach(task => {
            if (Fn.isDateInTimespan(task.date, startDate, endDate)) selectedTasks.push(task);
        });

        selectedTasks.sort(Fn.sortByDate);

        return selectedTasks;
    }

    //adding a new timetable reorders tasks by changing their date while maintaining the number of lessons between them.
    //It takes all old lesson dates and new dates, finds the index of the task.date and sets the date as the new task.date
    //that has the same index on allNewDates
    static async reorderTasks(oldTimetable, oldTimetableChanges) {
        let currentTimetable = await TaskController.getAllRegularLessons();
        let currentChanges = await TaskController.getAllTimetableChanges();

        let allAffectedTasks = await this.#getAllAffectedTasks() //all tasks after the date of the timetable change

        if (allAffectedTasks.length > 0) {
            let endDate = new Date(allAffectedTasks[allAffectedTasks.length - 1].date).setHours(12, 0, 0, 0) + ONEDAY * 30;

            let subjectsByClass = {};

            //get class names and their subjects for which there are tasks in the allAffacted Tasks
            allAffectedTasks.forEach(task => {
                subjectsByClass[task.class] ? '' : subjectsByClass[task.class] = [];
                if (!subjectsByClass[task.class].includes(task.subject)) subjectsByClass[task.class].push(task.subject);
            });

            //calculate all lesson dates before and after the change for each class/subject combination
            for (let key of Object.keys(subjectsByClass)) {
                let className = key;
                let subjectsArray = subjectsByClass[key];

                for (let subject of subjectsArray) {
                    let allOldLessonDates = await this.calculateAllLessonDates(className, subject, endDate, null, oldTimetable, oldTimetableChanges)
                    let allNewLessonDates = await this.calculateAllLessonDates(className, subject, endDate, null, currentTimetable, currentChanges);

                    //in the unlikely case, a tasks exists without a corresponding lesson, jump to the next subject
                    if (allOldLessonDates.length == 0) continue;
                    if (allNewLessonDates.length == 0) continue;

                    //find the index of the task.date for this class/subject combination on the old dates and then pick the
                    //date with the corresponding index on the new dates and asign it as the new task.date
                    allAffectedTasks.forEach(task => {
                        if (task.class != className) return;
                        if (task.subject != subject) return;

                        let taskDate = new Date(task.date).setHours(12, 0, 0, 0)
                        let match = false;
                        let indexInOldDates = 0;

                        //search for the task.date and get its index
                        while (!match) {
                            if (
                                taskDate == new Date(allOldLessonDates[indexInOldDates].date).setHours(12, 0, 0, 0) &&
                                task.timeslot == allOldLessonDates[indexInOldDates].timeslot
                            ) {
                                match = true;
                            } else {
                                indexInOldDates++
                            }

                            if (!allOldLessonDates[indexInOldDates]) break;
                            if (indexInOldDates > 1000) break;
                        }

                        if (allNewLessonDates[indexInOldDates]) {
                            task.date = allNewLessonDates[indexInOldDates].date;
                            task.timeslot = allNewLessonDates[indexInOldDates].timeslot;
                            task.update();
                        }
                    });
                }
            }
        }
    }

    static async #getAllAffectedTasks() {
        let allTasksArray = await this.getAllTasks();
        let affectedTasks = [];

        allTasksArray.forEach(task => {

            if (task.date.setHours(12, 0, 0, 0) < new Date('2025-06-24').setHours(12, 0, 0, 0)) return;
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
            'status': this.#status,
            'date': this.#date,
            'timeslot': this.#timeslot,
            'description': this.#description,
            'fixedTime': this.#fixedTime,
            'reoccuring': this.#reoccuring,
            'reoccuringInterval': this.#reoccuringInterval,
            'created': this.#created,
            'lastEdited': this.#lastEdited
        }
    }

    getBackupData() {
        return taskBackupArray[this.#id];
    }

    serialize() {
        return {
            id: this.id,
            class: this.class,
            subject: this.subject,
            status: this.status,
            date: this.formatDate(this.date),
            timeslot: this.timeslot,
            description: this.description,
            fixedTime: this.fixedTime,
            reoccuring: this.reoccuring,
            reoccuringInterval: this.reoccuringInterval,
            created: this.created,
            lastEdited: this.lastEdited
        }
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

    get reoccuring() {
        return this.#reoccuring;
    }

    get reoccuringInterval() {
        return this.#reoccuringInterval;
    }

    get created() {
        return this.#created;
    } 
    
    get lastEdited() {
        return this.#lastEdited;
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

    set reoccuring(reoccuring) {
        this.#reoccuring = reoccuring;
    }

    set reoccuringInterval(reoccuringInterval) {
        this.#reoccuringInterval = reoccuringInterval;
    }
    
    set created(created) {
        this.#created = created;
    }

    set lastEdited(lastEdited) {
        this.#lastEdited = lastEdited;
    }
}