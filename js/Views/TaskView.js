import AbstractView from './AbstractView.js';
import Controller from '../Controllers/TaskController.js';

export default class TaskView extends AbstractView {

    constructor() {
        super()
    }

    static renderUpcomingTasks() {
        let allUpcomingTasks = Controller.getAllOpenTasks();
        let upcomingTasksTableBody = document.querySelector('#upcomingTasksTable .tbody');
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
                <div class="tr">
                    <div ${borderLeft} data-class="${task.class}" class="td">${task.class}</div>
                    <div class="td"data-subject="${task.subject}">${task.subject}</div>
                    <div class="td taskDescription" data-taskDescription="">${task.description}</div>
                    <div class="taskDone"><button class="saveNewTaskButton">&#x2714;</button><button class="discardNewTaskButton">&#x2718;</button></div>
                </div>
            `;

            // taskTrHTML += `
            //         <tr data-taskid="${task.id}">
            //             <td ${borderLeft} data-class="${task.class}">${task.class}</td>
            //             <td data-subject="${task.subject}">${task.subject}</td>
            //             <td class="taskDescription" data-taskDescription="">${task.description}</td>
            //             <td class="taskDone"><button class="setTaskDoneButton" onclick="Task.setTaskDone(this)">&#x2714;</button></td>
            //         </tr>
            //     `;
        });

        upcomingTasksTableBody.innerHTML = taskTrHTML;

        TaskView.#addEventListenersToTasks();
    }

    // static renderUpcomingTasks() {
    //     let allUpcomingTasks = Controller.getAllOpenTasks();
    //     let upcomingTasksTableBody = document.querySelector('#upcomingTasksTable tbody');
    //     let taskTrHTML = '';


    //     if (allUpcomingTasks.length == 0) {
    //         document.querySelector('#upcomingTasksTable td[data-noEntriesFound]').style.display = 'table-cell';
    //         return;
    //     }

    //     allUpcomingTasks.forEach((task) => {
    //         let borderLeft = 'style="border-left: 3px solid transparent;"';

    //         if (new Date(task.date) < new Date()) {
    //             borderLeft = 'style="border-left: solid 3px var(--matteRed)"'
    //         }

    //         taskTrHTML += `
    //                 <tr data-taskid="${task.id}">
    //                     <td ${borderLeft} data-class="${task.class}">${task.class}</td>
    //                     <td data-subject="${task.subject}">${task.subject}</td>
    //                     <td class="taskDescription" data-taskDescription="">${task.description}</td>
    //                     <td class="taskDone"><button class="setTaskDoneButton" onclick="Task.setTaskDone(this)">&#x2714;</button></td>
    //                 </tr>
    //             `;
    //     });

    //     upcomingTasksTableBody.innerHTML = taskTrHTML;

    //     TaskView.#addEventListenersToTasks();
    // }

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

    static createTaskForm(event) {

        console.log(event.target);

        document.querySelectorAll('tbody td').forEach((td) => {

        });

        let taskTable = document.querySelector('#upcomingTasksTable tbody');

        // let trContent = `
        // <td contenteditable data-class></td>
        // <td data-subject="" style="padding: 0">${subjectSelect}</td>
        // <td class="taskDescription" data-taskDescription contenteditable></td>
        // <td class="taskDone"><button class="saveNewTaskButton">&#x2714;</button><button class="discardNewTaskButton">&#x2718;</button></td>
        // `;

        let trContent = `
            <div class="tr">
                <div class="td">7A</div>
                <div class="td">Deu</div>
                <div class="td">deine Mutter ihr Rock</div>
                <div class="taskDone"><button class="saveNewTaskButton">&#x2714;</button><button class="discardNewTaskButton">&#x2718;</button></div>
            </div>
        `;

        let newTableRow = document.createElement('tr');

        taskTable.append(newTableRow);

        let tr = taskTable.lastElementChild;

        tr.dataset.taskid = '';
        tr.dataset.date = event.target.closest('.weekday').dataset.date;
        tr.dataset.timeslot = event.target.closest('.timeslot').dataset.timeslot;
        tr.innerHTML = trContent;

        tr.firstElementChild.focus();

        tr.querySelector('.saveNewTaskButton').addEventListener('click', TaskView.saveNewTask);
        tr.querySelector('.discardNewTaskButton').addEventListener('click', TaskView.removeTaskForm);
    }

    static saveNewTask(event) {

        let form = event.target.closest('tr');
        let classTd = form.querySelector('td[data-class]');
        let subjectTd = form.querySelector('td[data-subject]');

        let taskData = {
            'class': form.querySelector('td[data-class]').innerText,
            'subject': form.querySelector('td[data-subject] select').value,
            'date': form.dataset.date,
            'timeslot': form.dataset.timeslot,
            'description': form.querySelector('td[data-taskDescription]').innerText
        }

        TaskView.#removeEditability(event);
        TaskView.#removeDiscardButton(event);
        TaskView.#saveTaskToSetDoneButton(event);

        form.querySelector('td').forEach((td) => { td.addEventListener('dblclick', event => TaskView.makeEditable(event)) });
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
        TaskView.#removeDiscardButton(event);
        TaskView.#saveTaskToSetDoneButton(event);
    }

    static makeEditable(event) {

        if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound) return;
        if (event.target.isContentEditable) return;

        this.#backupTaskData(event);

        let parentTr = event.target.closest('tr');

        parentTr.querySelector('td[data-taskdescription]').setAttribute('contenteditable', '');
        parentTr.querySelector('td[data-taskdescription]').focus();

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

    static removeTaskForm(event) {
        event.target.closest('tr').remove();
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