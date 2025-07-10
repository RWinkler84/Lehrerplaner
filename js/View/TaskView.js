import AbstractView from './AbstractView.js';
import Controller from '../Controller/TaskController.js';
import Fn from '../inc/utils.js';
import { allTasksArray } from '../index.js';

export default class TaskView extends AbstractView {

    constructor() {
        super()
    }

    static renderUpcomingTasks() {
        let allUpcomingTasks = Controller.getAllOpenTasks();
        let upcomingTasksTableBody = document.querySelector('#upcomingTasksTable tbody');

        if (allUpcomingTasks.length == 0) {
            document.querySelector('#upcomingTasksTable thead').style.display = 'none';
            document.querySelector('#upcomingTasksTable tbody').innerHTML = '';
            document.querySelector('#upcomingTasksTable td[data-noEntriesFound]').style.display = 'table-cell';
            return;
        }

        let tableBodyFragment = document.createDocumentFragment();
        let responsiveButtonTR = this.getResponsiveButtonTR('upcomingTask');
        let checkBoxTR = this.getCheckboxTR();

        allUpcomingTasks = Fn.sortByDateAndTimeslot(allUpcomingTasks);

        allUpcomingTasks.forEach((task) => {
            let taskTr = document.createElement('tr');
            let checkBoxTrClone = checkBoxTR.cloneNode(true);
            let responsiveButtonTRClone = responsiveButtonTR.cloneNode(true);

            if (task.fixedTime == '1') checkBoxTrClone.querySelector('input[name="fixedDate"]').checked = true;
            if (task.reoccuring == '1') checkBoxTrClone.querySelector('input[name="reoccuringTask"]').checked = true;

            taskTr.innerHTML = this.getTaskTrHTML(task);
            taskTr.setAttribute('data-taskId', task.id);
            taskTr.setAttribute('data-date', task.date);
            taskTr.setAttribute('data-timeslot', task.timeslot);

            if (new Date(task.date) < new Date()) taskTr.querySelector('.taskAdditionalInfo').classList.add('overdue');

            tableBodyFragment.append(taskTr);
            tableBodyFragment.append(checkBoxTrClone);
            tableBodyFragment.append(responsiveButtonTRClone);
        });

        upcomingTasksTableBody.append(tableBodyFragment);

        //highlighting off both TRs when the checkbox TR is hovered, because selecting backwards is impossible in CSS :$
        document.querySelectorAll('tr[data-checkboxtr]').forEach(tr => {
            tr.addEventListener('mouseenter', this.highlightCheckboxTrPreviousSibling);
            tr.addEventListener('mouseleave', this.removeHighlightCheckboxTrPreviousSibling);
        });
    }

    static renderInProgressTasks() {
        let allInProgressTasks = Controller.getAllInProgressTasks();
        let inProgressTasksTableBody = document.querySelector('#inProgressTasksTable tbody');

        if (allInProgressTasks.length == 0) {
            document.querySelector('#inProgressTasksTable thead').style.display = 'none';
            document.querySelector('#inProgressTasksTable tbody').innerHTML = '';
            document.querySelector('#inProgressTasksTable td[data-noEntriesFound]').style.display = 'table-cell';
            return;
        }

        if (document.querySelector('#inProgressTasksTable td[data-noEntriesFound]').style.display = 'table-cell') {
            document.querySelector('#inProgressTasksTable thead').style.display = 'table-row-group  ';
            document.querySelector('#inProgressTasksTable td[data-noEntriesFound]').style.display = 'none';
        }

        let tableBodyFragment = document.createDocumentFragment();
        let responsiveButtonTR = this.getResponsiveButtonTR('upcomingTask');
        let checkBoxTR = this.getCheckboxTR();

        allInProgressTasks = Fn.sortByDateAndTimeslot(allInProgressTasks);

        allInProgressTasks.forEach((task) => {
            let taskTr = document.createElement('tr');
            let checkBoxTrClone = checkBoxTR.cloneNode(true);
            let responsiveButtonTRClone = responsiveButtonTR.cloneNode(true);

            if (task.fixedTime == '1') checkBoxTrClone.querySelector('input[name="fixedDate"]').checked = true;
            if (task.reoccuring == '1') checkBoxTrClone.querySelector('input[name="reoccuringTask"]').checked = true;

            taskTr.innerHTML = this.getTaskTrHTML(task);
            taskTr.setAttribute('data-taskId', task.id);
            taskTr.setAttribute('data-date', task.date);
            taskTr.setAttribute('data-timeslot', task.timeslot);

            taskTr.querySelector('.setTaskInProgressButton').remove();

            if (new Date(task.date) < new Date()) taskTr.querySelector('.taskAdditionalInfo').classList.add('overdue');

            tableBodyFragment.append(taskTr);
            tableBodyFragment.append(checkBoxTrClone);
            tableBodyFragment.append(responsiveButtonTRClone);
        });

        inProgressTasksTableBody.append(tableBodyFragment);

        //buttons
        inProgressTasksTableBody.querySelectorAll('.setTaskDoneButton').forEach(button => button.addEventListener('click', TaskView.setTaskDone))
        inProgressTasksTableBody.querySelectorAll('input[name="reoccuringTask"]').forEach(checkbox => checkbox.addEventListener('change', TaskView.toggleReoccuringIntervalSelect))

        //highlighting off both TRs when the checkbox TR is hovered, because selecting backwards is impossible in CSS :$
        document.querySelectorAll('tr[data-checkboxtr]').forEach(tr => {
            tr.addEventListener('mouseenter', this.highlightCheckboxTrPreviousSibling);
            tr.addEventListener('mouseleave', this.removeHighlightCheckboxTrPreviousSibling);
        });
    }

    static createTaskForm(event) {

        let lessonElement = event.target.closest('.lesson');
        let id = Fn.generateId(allTasksArray);
        let className = lessonElement.dataset.class;
        let subject = lessonElement.dataset.subject;
        let date = lessonElement.closest('.weekday').dataset.date;
        let timeslot = lessonElement.closest('.timeslot').dataset.timeslot;

        let taskTable = document.querySelector('#upcomingTasksTable tbody');

        let trContent = `
            <tr data-taskid="${id}" data-date="${date}" data-timeslot="${timeslot}" data-new>
                <td class="taskAdditionalInfo"></td>
                <td class="taskClassName" data-class="${className}">${className}</td>
                <td data-subject="${subject}"><div  class="taskSubject">${subject}</div></td>
                <td class="taskDescription" data-taskDescription contenteditable></td>
                <td class="taskDone">
                    <button class="saveNewTaskButton">&#x2714;</button>
                    <button class="discardNewTaskButton">&#x2718;</button>
                </td>
            </tr>
            <tr data-checkboxTr data-new>
                <td colspan="5" style="border-right: none;">
                    <div class="flex doubleGap">
                        <div>
                            <label><input type="checkbox" name="fixedDate" value="fixed">fester Termin?</label>
                        </div>
                        <div class="flex">
                            <label><input type="checkbox" name="reoccuringTask" value="reoccuring">wiederholen?</label>
                            <div class="alertRing">
                                <select name="reoccuringIntervalSelect" class="reoccuringIntervalSelect" disabled>
                                    <option value="" selected>-</option>
                                    <option value="weekly">wöchentlich</option>
                                    <option value="biweekly">zweiwöchentlich</option>
                                    <option value="monthly">monatlich</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
            <tr data-new>
                <td class="taskDone responsive" colspan="4">
                    <button class="saveNewTaskButton">&#x2714;</button>
                    <button class="discardNewTaskButton">&#x2718;</button>
                </td>
            </tr>
        `;

        taskTable.innerHTML += trContent;
        if (taskTable.parentElement.querySelector('td[data-noentriesfound]').style.display == 'table-cell') {
            taskTable.parentElement.querySelector('thead').removeAttribute('style');
            taskTable.parentElement.querySelector('td[data-noentriesfound]').style.display = 'none';
        }

        // button event listeners
        taskTable.querySelectorAll('tr[data-new]').forEach((tr) => {
            if (tr.hasAttribute('data-checkboxTr')) {
                tr.querySelector('input[name="reoccuringTask"]').addEventListener('change', TaskView.toggleReoccuringIntervalSelect);
                return;
            }
            tr.querySelector('.saveNewTaskButton').addEventListener('click', TaskView.saveNewTask);
            tr.querySelector('.discardNewTaskButton').addEventListener('click', TaskView.removeTaskForm);
        });

        //make sure that the last task description field added gets the focus
        let newTaskDescriptionTds = taskTable.querySelectorAll('tr[data-new] td[data-taskDescription]');
        newTaskDescriptionTds[newTaskDescriptionTds.length - 1].focus();

        //make all tasks editable again
        document.querySelectorAll('#taskContainer td').forEach((td) => {
            td.addEventListener('dblclick', (event) => TaskView.makeEditable(event));
        });
    }

    static getTaskTrHTML(task) {
        let subjectDate = Fn.formatDate(task.date);
        let additionalInfo = this.getAdditionalInfoHTML(task);

        return `
            <tr data-taskid="${task.id}" data-date="${task.date}" data-timeslot="${task.timeslot}">
                <td class="taskAdditionalInfo">${additionalInfo}</td>
                <td class="taskClassName" data-class="${task.class}">${task.class}</td>
                <td class="taskSubjectContainer" data-subject="${task.subject}">
                    <div class="taskSubject">${task.subject}</div>
                    <div class="smallDate">${subjectDate}</div>
                </td>
                <td class="taskDescription" data-taskDescription="">${task.description}</td>
                <td class="taskDone">
                    <button class="setTaskDoneButton">&#x2714;</button>
                    <button class="setTaskInProgressButton">&#x279C;</button>                        
                </td>
            </tr>
            `;
    }

    static getCheckboxTR() {
        let checkboxTr = document.createElement('tr');

        checkboxTr.style.display = 'none';
        checkboxTr.setAttribute('data-checkboxTr', '');
        checkboxTr.innerHTML = `
            <td colspan="5" style="border-right: none;">
                <div class="flex doubleGap">
                    <div>
                        <label><input type="checkbox" name="fixedDate" value="fixed">fester Termin?</label>
                    </div>
                    <div class="flex">
                        <label><input type="checkbox" name="reoccuringTask" value="reoccuring">wiederholen?</label>
                        <div class="alertRing">
                            <select name="reoccuringIntervalSelect" class="reoccuringIntervalSelect" disabled>
                                <option value="" selected>-</option>
                                <option value="weekly">wöchentlich</option>
                                <option value="biweekly">zweiwöchentlich</option>
                                <option value="monthly">monatlich</option>
                            </select>
                        </div>
                    </div>
                </div>
            </td>
        `;

        return checkboxTr;
    }

    static getResponsiveButtonTR(whereToUse) {
        let buttonTR = document.createElement('tr');
        let htmlContent = '';

        switch (whereToUse) {
            case 'upcomingTask':
                htmlContent = `
                    <td class="taskDone responsive" colspan="4">
                        <button class="setTaskDoneButton">&#x2714;</button>
                        <button class="setTaskInProgressButton">&#x279C;</button>                        
                    </td>
                `;
                break;

            case 'inProgressTask':
                htmlContent = `
                    <td class="taskDone responsive" colspan="4">
                        <button class="setTaskDoneButton" style="width: 100%">&#x2714;</button>
                    </td>
                `;
                break;
            case 'newTask':
                htmlContent = `
                    <td class="taskDone responsive" colspan="4">
                        <button class="saveNewTaskButton">&#x2714;</button>
                        <button class="discardNewTaskButton">&#x2718;</button>
                    </td>
                `;
        }

        buttonTR.innerHTML = htmlContent;

        return buttonTR;
    }

    static getAdditionalInfoHTML(task) {
        let additionalInfoHTML = '';

        if (task.reoccuring == true) additionalInfoHTML = '&#x27F3;';

        return additionalInfoHTML;
    }

    static toggleReoccuringIntervalSelect(event) {

        let selectInput = event.target.closest('div').querySelector('select');

        if (event.target.checked) {
            selectInput.removeAttribute('disabled')
        } else {
            selectInput.setAttribute('disabled', '');
        }
    }

    static saveNewTask(event) {

        let taskElement = event.target.closest('td').classList.contains('responsive')
            ? event.target.closest('tr').previousElementSibling.previousElementSibling
            : event.target.closest('tr');
        let checkBoxElement = taskElement.nextElementSibling;

        let taskData = {
            'id': taskElement.dataset.taskid,
            'class': taskElement.querySelector('td[data-class]').dataset.class,
            'subject': taskElement.querySelector('td[data-subject]').dataset.subject,
            'date': taskElement.dataset.date,
            'timeslot': taskElement.dataset.timeslot,
            'description': taskElement.querySelector('td[data-taskDescription]').innerText,
            'fixedTime': checkBoxElement.querySelector('input[name="fixedDate"]').checked,
            'reoccuring': checkBoxElement.querySelector('input[name="reoccuringTask"]').checked,
            'reoccuringInterval': checkBoxElement.querySelector('select').value
        }

        if (Controller.saveNewTask(taskData, event)) {

            TaskView.#removeNewDataset(event);
            TaskView.#removeEditability(event);
            TaskView.#createSetDoneOrInProgressButtons(event);
            TaskView.renderUpcomingTasks();
        }
    }

    static updateTask(event) {
        let taskTr = event.target.closest('tr');
        if (event.target.closest('td').classList.contains('responsive')) taskTr = event.target.closest('tr').previousElementSibling.previousElementSibling

        let classTd = taskTr.querySelector('td[data-class]');
        let subjectTd = taskTr.querySelector('td[data-subject]');

        let taskData = {
            'id': taskTr.dataset.taskid,
            'class': classTd.dataset.class,
            'subject': subjectTd.dataset.subject,
            'description': taskTr.querySelector('td[data-taskdescription]').innerText,
            'fixedTime': taskTr.nextElementSibling.querySelector('input[type="checkbox"]').checked,
            'reoccuring': taskTr.nextElementSibling.querySelector('input[name="reoccuringTask"]').checked,
            'reoccuringInterval': taskTr.nextElementSibling.querySelector('select').value
        }

        Controller.updateTask(taskData, event);
    }

    static makeEditable(event) {

        if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound) return;

        this.#backupTaskData(event);

        let parentTr = event.target.closest('tr');

        parentTr.querySelector('td[data-taskdescription]').setAttribute('contenteditable', '');
        parentTr.nextElementSibling.style.display = 'table-row';
        parentTr.querySelector('td[data-taskdescription]').focus();

        window.getSelection().removeAllRanges();
        TaskView.#createSaveOrDiscardChangesButtons(event);
        parentTr.removeEventListener('dblclick', (event) => TaskView.makeEditable(event));
    }

    static highlightCheckboxTrPreviousSibling(event) {
        event.target.closest('tr').previousElementSibling.style.backgroundColor = 'var(--lightergrey)';
    }

    static removeHighlightCheckboxTrPreviousSibling(event) {
        event.target.closest('tr').previousElementSibling.removeAttribute('style');
    }

    static #removeEditability(event) {

        let taskTr = event.target.closest('tr');
        if (event.target.closest('td').classList.contains('responsive')) taskTr = event.target.closest('tr').previousElementSibling.previousElementSibling

        taskTr.querySelector('td[data-taskdescription]').removeAttribute('contenteditable');
        taskTr.nextElementSibling.style.display = "none";
    }

    static #removeNewDataset(event) {
        //removes 'new' dataset of the given task form, after it was saved

        let buttonWrapper = event.target.closest('td');
        let buttonWrapperSibling = TaskView.#getButtonWrapperSibling(buttonWrapper);
        let fixedDateTr = () => {
            if (buttonWrapper.classList.contains('responsive')) {
                return buttonWrapper.closest('tr').previousElementSibling;
            } else {
                return buttonWrapper.closest('tr').nextElementSibling;
            }
        };

        buttonWrapper.closest('tr').removeAttribute('data-new');
        buttonWrapperSibling.closest('tr').removeAttribute('data-new');
        fixedDateTr().removeAttribute('data-new');
        fixedDateTr().style.display = 'none';
    }

    static removeTaskForm(event) {

        let tableBody = event.target.closest('tbody');
        let firstFormTr = event.target.classList.contains('responsive')
            ? event.target.closest('tr').previousElementSibling.previousElementSibling
            : event.target.closest('tr');

        firstFormTr.nextElementSibling.nextElementSibling.remove();
        firstFormTr.nextElementSibling.remove();
        firstFormTr.remove();

        if (tableBody.querySelectorAll('td').length == 0) {
            tableBody.previousElementSibling.style.display = 'none';
            tableBody.nextElementSibling.querySelector('td[data-noentriesfound]').style.display = 'table-cell';
            return;
        }
    }

    static revertChanges(event) {
        let taskTr = event.target.closest('tr');
        let selectTr = event.target.closest('tr').nextElementSibling;

        if (event.target.closest('td').classList.contains('responsive')) {
            taskTr = event.target.closest('tr').previousElementSibling.previousElementSibling
            selectTr = event.target.closest('tr').previousElementSibling;
        }

        if (taskTr.hasAttribute('data-new')) {
            taskTr.remove();
            selectTr.remove();

            return;
        }

        let taskId = taskTr.dataset.taskid;
        let task = Controller.getTaskBackupData(taskId);
        let taskDate = Fn.formatDate(task.date);

        taskTr.querySelector('td[data-class]').innerText = task.class;
        taskTr.querySelector('td[data-subject]').innerHTML = `<div class="taskSubject">${task.subject}</div><div class="smallDate">${taskDate}</div>`;
        taskTr.querySelector('td[data-taskDescription]').innerHTML = task.description;

        selectTr.querySelector('input[name="fixedDate"]').checked = task.fixedTime == 1 ? true : false;
        selectTr.querySelector('input[name="reoccuringTask"]').checked = task.reoccuring == 1 ? true : false;
        selectTr.querySelector('.alertRing').innerHTML = TaskView.getReoccuringIntervalSelectHTML(task);

        TaskView.#removeEditability(event);
        TaskView.#createSetDoneOrInProgressButtons(event);
    }

    static setTaskInProgress(event) {
        console.log(event.target);

        let taskId = event.target.closest('tr').dataset.taskid;

        Controller.setTaskInProgress(taskId);
        TaskView.renderUpcomingTasks();
        TaskView.renderInProgressTasks();
    }

    static setTaskDone(event) {
        let taskId = event.target.closest('tr').dataset.taskid;

        Controller.setTaskDone(taskId);
        TaskView.renderInProgressTasks();
        TaskView.renderUpcomingTasks();
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
        let buttonWrapper = event.target.closest('tr').lastElementChild;
        let buttonWrapperSibling = TaskView.#getButtonWrapperSibling(buttonWrapper);

        let buttonHTML = `
            <button class="setTaskDoneButton">&#x2714;</button>
            <button class="setTaskInProgressButton">&#x279C;</button>
        `;

        if (event.target.closest('table').getAttribute('id') == 'inProgressTasksTable') {
            buttonHTML = '<button class="setTaskDoneButton">&#x2714;</button>'

        }

        buttonWrapper.innerHTML = buttonHTML;
        buttonWrapperSibling.innerHTML = buttonHTML;

        buttonWrapper.querySelector('.setTaskDoneButton').addEventListener('click', TaskView.setTaskDone);
        if (buttonWrapper.querySelector('.setTaskInProgressButton')) buttonWrapper.querySelector('.setTaskInProgressButton').addEventListener('click', TaskView.setTaskInProgress);

        buttonWrapperSibling.querySelector('.setTaskDoneButton').addEventListener('click', TaskView.setTaskDone);
        if (buttonWrapperSibling.querySelector('.setTaskInProgressButton')) buttonWrapperSibling.querySelector('.setTaskInProgressButton').addEventListener('click', TaskView.setTaskInProgress);
    }

    static #getButtonWrapperSibling(buttonWrapper) {

        if (buttonWrapper.classList.contains('responsive')) {
            return buttonWrapper.closest('tr').previousElementSibling.previousElementSibling.querySelector('.taskDone');
        } else {
            return buttonWrapper.closest('tr').nextElementSibling.nextElementSibling.querySelector('.taskDone');
        }
    }

    //validation errors
    static alertReoccuringIntervalSelect(event) {
        let selectTr;
        let alertRing;

        if (event.target.closest('td').classList.contains('responsive')) {
            selectTr = event.target.closest('tr').previousElementSibling;
        } else {
            selectTr = event.target.closest('tr').nextElementSibling;
        }

        alertRing = selectTr.querySelector('select').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}