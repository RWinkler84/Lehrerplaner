import Task from '../Controllers/TaskController.js';

export default class TaskView {

    renderUpcomingTasks() {
        let allUpcomingTasks = Task.getAllOpenTasks();
        let upcomingTasksTableBody = document.querySelector('#upcomingTasksTable tbody');
        let taskTrHTML = '';


        if (allUpcomingTasks.length == 0) {
            document.querySelector('td[data-noEntriesFound]').style.display = 'table-cell';
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

        document.querySelectorAll('#taskContainer td').forEach((td) => {
            td.addEventListener('dblclick', (event) => TaskView.makeEditable(event));
        });

        document.querySelectorAll('#taskContainer td').forEach((td) => {
            td.addEventListener('dblclick', createSaveAndDiscardChangesButton);
        });

        bindTasksToLessons();
    }

    renderInProgressTasks() {

    }

    static makeEditable(event) {

        if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound) return;

        TaskView.backUpTaskData(event);

        let parentTr = event.target.closest('tr');

        parentTr.querySelectorAll('td:not(.taskDone)').forEach((td) => {

            if (td.dataset.subject) {
                td.innerHTML = getSubjectSelectHTML(event);
                td.style.padding = '0';
                // td.addEventListener('focusout', removeEditability);
                createSaveAndDiscardChangesButton(event);
            }

            td.setAttribute('contenteditable', '');

            event.target.focus();
            // td.addEventListener('focusout', removeEditability);
        });

        window.getSelection().removeAllRanges();
        createSaveAndDiscardChangesButton(event);
    }

    removeEditability(item) {

        item.target ? item = item.target : item;

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

    static revertChanges(item) {
        let parentTr = item.closest('tr');
        let taskId = parentTr.dataset.taskid;

        parentTr.querySelector('td[data-class]').innerText = taskDataBackupObject[taskId].class;
        parentTr.querySelector('td[data-subject]').innerText = taskDataBackupObject[taskId].subject;
        parentTr.querySelector('td[data-taskDescription]').innerText = taskDataBackupObject[taskId].description;
        removeEditability(item);
        removeDiscardButton(item);
    }

    static setTaskDone(item) {
        console.log('task erledigt');
        console.log(item);
    }

    static backUpTaskData(event) {

        let parentTr = event.target.closest('tr');
        let taskId = parentTr.dataset.taskid;

        Task.backupTaskData(taskId);
    }
}