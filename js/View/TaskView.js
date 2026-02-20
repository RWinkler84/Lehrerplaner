import AbstractView from './AbstractView.js';
import Controller from '../Controller/TaskController.js';
import Fn from '../inc/utils.js';
import { ANIMATIONRUNTIME } from '../index.js';

export default class TaskView extends AbstractView {

    constructor() {
        super()
    }

    //renders and reorders open and inProgress tasks on app start and whenever something changes
    //to optimize performance, it uses already rendered html elements and updates them, if there are any 
    static async renderTasks() {

        const openTaskTable = document.querySelector('#upcomingTasksTable');
        const inProgressTaskTable = document.querySelector('#inProgressTasksTable');
        const openTaskTableBody = openTaskTable.querySelector('tbody');
        const inProgressTaskTableBody = inProgressTaskTable.querySelector('tbody');

        //node lists and task objects
        let allOpenTasks = await Controller.getAllOpenTasks();
        let allInProgressTasks = await Controller.getAllInProgressTasks();
        let allRenderedTaskTrs = [];

        //array with task ids
        let allOpenTaskIds = [];
        let allInProgressTaskIds = [];

        if (allOpenTasks.length > 0) {
            openTaskTable.querySelector('thead').removeAttribute('style');
            openTaskTable.querySelector('td[data-noentriesfound]').style.display = 'none';

        } else {
            openTaskTable.querySelector('thead').style.display = 'none'; openTaskTable
            openTaskTable.querySelector('td[data-noentriesfound]').style.display = 'table-cell';
        }

        if (allInProgressTasks.length > 0) {
            inProgressTaskTable.querySelector('thead').removeAttribute('style');
            inProgressTaskTable.querySelector('td[data-noentriesfound]').style.display = 'none';
        } else {
            inProgressTaskTable.querySelector('thead').style.display = 'none';
            inProgressTaskTable.querySelector('td[data-noentriesfound]').style.display = 'table-cell';
        }

        allOpenTasks.forEach(task => {
            allOpenTaskIds.push(task.id);
            allOpenTaskIds.push(0) //the zero represent the checkbox tr
        });

        allInProgressTasks.forEach(task => {
            allInProgressTaskIds.push(task.id);
            allOpenTaskIds.push(0) //the zero represent the checkbox tr
        });

        document.querySelectorAll('.taskList')
            .forEach(taskList => taskList.querySelectorAll('tr')
                .forEach(tr => {
                    allRenderedTaskTrs.push(tr);
                    tr.remove();
                })
            );

        allOpenTaskIds.forEach(taskId => {
            if (taskId == 0) return;

            let taskElement;
            let checkBoxElement;

            allRenderedTaskTrs.forEach((element, index) => {
                if (element.dataset.taskid == taskId) {
                    taskElement = element;
                    checkBoxElement = allRenderedTaskTrs[index + 1];

                    //task dates and timeslots and additional infos may change and need to be updated
                    allOpenTasks.forEach(task => {
                        if (task.id == taskId) {
                            this.updateTaskElement(taskElement, task);
                            this.updateCheckBoxElement(checkBoxElement, taskElement, task);
                        }
                    });
                }
            });

            //no element was found, because the task wasn't rendered yet (added by a syncing data from another device)                
            if (!taskElement) {
                let task = allOpenTasks.find(task => task.id == taskId);
                taskElement = this.getTaskTrHTML(task);
                checkBoxElement = this.getCheckboxTR(task);
            }

            openTaskTableBody.insertBefore(taskElement, openTaskTableBody.children[allOpenTaskIds.indexOf(taskId)]);
            openTaskTableBody.insertBefore(checkBoxElement, taskElement.nextElementSibling);
        });

        //reappend previously unsaved task forms
        if (allInProgressTaskIds.length < allRenderedTaskTrs.length) {
            allRenderedTaskTrs.forEach(tr => {
                if (openTaskTableBody.contains(tr)) return;
                if (tr.hasAttribute('data-new')) openTaskTableBody.append(tr);
            });
        }

        allInProgressTaskIds.forEach(taskId => {
            if (taskId == 0) return;

            let taskElement;
            let checkBoxElement;

            allRenderedTaskTrs.forEach((element, index) => {
                if (element.dataset.taskid == taskId) {
                    taskElement = element;
                    checkBoxElement = allRenderedTaskTrs[index + 1];

                    //task dates my change and need to be updated while reordering
                    allInProgressTasks.forEach(task => {
                        if (task.id == taskId) {
                            this.updateTaskElement(taskElement, task);
                            this.updateCheckBoxElement(checkBoxElement, taskElement, task);
                        }
                    });
                }
            });

            //no element was found, because the task wasn't rendered yet (added by a syncing data from another device)
            if (!taskElement) {
                let task = allInProgressTasks.find(task => task.id == taskId);
                taskElement = this.getTaskTrHTML(task);
                checkBoxElement = this.getCheckboxTR(task);
            }

            inProgressTaskTableBody.insertBefore(taskElement, inProgressTaskTableBody.children[allOpenTaskIds.indexOf(taskId)]);
            inProgressTaskTableBody.insertBefore(checkBoxElement, taskElement.nextElementSibling);
        })
    }

    static updateTaskElement(taskElement, task) {
        let buttonTd = taskElement.querySelector('.taskDone');
        if (buttonTd.querySelector('.editableTask').style.display == 'flex') return; //is the task tr editable, leave it as is

        taskElement.dataset.date = task.date;
        taskElement.dataset.timeslot = task.timeslot;

        taskElement.querySelector('.taskClassName').textContent = task.class;
        taskElement.querySelector('.taskSubject').textContent = task.subject;
        taskElement.querySelector('.smallDate').textContent = Fn.formatDate(task.date);
        taskElement.querySelector('.smallDate').removeAttribute('style');
        taskElement.querySelector('.taskDateSelectWrapper').innerHTML = '';
        taskElement.querySelector('.taskDateSelectWrapper').removeAttribute('style');
        taskElement.querySelector('.taskDescription').innerHTML = task.description;

        taskElement.querySelector('.taskAdditionalInfo').innerHTML = this.getAdditionalInfoHTML(task);

        if (new Date(task.date) < new Date()) {
            taskElement.querySelector('.taskAdditionalInfo').classList.add('overdue');
        } else {
            taskElement.querySelector('.taskAdditionalInfo').classList.remove('overdue');
        }

        //button update

        if (task.status == 'open') {
            buttonTd.querySelector('.openTask').style.display = 'flex';
            buttonTd.querySelector('.inProgressTask').style.display = 'none';
        }
        if (task.status == 'inProgress') {
            buttonTd.querySelector('.openTask').style.display = 'none';
            buttonTd.querySelector('.inProgressTask').style.display = 'flex';
        }
    }

    static updateCheckBoxElement(checkBoxElement, taskElement, task) {
        let buttonTd = taskElement.querySelector('.taskDone');
        if (buttonTd.querySelector('.editableTask').style.display == 'flex') return; //is the task tr editable, leave it as is

        if (task.fixedTime == '1') {
            checkBoxElement.querySelector('input[name="fixedDate"]').checked = true;
        } else {
            checkBoxElement.querySelector('input[name="fixedDate"]').checked = false;
        }

        if (task.reoccuring == '1') {
            checkBoxElement.querySelector('input[name="reoccuringTask"]').checked = true;
            checkBoxElement.querySelector('select').disabled = false;
            checkBoxElement.querySelector('input[name="fixedDate"]').disabled = true;
            checkBoxElement.querySelectorAll('option').forEach(option => {
                option.selected = false;
                if (option.value == task.reoccuringInterval) option.selected = true;
            });
        } else {
            checkBoxElement.querySelector('input[name="reoccuringTask"]').checked = false;
            checkBoxElement.querySelector('select').disabled = true;
            checkBoxElement.querySelector('input[name="fixedDate"]').disabled = false;
            checkBoxElement.querySelectorAll('option').forEach(option => {
                option.selected = false;
                if (option.value == task.reoccuringInterval) option.selected = true;
            });
        }

        return checkBoxElement;
    }

    static async createTaskForm(event) {
        let lessonElement = event.target.closest('.lesson');
        let taskTable = document.querySelector('#upcomingTasksTable tbody');

        let task = {
            class: lessonElement.dataset.class,
            subject: lessonElement.dataset.subject,
            date: lessonElement.closest('.weekday').dataset.date,
            timeslot: lessonElement.closest('.timeslot').dataset.timeslot,
            description: ''
        }

        let formTr = this.getTaskTrHTML(task);;
        let checkBoxTR = this.getCheckboxTR();

        checkBoxTR.setAttribute('data-new', '');
        checkBoxTR.removeAttribute('style');

        formTr.setAttribute('data-new', '');
        formTr.setAttribute('data-taskId', task.id);
        formTr.setAttribute('data-date', task.date);
        formTr.setAttribute('data-timeslot', task.timeslot);

        formTr.querySelector('.taskDescription').contentEditable = true;
        formTr.querySelectorAll('.taskDone>div').forEach(div => {
            if (div.classList.contains('editableTask')) {
                div.style.display = 'flex';
            } else {
                div.style.display = 'none';
            }
        })

        taskTable.append(formTr);
        taskTable.append(checkBoxTR);

        if (taskTable.parentElement.querySelector('td[data-noentriesfound]').style.display == 'table-cell') {
            taskTable.parentElement.querySelector('thead').removeAttribute('style');
            taskTable.parentElement.querySelector('td[data-noentriesfound]').style.display = 'none';
        }

        //make sure that the last task description field added gets the focus
        let newTaskDescriptionTds = taskTable.querySelectorAll('tr[data-new] td[data-taskDescription]');
        newTaskDescriptionTds[newTaskDescriptionTds.length - 1].focus();
    }

    static getTaskTrHTML(task) {
        let taskTr = document.createElement('tr');
        let subjectDate = Fn.formatDate(task.date);
        let additionalInfo = this.getAdditionalInfoHTML(task);

        taskTr.setAttribute('data-taskId', task.id);
        taskTr.setAttribute('data-date', task.date);
        taskTr.setAttribute('data-timeslot', task.timeslot);

        taskTr.innerHTML = `
            <tr data-taskid="${task.id}" data-date="${task.date}" data-timeslot="${task.timeslot}">
                <td class="taskAdditionalInfo">${additionalInfo}</td>
                <td class="taskClassName" data-class="${task.class}" data-heading="Klasse:">${task.class}</td>
                <td class="taskSubjectContainer" data-subject="${task.subject}" data-heading="Fach:">
                    <div class="taskSubject">${task.subject}</div>
                    <div class="smallDate">${subjectDate}</div>
                    <div class="taskDateSelectWrapper"></div>
                </td>
                <td class="taskDescription" data-taskDescription="" data-heading="Beschreibung:">${task.description}</td>
                <td class="taskDone">
                    <div class="openTask">
                        <button class="confirmationButton setTaskDoneButton" title="erledigt"><span class="icon checkIcon"></span></button>
                        <button class="orangeButton setTaskInProgressButton" title="in Arbeit"><span class="icon inProgressIcon"></span></button>

                    </div>
                    <div class="editableTask" style="display: none">
                        <button class="confirmationButton saveTaskButton" title="speichern"><span class="icon checkIcon"></span></button>
                        <button class="cancelButton discardNewTaskButton" title="verwerfen"><span class="icon crossIcon"></span></button>
                    </div>
                    <div class="inProgressTask" style="display: none">
                        <button class="confirmationButton setTaskDoneButton" title="erledigt"><span class="icon checkIcon"></span></button>
                    </div>                      
                </td>
            </tr>
            `;

        // <button class="setTaskInProgressButton">&#x279C;</button>

        if (new Date(task.date) < new Date()) taskTr.querySelector('.taskAdditionalInfo').classList.add('overdue');

        let buttonTd = taskTr.querySelector('.taskDone');

        if (task.status == 'open') {
            buttonTd.querySelector('.openTask').style.display = 'flex';
            buttonTd.querySelector('.inProgressTask').style.display = 'none';
        }
        if (task.status == 'inProgress') {
            buttonTd.querySelector('.openTask').style.display = 'none';
            buttonTd.querySelector('.inProgressTask').style.display = 'flex';
        }

        return taskTr;
    }

    static getCheckboxTR(task = null) {
        let checkboxTr = document.createElement('tr');

        checkboxTr.style.display = 'none';
        checkboxTr.setAttribute('data-checkboxTr', '');
        checkboxTr.innerHTML = `
            <td colspan="5" style="border-right: none;">
                <div class="flex doubleGap alignCenter">
                    <div>
                        <label><input type="checkbox" name="fixedDate" value="fixed">fester Termin?</label>
                    </div>
                    <div class="flex alignCenter reoccuringTaskContainer" >
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

        if (task) {
            if (task.fixedTime == '1') checkboxTr.querySelector('input[name="fixedDate"]').checked = true;
            if (task.reoccuring == '1') {
                checkboxTr.querySelector('input[name="reoccuringTask"]').checked = true;
                checkboxTr.querySelector('select').disabled = false;
                checkboxTr.querySelector('input[name="fixedDate"]').disabled = true;
                checkboxTr.querySelectorAll('option').forEach(option => {
                    option.selected = false;
                    if (option.value == task.reoccuringInterval) option.selected = true;
                });
            }

            return checkboxTr;
        }

        return checkboxTr;
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

    static async toggleFixedDate(event) {
        let taskId = event.target.closest('tr').previousElementSibling.dataset.taskid;
        let fixedDateCheckbox = event.target.closest('td').querySelector('input[name="fixedDate"]');
        let task = await Controller.getById(taskId)
        let checkboxOriginalState = task.fixedTime == '1' ? true : false;

        if (event.target.checked) {
            fixedDateCheckbox.checked = true;
            fixedDateCheckbox.disabled = true;
        } else {
            fixedDateCheckbox.checked = checkboxOriginalState;
            fixedDateCheckbox.disabled = false;
        }
    }

    static async saveTask(event) {
        let taskElement = event.target.closest('tr');

        if (!taskElement.hasAttribute('data-new')) {
            this.updateTask(event);
            return;
        }

        let checkBoxElement = taskElement.nextElementSibling;

        let taskData = {
            'class': taskElement.querySelector('td[data-class]').dataset.class,
            'subject': taskElement.querySelector('td[data-subject]').dataset.subject,
            'date': taskElement.dataset.date,
            'timeslot': taskElement.dataset.timeslot,
            'description': taskElement.querySelector('td[data-taskDescription]').innerText,
            'fixedTime': checkBoxElement.querySelector('input[name="fixedDate"]').checked,
            'reoccuring': checkBoxElement.querySelector('input[name="reoccuringTask"]').checked,
            'reoccuringInterval': checkBoxElement.querySelector('select').value
        }

        if (await Controller.saveTask(taskData, event)) {

            TaskView.removeNewDataset(event);
            TaskView.removeEditability(event);
            TaskView.showSetDoneOrInProgressButtons(event);
            Controller.renderTaskChanges();
        }
    }

    static updateTask(event) {
        let taskTr = event.target.closest('tr');

        let classTd = taskTr.querySelector('td[data-class]');
        let subjectTd = taskTr.querySelector('td[data-subject]');

        let taskData = {
            'id': taskTr.dataset.taskid,
            'class': classTd.dataset.class,
            'date': taskTr.querySelector('.taskDateSelect').value,
            'subject': subjectTd.dataset.subject,
            'description': taskTr.querySelector('td[data-taskdescription]').innerText,
            'fixedTime': taskTr.nextElementSibling.querySelector('input[type="checkbox"]').checked,
            'reoccuring': taskTr.nextElementSibling.querySelector('input[name="reoccuringTask"]').checked,
            'reoccuringInterval': taskTr.nextElementSibling.querySelector('select').value
        }

        taskData.timeslot = taskTr.querySelector(`option[value="${taskData.date}"]`).dataset.timeslot;

        Controller.updateTask(taskData, event);
    }

    static makeEditable(event, upcomingLessons) {

        if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound) return;
        if (event.target.closest('tr').querySelector('td[data-taskdescription]').hasAttribute('contenteditable')) return;

        this.#backupTaskData(event);

        let parentTr = event.target.closest('tr');
        let dateSelect = this.getDateSelectHTML(parentTr, upcomingLessons);

        if (window.innerWidth > 620) {
            parentTr.nextElementSibling.style.display = 'table-row';
        } else {
            parentTr.nextElementSibling.style.display = 'block';
            parentTr.nextElementSibling.style.marginTop = '-2rem';
        }

        parentTr.querySelector('td[data-taskdescription]').setAttribute('contenteditable', '');
        parentTr.querySelector('td[data-taskdescription]').focus();

        parentTr.querySelector('.taskDateSelectWrapper').append(dateSelect);
        parentTr.querySelector('.taskDateSelectWrapper').style.display = "block";
        parentTr.querySelector('.smallDate').style.display = 'none';

        window.getSelection().removeAllRanges();
        TaskView.showSaveOrDiscardChangesButtons(event);

        parentTr.removeEventListener('dblclick', (event) => TaskView.makeEditable(event));
        parentTr.nextElementSibling.addEventListener('mouseenter', this.highlightCheckboxTrPreviousSibling);
        parentTr.nextElementSibling.addEventListener('mouseleave', this.removeHighlightCheckboxTrPreviousSibling);
    }

    static getDateSelectHTML(taskElement, upcomingLessons) {
        let taskDate = new Date(taskElement.dataset.date);
        let select = document.createElement('select');
        let optionElement = document.createElement('option');
        let optionsMaxAfterSelected = 4;
        let optionsCount = 0;
        let startCount = false;

        select.classList.add('taskDateSelect');
        select.setAttribute('name', 'taskDateSelect');

        //upcoming lessons are empty
        if (upcomingLessons.length == 0) {
            optionElement.textContent = Fn.formatDate(taskElement.dataset.date);
            optionElement.setAttribute('data-timeslot', taskElement.dataset.timeslot);
            optionElement.setAttribute('value', Fn.formatDateSqlCompatible(taskElement.dataset.date));
            optionElement.setAttribute('selected', '');
            select.append(optionElement);
        }

        upcomingLessons.forEach(lesson => {
            if (optionsCount >= optionsMaxAfterSelected) return;

            let lessonDate = Fn.formatDate(lesson.date);
            let lessonDateFullYear = lesson.date;
            let option = optionElement.cloneNode();

            option.setAttribute('value', lessonDateFullYear);
            option.setAttribute('data-timeslot', lesson.timeslot);
            option.textContent = lessonDate;
            if (taskDate.setHours(12) == lesson.date.setHours(12) && taskElement.dataset.timeslot == lesson.timeslot) {
                option.setAttribute('selected', '');
                startCount = true;
            }

            select.append(option);
            if (startCount) optionsCount++;
        });

        return select;
    }

    static getTaskDataFromTr(event) {
        let taskElement = event.target.closest('tr');

        return {
            id: taskElement.dataset.taskid,
            class: taskElement.querySelector('.taskClassName').dataset.class,
            subject: taskElement.querySelector('.taskSubjectContainer').dataset.subject,
            date: taskElement.dataset.date,
            description: taskElement.querySelector('.taskDescription').innerText
        };
    }

    static highlightCheckboxTrPreviousSibling(event) {
        event.target.closest('tr').previousElementSibling.style.backgroundColor = 'var(--lightergrey)';
    }

    static removeHighlightCheckboxTrPreviousSibling(event) {
        event.target.closest('tr').previousElementSibling.removeAttribute('style');
    }

    static removeEditability(event) {

        let taskTr = event.target.closest('tr');

        taskTr.querySelector('td[data-taskdescription]').removeAttribute('contenteditable');
        taskTr.nextElementSibling.style.display = "none";
    }

    static removeNewDataset(event) {
        //removes 'new' dataset of the given task form, after it was saved

        let buttonWrapper = event.target.closest('td');
        let fixedDateTr = buttonWrapper.closest('tr').nextElementSibling;


        buttonWrapper.closest('tr').removeAttribute('data-new');
        fixedDateTr.removeAttribute('data-new');
        fixedDateTr.style.display = 'none';
    }

    static removeTaskForm(event) {

        let taskTr = event.target.closest('tr');

        if (!taskTr.hasAttribute('data-new')) {
            Controller.revertTaskChanges(event);
            return;
        }

        let tableBody = event.target.closest('tbody');

        taskTr.nextElementSibling.remove();
        taskTr.remove();

        if (tableBody.querySelectorAll('td').length == 0) {
            tableBody.previousElementSibling.style.display = 'none';
            tableBody.nextElementSibling.querySelector('td[data-noentriesfound]').style.display = 'table-cell';
            return;
        }
    }

    static setTaskInProgress(event) {
        let buttonWrapper = event.target.closest('td');
        let taskId = buttonWrapper.closest('tr').dataset.taskid;

        Controller.setTaskInProgress(taskId, event);
        Controller.renderTaskChanges()
    }

    static setTaskDone(event) {
        let buttonWrapper = event.target.closest('td');
        let taskId = buttonWrapper.closest('tr').dataset.taskid;

        Controller.setTaskDone(taskId, event);
    }

    static removeTask(event) {
        let taskTr = event.target.closest('tr');
        taskTr.nextElementSibling.remove() //checkbox tr
        taskTr.remove();
    }

    static #backupTaskData(event) {

        let parentTr = event.target.closest('tr');
        let taskId = parentTr.dataset.taskid;

        Controller.setTaskBackupData(taskId);
    }

    static showSaveOrDiscardChangesButtons(event) {
        let buttonWrapper = event.target.closest('tr').querySelector('.taskDone');

        buttonWrapper.querySelectorAll('div').forEach(div => {
            if (div.classList.contains('editableTask')) {
                div.style.display = 'flex';
            } else {
                div.style.display = 'none';
            }
        });
    }

    static showSetDoneOrInProgressButtons(event) {
        let buttonWrapper = event.target.closest('tr').lastElementChild;

        if (event.target.closest('table').id == 'upcomingTasksTable') {
            buttonWrapper.querySelectorAll('div').forEach(div => {
                if (div.classList.contains('openTask')) {
                    div.style.display = 'flex';
                } else {
                    div.style.display = 'none';
                }
            });
        }

        if (event.target.closest('table').id == 'inProgressTasksTable') {
            buttonWrapper.querySelectorAll('div').forEach(div => {
                if (div.classList.contains('inProgressTask')) {
                    div.style.display = 'flex';
                } else {
                    div.style.display = 'none';
                }
            });
        }
    }

    static async runSetInProgressAnimation(event) {
        const taskElement = event.target.closest('tr');
        
        taskElement.classList.add('fadeOut');

        setTimeout(() => {
            taskElement.classList.remove('fadeOut');
            taskElement.classList.add('fadeIn');
        }, ANIMATIONRUNTIME);

        setTimeout(() => { taskElement.classList.remove('fadeIn') }, ANIMATIONRUNTIME * 2);

        return new Promise((resolve) => {
            setTimeout(() => { resolve() }, ANIMATIONRUNTIME);
        })
    }

    static async runRemoveTaskAnimation(event) {
        const taskElement = event.target.closest('tr');
        taskElement.classList.add('shrink');

        setTimeout(() => {
            taskElement.classList.remove('shrink');
        }, ANIMATIONRUNTIME);

        return new Promise((resolve) => {
            setTimeout(() => { resolve() }, ANIMATIONRUNTIME);
        })
    }

    //validation errors
    static alertReoccuringIntervalSelect(event) {
        let selectTr = event.target.closest('tr').nextElementSibling;;
        let alertRing = selectTr.querySelector('select').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}