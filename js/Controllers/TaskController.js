import Task from '../Models/Task.js';
import TaskView from '../Views/TaskView.js';

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

    static createNewTask(){
        TaskView.createNewTask();
    }
    
    static updateTask(taskData) {
        let task = new Task(taskData.id);

        task.class = taskData.class;
        task.subject = taskData.subject;
        task.description = taskData.description;

        task.update();
    }
}