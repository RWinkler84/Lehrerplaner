import Task from '../Model/Task.js';
import View from '../View/TaskView.js';
import LessonController from './LessonController.js';

export default class TaskController {

    static async getAllTasks() {
        return await Task.getAllTasks();
    }

    static async getAllOpenTasks() {
        return await Task.getAllOpenTasks();
    }

    static async getAllInProgressTasks() {
        return await Task.getAllInProgressTasks();
    }

    static async getAllTasksInTimespan(startDate, endDate) {
        return await Task.getAllTasksInTimespan(startDate, endDate);
    }

    static async getAllRegularLessons() {
        return await LessonController.getAllRegularLessons();
    }

    static async getAllTimetableChanges() {
        return await LessonController.getAllTimetableChanges();
    }

    static async setTaskBackupData(taskId) {
        let task = await Task.getById(taskId);

        task.setBackupData();
    }

    static async getTaskBackupData(taskId) {
        let task = await Task.getById(taskId);

        return task.getBackupData();
    }

    static createNewTask(event) {
        View.createTaskForm(event);
    }

    static async saveTask(taskData, event) {
        let task = new Task();

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

        await task.save();
        LessonController.renderLesson();

        return true;
    }

    static async getById(id) {
        return await Task.getById(id);
    }

    static async deleteTaskById(id) {
        let task = await Task.getById(id);

        task.delete();
    }

    static async updateTask(taskData, event) {
        let task = await Task.getById(taskData.id);

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
        View.showSetDoneOrInProgressButtons(event);

        return true;
    }

    static async setTaskInProgress(taskId, event) {
        let task = await Task.getById(taskId);

        task.setInProgress();
        this.renderTaskChanges();
        View.showSetDoneOrInProgressButtons(event);
    }

    static async setTaskDone(id, event) {
        let task = await Task.getById(id);

        task.setDone();
        this.renderTaskChanges();

        if (task.reoccuring == 1) View.showSetDoneOrInProgressButtons(event);
        if (task.reoccuring == 0) View.removeTask(event);
        LessonController.renderLesson();
    }

    static async renderTaskChanges() {
        View.renderTasks();
    }

    static async reorderTasks(oldTimetable, oldTimetableChanges) {

        await Task.reorderTasks(oldTimetable, oldTimetableChanges);
        this.renderTaskChanges();
    }

    static tasksTableEventHandler(event) {
        if (event.type == 'dblclick') {
            View.makeEditable(event);
            return;
        }

        if (event.type == 'change' && event.target.name == 'reoccuringTask') {
            View.toggleReoccuringIntervalSelect(event);
            View.toggleFixedDate(event); //if a task is reoccuring, it also has a fixed date in the week
            return;
        }

        if (event.target.classList.contains('setTaskDoneButton')) View.setTaskDone(event);
        if (event.target.classList.contains('setTaskInProgressButton')) View.setTaskInProgress(event);
        if (event.target.classList.contains('saveTaskButton')) View.saveTask(event);
        if (event.target.classList.contains('discardUpdateTaskButton')) View.revertChanges(event);
        if (event.target.classList.contains('discardNewTaskButton')) View.removeTaskForm(event);
    }
}