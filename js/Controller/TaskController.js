import Task from '../Model/Task.js';
import View from '../View/TaskView.js';
import LessonController from './LessonController.js';

export default class TaskController {

    static getAllOpenTasks() {
        return Task.getAllOpenTasks();
    }

    static getAllInProgressTasks() {
        return Task.getAllInProgressTasks();
    }

    static getAllTasksInTimespan(startDate, endDate) {
        return Task.getAllTasksInTimespan(startDate, endDate);
    }

    static setTaskBackupData(taskId) {
        let task = new Task(taskId);

        task.setBackupData();
    }

    static getTaskBackupData(taskId) {
        let task = new Task(taskId);

        return task.getBackupData();
    }

    static createNewTask(event) {
        View.createTaskForm(event);
    }

    static saveNewTask(taskData, event) {
        let task = new Task();

        task.id = taskData.id;
        task.class = taskData.class;
        task.subject = taskData.subject;
        task.date = taskData.date;
        task.timeslot = taskData.timeslot;
        task.description = taskData.description;
        task.status = 'open';
        task.fixedTime = taskData.fixedTime;
        task.reoccuring = taskData.reoccuring;
        task.reoccuringInterval = taskData.reoccuringInterval;


        if (task.reoccuring && task.reoccuringInterval == '') {
            View.alertReoccuringIntervalSelect(event);
            return false;
        }

        if (!task.reoccuring && task.reoccuringInterval != '') task.reoccuringInterval = null;

        task.save();
        LessonController.renderLesson();
        console.log(task)

        return true;
    }

    static deleteTaskById(id) {
        let task = Task.getTaskById(id);

        task.delete();
    }

    static updateTask(taskData, event) {
        let task = new Task(taskData.id);

        task.class = taskData.class;
        task.subject = taskData.subject;
        task.description = taskData.description;
        task.fixedTime = taskData.fixedTime;
        task.reoccuring = taskData.reoccuring;
        task.reoccuringInterval = taskData.reoccuringInterval;

        if (task.reoccuring && task.reoccuringInterval == '') {
            View.alertReoccuringIntervalSelect(event);
            return false;
        }

        if (!task.reoccuring && task.reoccuringInterval != '') task.reoccuringInterval = null;
        console.log(task)

        task.update();

        return true;
    }

    static setTaskInProgress(taskId) {
        let task = Task.getTaskById(taskId);
        task.setInProgress();
    }

    static setTaskDone(id) {
        let task = Task.getTaskById(id);

        task.setDone();
    }

    static renderTaskChanges() {
        View.renderUpcomingTasks();
        View.renderInProgressTasks();
    }

    static reorderTasks(oldTimetable, oldTimetableChanges) {

        Task.reorderTasks(oldTimetable, oldTimetableChanges);
        this.renderTaskChanges();
        LessonController.renderLesson();
    }

}