import Task from '../Model/Task.js';
import View from '../View/TaskView.js';

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

    static renderTaskChanges(){
        View.renderUpcomingTasks();
        View.renderInProgressTasks();
    }

    static reorderTasks(lesson, timetableChanges, scheduledLessons, lessonCanceled) {

        Task.reorderTasks(lesson, timetableChanges, scheduledLessons, lessonCanceled);
    }
}