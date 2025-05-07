import Task from '../Model/Task.js';
import View from '../View/TaskView.js';
import SettingsController from './SettingsController.js';

export default class TaskController {

    static getAllOpenTasks() {
        return Task.getAllOpenTasks();
    }

    static getAllInProgressTasks() {
        return Task.getAllInProgressTasks();
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

    static saveNewTask(taskData) {
        let task = new Task();

        task.id = taskData.id;
        task.class = taskData.class
        task.subject = taskData.subject
        task.date = taskData.date
        task.timeslot = taskData.timeslot
        task.description = taskData.description
        task.status = 'open'
        task.fixedTime = taskData.fixedTime

        task.save();
    }

    static updateTask(taskData) {
        let task = new Task(taskData.id);

        task.class = taskData.class;
        task.subject = taskData.subject;
        task.description = taskData.description;
        task.fixedTime = taskData.fixedTime;

        task.update();
    }

    static setTaskInProgress(taskId) {
        let task = Task.getTaskById(taskId);
        console.log(task);
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

    static reorderTasks(lesson, lessonCanceled) {

        Task.reorderTasks(lesson, lessonCanceled);
    }

    static reorderTasksAfterAddingTimetable(lessons) {

        Task.reorderTasksAfterAddingTimetable(lessons);
    }

    // static getLessonsCountPerWeekPerSubjectAndClass() {
    //     return SettingsController.getLessonsCountPerWeekPerSubjectAndClass();
    // }
}