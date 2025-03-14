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
                        <td class="taskDone"><button class="setTaskDoneButton" onclick="Task.setTaskDone(this)">&#x2714;</button></td>
                    </tr>
                `;
        });

        upcomingTasksTableBody.innerHTML = taskTrHTML;

        TaskView.#addEventListenersToTasks();
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

        TaskView.#addEventListenersToTasks();
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
        TaskView.#removeDiscardButton(event);
        TaskView.#saveTaskToSetDoneButton(event);
    }

    static makeEditable(event) {

        if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound) return;
        if (event.target.isContentEditable) return;

        this.#backupTaskData(event);

        let parentTr = event.target.closest('tr');

        parentTr.querySelectorAll('td:not(.taskDone)').forEach((td) => {

            if (td.dataset.subject) {
                td.innerHTML = this.getSubjectSelectHTML(event);
                td.style.padding = '0';
            }

            td.setAttribute('contenteditable', '');

            event.target.focus();
        });

        window.getSelection().removeAllRanges();
        TaskView.#createSaveAndDiscardChangesButton(event);
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

    static #createSaveAndDiscardChangesButton(event) {
        let parentTr = event.target.closest('tr');
        let buttonTd = parentTr.querySelector('.taskDone');

        if (buttonTd.querySelector('.setTaskDoneButton')) buttonTd.querySelector('.setTaskDoneButton').remove();

        buttonTd.innerHTML = '<button class="updateTaskButton">&#x2714;</button><button class="discardUpdateTaskButton">&#x2718;</button>';
        buttonTd.querySelector('.updateTaskButton').addEventListener('click', (event) => { TaskView.updateTask(event) });
        buttonTd.querySelector('.discardUpdateTaskButton').addEventListener('click', (event) => { TaskView.revertChanges(event) });
    }

    static #saveTaskToSetDoneButton(item) {
    item = item.target ? item.target : item;
    let buttonTd = item.parentElement;

    item.remove();
    buttonTd.innerHTML = '<button class="setTaskDoneButton" onclick="setTaskDone(this)">&#x2714;</button>';
}

    static revertChanges(event) {
        let parentTr = event.target.closest('tr');
        let taskId = parentTr.dataset.taskid;
        let task = Controller.getTaskBackupData(taskId);

        parentTr.querySelector('td[data-class]').innerText = task.class;
        parentTr.querySelector('td[data-subject]').innerText = task.subject;
        parentTr.querySelector('td[data-taskDescription]').innerText = task.description;
        TaskView.#removeEditability(event);
        TaskView.#removeDiscardButton(event);
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

    static #removeDiscardButton(itemOrEvent) {
        let item = itemOrEvent.target ? itemOrEvent.target : item;

        item.classList.contains('discardUpdateTaskButton') ? item.remove() : item.nextSibling.remove()

    }

    static #addEventListenersToTasks() {
        document.querySelectorAll('#taskContainer td').forEach((td) => {
            td.addEventListener('dblclick', (event) => TaskView.makeEditable(event));
        });
    }
}