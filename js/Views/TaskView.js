import AbstractView from './AbstractView.js';
import Controller from '../Controllers/TaskController.js';

export default class TaskView extends AbstractView {

    constructor() {
        super()
    }

    static renderUpcomingTasks() {
        let allUpcomingTasks = Controller.getAllOpenTasks();
        let upcomingTasksTableBody = document.querySelector('#upcomingTasksTable tbody');
        let taskTrHTML = '';


        if (allUpcomingTasks.length == 0) {
            document.querySelector('#upcomingTasksTable td[data-noEntriesFound]').style.display = 'table-cell';
            return;
        }

        allUpcomingTasks.forEach((task) => {
            let borderLeft = 'style="border-left: 3px solid transparent;"';

            if (new Date(task.date) < new Date()) {
                borderLeft = 'style="border-left: solid 3px var(--matteRed)"'
            }

            taskTrHTML += `
                    <tr data-taskid="${task.id}">
                        <td ${borderLeft} data-class="${task.class}">${task.class}</td>
                        <td data-subject="${task.subject}">${task.subject}</td>
                        <td class="taskDescription" data-taskDescription="">${task.description}</td>
                        <td class="taskDone">
                            <button class="setTaskDoneButton">&#x2714;</button>
                            <button class="setTaskInProgressButton">&#x2692;</button>                        
                        </td>
                    </tr>
                    <tr>
                        <td class="taskDone responsive" colspan="3">
                            <button class="setTaskDoneButton" onclick="Task.setTaskDone(this)">&#x2714;</button>
                            <button class="setTaskInProgressButton">&#x2692;</button>                        
                        </td>
                    </tr>
                `;
        });

        upcomingTasksTableBody.innerHTML = taskTrHTML;

        //buttons
        document.querySelector('.setTaskDoneButton').addEventListener('click', TaskView.setTaskDone);
        document.querySelector('.setTaskInProgressButton').addEventListener('click', TaskView.setTaskInProgress);

        //make editable
        document.querySelectorAll('#taskContainer td').forEach((td) => {
            td.addEventListener('dblclick', (event) => TaskView.makeEditable(event));
        });
    }

    static renderInProgressTasks() {
        let allInProgressTasks = Controller.getAllInProgressTasks();
        let inProgressTasksTableBody = document.querySelector('#inProgressTasksTable tbody');
        let taskTrHTML = '';


        if (allInProgressTasks.length == 0) {
            document.querySelector('#inProgressTasksTable td[data-noEntriesFound]').style.display = 'table-cell';
            return;
        }

        allInProgressTasks.forEach((task) => {
            let borderLeft = 'style="border-left: 3px solid transparent;"';

            if (new Date(task.date) < new Date()) {
                borderLeft = 'style="border-left: solid 3px var(--matteRed)"'
            }

            taskTrHTML += `
                    <tr data-taskid="${task.id}">
                        <td ${borderLeft} data-class="${task.class}">${task.class}</td>
                        <td data-subject="${task.subject}">${task.subject}</td>
                        <td class="taskDescription" data-taskDescription="">${task.description}</td>
                        <td class="taskDone"><button class="setTaskDoneButton" onclick="Task.setTaskDone(this)">&#x2714;</button></td>
                    </tr>
                `;
        });

        inProgressTasksTableBody.innerHTML = taskTrHTML;
        
        //make editable
        document.querySelectorAll('#taskContainer td').forEach((td) => {
            td.addEventListener('dblclick', (event) => TaskView.makeEditable(event));
        });
    }

    static createTaskForm(event) {

        let lessonElement = event.target.closest('.lesson');
        let className = lessonElement.dataset.class;
        let subject = lessonElement.dataset.subject;
        let date = lessonElement.closest('.weekday').dataset.date;
        let timeslot = lessonElement.closest('.timeslot').dataset.timeslot;

        let taskTable = document.querySelector('#upcomingTasksTable tbody');

        let trContent = `
            <tr data-date="${date}" data-timeslot="${timeslot}" data-new>
                <td data-class="${className}">${className}</td>
                <td data-subject="${subject}">${subject}</td>
                <td class="taskDescription" data-taskDescription contenteditable></td>
                <td class="taskDone">
                    <button class="saveNewTaskButton">&#x2714;</button>
                    <button class="discardNewTaskButton">&#x2718;</button><
                /td>
            </tr>
            <tr data-new>
                <td class="taskDone responsive" colspan="3">
                    <button class="saveNewTaskButton">&#x2714;</button>
                    <button class="discardNewTaskButton">&#x2718;</button>
                </td>
            </tr>
        `;

        taskTable.innerHTML += trContent;

        // button event listeners
        let tr = taskTable.querySelectorAll('tr[data-new]').forEach((tr) => {
            tr.querySelector('.saveNewTaskButton').addEventListener('click', TaskView.saveNewTask);
            tr.querySelector('.discardNewTaskButton').addEventListener('click', TaskView.removeTaskForm);
        });

        taskTable.querySelector('tr[data-new]').querySelector('td[data-taskDescription]').focus();
    }

    static saveNewTask(event) {

        let taskElement = event.target.closest('tbody').querySelector('tr[data-new]');

        let taskData = {
            'class': taskElement.querySelector('td[data-class]').dataset.class,
            'subject': taskElement.querySelector('td[data-subject]').dataset.subject,
            'date': taskElement.dataset.date,
            'timeslot': taskElement.dataset.timeslot,
            'description': taskElement.querySelector('td[data-taskDescription]').innerText
        }

        TaskView.#removeEditability(event);
        TaskView.#createSetDoneOrInProgressButtons(event);
        // TaskView.#saveTaskToSetDoneButton(event);

        //remove 'new' dataset
        event.target.closest('tbody').querySelectorAll('tr[data-new]').forEach(tr => tr.removeAttribute('data-new'));

        taskElement.querySelectorAll('td').forEach((td) => { td.addEventListener('dblclick', event => TaskView.makeEditable(event)) });
        // form.addEventListener('mouseover', hightlightLesson);
        // form.addEventListener('mouseout', removeLessonHighlight);
    }

    static updateTask(event) {
        let taskTr = event.target.closest('tr');
        let classTd = taskTr.querySelector('td[data-class]');
        let subjectTd = taskTr.querySelector('td[data-subject]');

        let taskData = {
            'id': taskTr.dataset.taskid,
            'class': taskTr.querySelector('td[data-class]').innerText,
            'subject': taskTr.querySelector('td[data-subject] select') // select or not?
                ? taskTr.querySelector('td[data-subject] select').value
                : taskTr.querySelector('td[data-subject]').innerText,
            'description': taskTr.querySelector('td[data-taskdescription]').innerText,
        }

        //apply changes to datasets
        classTd.dataset.class = classTd.innerText;
        if (subjectTd.querySelector('td[data-subject] select')) {
            subjectTd.dataset.subject = subjectTd.querySelector('select').value;
        } else {
            subjectTd.dataset.subject = subjectTd.innerText;
        }

        Controller.updateTask(taskData);
        TaskView.#removeEditability(event);
        TaskView.#createSetDoneOrInProgressButtons(event);
    }

    static makeEditable(event) {

        if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound) return;
        if (event.target.isContentEditable) return;

        this.#backupTaskData(event);

        let parentTr = event.target.closest('tr');

        parentTr.querySelector('td[data-taskdescription]').setAttribute('contenteditable', '');
        parentTr.querySelector('td[data-taskdescription]').focus();

        window.getSelection().removeAllRanges();
        TaskView.#createSaveOrDiscardChangesButtons(event);
    }

    static #removeEditability(itemOrEvent) {

        let item = itemOrEvent.target ? itemOrEvent.target : itemOrEvent;

        item.closest('tr').querySelectorAll('td').forEach((td) => {

            // removes the lesson select and transforms td to a normal td

            if (td.dataset.subject || item.dataset.subject == '') {

                td.removeAttribute('style');
                td.removeAttribute('contenteditable');

                if (!td.firstElementChild) return;

                let selection = td.firstElementChild.value;
                td.innerHTML = selection;
            }

            td.removeAttribute('contenteditable');
        });
    }

    static removeTaskForm(event) {
        event.target.closest('tbody').querySelectorAll('tr[data-new]').forEach(tr => tr.remove());
    }

    static revertChanges(event) {
        let parentTr = event.target.closest('tr');
        let taskId = parentTr.dataset.taskid;
        let task = Controller.getTaskBackupData(taskId);

        parentTr.querySelector('td[data-class]').innerText = task.class;
        parentTr.querySelector('td[data-subject]').innerText = task.subject;
        parentTr.querySelector('td[data-taskDescription]').innerText = task.description;
        TaskView.#removeEditability(event);
        TaskView.#createSetDoneOrInProgressButtons(event);
    }

    static setTaskInProgress(event) {
        console.log('bald in Progress')
    }

    static setTaskDone(item) {
        console.log('task erledigt');
        console.log(item);
    }

    static #backupTaskData(event) {

        let parentTr = event.target.closest('tr');
        let taskId = parentTr.dataset.taskid;

        Controller.setTaskBackupData(taskId);
    }


    // every Task has two sets of buttons for responsiveness, so both need to be changed
    static #createSaveOrDiscardChangesButtons(event) {
        let buttonWrapper = event.target.closest('tr').querySelector('.taskDone');
        let buttonWrapperSibling = TaskView.#getButtonWrapperSibling(buttonWrapper);

        let buttonHTML = `
            <button class="updateTaskButton">&#x2714;</button>
            <button class="discardUpdateTaskButton">&#x2718;</button>
        `;

        buttonWrapper.innerHTML = buttonHTML;
        buttonWrapperSibling.innerHTML = buttonHTML;

        buttonWrapper.querySelector('.updateTaskButton').addEventListener('click', TaskView.updateTask);
        buttonWrapper.querySelector('.discardUpdateTaskButton').addEventListener('click', TaskView.revertChanges);

        buttonWrapperSibling.querySelector('.updateTaskButton').addEventListener('click', TaskView.updateTask);
        buttonWrapperSibling.querySelector('.discardUpdateTaskButton').addEventListener('click', TaskView.revertChanges);
    }

    static #createSetDoneOrInProgressButtons(event) {
        let buttonWrapper = event.target.closest('td');
        let buttonWrapperSibling = TaskView.#getButtonWrapperSibling(buttonWrapper);

        let buttonHTML = `
            <button class="setTaskDoneButton">&#x2714;</button>
            <button class="setTaskInProgressButton">&#x2692;</button>
        `;

        buttonWrapper.innerHTML = buttonHTML;
        buttonWrapperSibling.innerHTML = buttonHTML;

        buttonWrapper.querySelector('.setTaskDoneButton').addEventListener('click', TaskView.setTaskDone);
        buttonWrapper.querySelector('.setTaskInProgressButton').addEventListener('click', TaskView.setTaskInProgress);

        buttonWrapperSibling.querySelector('.setTaskDoneButton').addEventListener('click', TaskView.setTaskDone);
        buttonWrapperSibling.querySelector('.setTaskInProgressButton').addEventListener('click', TaskView.setTaskInProgress);
    }

    static #getButtonWrapperSibling(buttonWrapper) {

        if (buttonWrapper.classList.contains('responsive')) {
            return buttonWrapper.closest('tr').previousElementSibling.querySelector('.taskDone');
        } else {
            return buttonWrapper.closest('tr').nextElementSibling.querySelector('.taskDone');
        }
    }
}