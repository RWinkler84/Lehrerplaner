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

        task.update();

        this.renderTaskChanges();            
        View.removeEditability(event);
        View.createSetDoneOrInProgressButtons(event);

        return true;
    }

    static setTaskInProgress(taskId, event) {
        let task = Task.getTaskById(taskId);
        task.setInProgress();
        this.renderTaskChanges();
        View.createSetDoneOrInProgressButtons(event);
    }

    static async setTaskDone(id, event) {
        let task = Task.getTaskById(id);

        task.setDone();
        this.renderTaskChanges();

        if (task.reoccuring == 1) View.createSetDoneOrInProgressButtons(event);
        LessonController.renderLesson();
    }

    static renderTaskChanges() {
        View.rerenderTasks();
    }

    static reorderTasks(oldTimetable, oldTimetableChanges) {

        Task.reorderTasks(oldTimetable, oldTimetableChanges);
        this.renderTaskChanges();
        LessonController.renderLesson();
    }

    static tasksTableEventHandler(event) {
        if (event.type == 'dblclick') {
            View.makeEditable(event);
            return;
        }

        if (event.type == 'change' && event.target.name == 'reoccuringTask') {
            View.toggleReoccuringIntervalSelect(event);
            return;
        }

        if (event.target.classList.contains('setTaskDoneButton')) View.setTaskDone(event);
        if (event.target.classList.contains('setTaskInProgressButton')) View.setTaskInProgress(event);
        if (event.target.classList.contains('saveNewTaskButton')) View.saveNewTask(event);
        if (event.target.classList.contains('discardUpdateTaskButton')) View.revertChanges(event);
        if (event.target.classList.contains('updateTaskButton')) View.updateTask(event);
        if (event.target.classList.contains('discardNewTaskButton')) View.removeTaskForm(event);
    }
}