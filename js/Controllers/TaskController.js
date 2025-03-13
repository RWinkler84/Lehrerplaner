import Task from '../Models/Task.js';

export default class TaskController{
    
    static getAllOpenTasks(){
        return Task.getAllOpenTasks();
    }

    static backupTaskData(taskId) {
        let task = new Task(taskId);

        console.log(task);
        task.backupData();
    }
}