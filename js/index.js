export const allSubjects = [
    {
        'id': '1',
        'subject': 'Gesch',
        'colorCssClass': 'subjectColorOne'
    },
    {
        'id': '2',
        'subject': 'Deu',
        'colorCssClass': 'subjectColorTwo'
    },
    {
        'id': '3',
        'subject': 'MNT',
        'colorCssClass': 'subjectColorThree'
    }
];


let taskDataBackupObject = {};

import Task from './Views/TaskView.js';
import Lesson from './Views/LessonView.js';
import Fn from './inc/utils.js';

let lesson = new Lesson;
let task = new Task;


// handlers for highlighting tasks and lessonfields

document.querySelectorAll('tr[data-taskid]').forEach((element) => {
    element.addEventListener('mouseover', hightlightLesson);
});

document.querySelectorAll('tr[data-taskid]').forEach((element) => {
    element.addEventListener('mouseout', removeLessonHighlight);
});


// handlers for empty timeslots

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('mouseenter', showAddLessonButton);
});

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('click', createLessonForm);
});


// handlers for switching between weeks

document.querySelector('#weekBackwardButton').addEventListener('click', switchToPreviousWeek);
document.querySelector('#weekForwardButton').addEventListener('click', switchToNextWeek);

// handlers for task tables




// on ready

document.addEventListener('DOMContentLoaded', setDateForWeekdays);
document.addEventListener('DOMContentLoaded', setCalendarWeek);
document.addEventListener('DOMContentLoaded', setWeekStartAndEndDate)
// document.addEventListener('DOMContentLoaded', fillTimetableWithLessons);
document.addEventListener('DOMContentLoaded',() => lesson.renderLesson());

document.addEventListener('DOMContentLoaded', fillUpcomingTasksTable);

//DATABASE FOR STRUCTURE TESTING






//HIGHLIGHTING AND TOGGLING STUFF

function highlightTask(event) {

    let item = event.target;

    document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
        if (taskRow.dataset.taskid === item.dataset.taskid) {
            taskRow.style.backgroundColor = 'var(--lightergrey)';
        }
    });

    removeAddLessonButton();
}

function removeTaskHighlight(event) {
    let item = event.target;

    document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
        if (taskRow.dataset.taskid === item.dataset.taskid) {
            taskRow.removeAttribute('style');
        }
    });
}

function hightlightLesson(event) {
    let taskId = event.target.closest('tr').dataset.taskid;

    document.querySelectorAll('.lesson').forEach((lesson) => {

        if (lesson.dataset.taskid == taskId) {
            lesson.style.fontWeight = 'bold';
            lesson.style.translate = '-1px -1px';
        }
    })
}

function removeLessonHighlight(event) {
    let taskId = event.target.closest('tr').dataset.taskid;

    document.querySelectorAll('.lesson').forEach((lesson) => {

        if (lesson.dataset.taskid == taskId) lesson.removeAttribute('style');
    })
}

function makeEditable(event) {
    console.log('go')
    if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound) return;

    backUpTaskData(event);

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

function removeEditability(item) {

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

//FILLING THE LESSON AND TASK TABLES

function renderLessons() {

    timeTableHTML = Lesson.getTimeTable();

    document.querySelectorAll('.lesson').forEach((lesson) => {
        lesson.addEventListener('mouseover', highlightTask);
        lesson.addEventListener('mouseout', removeTaskHighlight);
        lesson.parentElement.removeEventListener('mouseenter', showAddLessonButton);
        lesson.parentElement.removeEventListener('click', createTaskForm);
    });
    //synchronize lessons with tasks

}

function fillUpcomingTasksTable() {
    let allUpcomingTasks = Task.getAllOpenTasks();
    let upcomingTasksTableBody = document.querySelector('#upcomingTasksTable tbody');
    let taskTrHTML = '';


    if (allUpcomingTasks.length == 0) {
        document.querySelector('td[data-noEntriesFound]').style.display = 'table-cell';
        return;
    }

    allUpcomingTasks.sort(sortByDate);

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
                <td class="taskDone"><button class="setTaskDoneButton" onclick="setTaskDone(this)">&#x2714;</button></td>
            </tr>
        `;
    });

    upcomingTasksTableBody.innerHTML = taskTrHTML;

    document.querySelectorAll('#taskContainer td').forEach((td) => {
        td.addEventListener('dblclick', makeEditable);
    });

    document.querySelectorAll('#taskContainer td').forEach((td) => {
        td.addEventListener('dblclick', createSaveAndDiscardChangesButton);
    });

    bindTasksToLessons();
}


function fillInProgressTaskTable() {

}

function bindTasksToLessons() {

    let allTasks = Task.getAllTasks();
    let mondayOfDisplayedWeek = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
    let sundayOfDisplayedWeek = document.querySelector('.weekday[data-weekday_number="0"]').dataset.date;

    console.log(allTasks);
    allTasks.sort(sortByDate);


    //if displayed week is the current week, bind everything older and belonging to the current week
    if (isDateInCurrentWeek(mondayOfDisplayedWeek)) {

        filterTasksByDate(allTasks, sundayOfDisplayedWeek, undefined, true);

    }


    //     //wenn vergangene Woche, alles binden, was älter oder in der Woche
    //     //wenn kommende Woche, alles binden, was in dieser Woche liegt
}

// HANDLING LESSONS

function createLessonForm(event) {

    console.log(event.target);

    let addLessonButton = event.target.classList.contains('addLessonButton') ? event.target.parentElement : event.target;
    let timeslotElement = event.target.closest('tr');

    let lesson = new Lesson(undefined, undefined);

    lesson.date = addLessonButton.dataset.date;
    lesson.timeslot = addLessonButton.dataset.timeslot


}

function addLessonToTimetable(lesson) {

    if (!isDateInCurrentlyDisplayedWeek(lesson.date)) return;

    let timetableTimeslot;
    let lessonHTML = `
        <div class="lesson ${lesson.cssColorClass}">${lesson.class} ${lesson.subject}</div>
    `;

    timetableTimeslot = getTimeslotOfLesson(lesson);


    timetableTimeslot.innerHTML = lessonHTML;

    timetableTimeslot.removeEventListener('click', createTaskForm);
    timetableTimeslot.firstElementChild.addEventListener('mouseover', highlightTask);
    timetableTimeslot.firstElementChild.addEventListener('mouseout', removeTaskHighlight);
}


// HANDLING TASKS

function createTaskForm(item) {

    let dataSource = item.target;

    if (item.target.classList.contains('addLessonButton')) dataSource = item.target.parentElement;

    dataSource.parentElement.removeEventListener('click', createTaskForm); //prevent creation of another task form

    let taskTable = document.querySelector('#upcomingTasksTable tbody');
    let subjectSelect = getSubjectSelectHTML();

    let trContent = `
        <td contenteditable data-class></td>
        <td data-subject="" style="padding: 0">${subjectSelect}</td>
        <td class="taskDescription" data-taskDescription contenteditable></td>
        <td class="taskDone"><button class="saveNewTaskButton" onclick="saveNewTask(this)">&#x2714;</button><button class="discardNewTaskButton" onclick="discardNewTask(this)">&#x2718;</button></td>
        `;

    let newTableRow = document.createElement('tr');

    taskTable.append(newTableRow);

    let tr = taskTable.lastElementChild;

    tr.dataset.taskid = '';
    tr.dataset.date = dataSource.dataset.date;
    tr.dataset.timeslot = dataSource.dataset.timeslot;
    tr.innerHTML = trContent;

    tr.firstElementChild.focus();
}

function getSubjectSelectHTML(event = undefined) {
    //make an fetch-query to get all subject the teacher is teaching and create an select with those as options
    //for now it is static and stored in the global const allSubjects
    let previouslySelected;
    let optionsHTML;
    let selected = '';

    //was something pre-selected or is it for a new Task form?
    //if something was preselected, set the corresponding option to selected
    if (event) previouslySelected = event.target.closest('tr').querySelector('td[data-subject]').dataset.subject;

    previouslySelected == '-'
        ? optionsHTML = '<option value="-" selected>-</option>'
        : optionsHTML = '<option value="-">-</option>';


    allSubjects.forEach((entry) => {
        entry.subject == previouslySelected ? selected = 'selected' : selected = '';

        optionsHTML += `<option value="${entry.subject}" ${selected}>${entry.subject}</option>`;
    });

    return `<select class="lessonSelect">${optionsHTML}</select>`;
}

function saveNewTask(item) {

    let form = item.closest('tr');
    let classTd = form.querySelector('td[data-class]');
    let subjectTd = form.querySelector('td[data-subject]');

    let formData = new FormData();
    let taskData = {
        'id': generateTaskId(),
        'class': form.querySelector('td[data-class]').innerText,
        'subject': form.querySelector('td[data-subject] select').value,
        'date': form.dataset.date,
        'timeslot': form.dataset.timeslot,
        'description': form.querySelector('td[data-taskDescription]').innerText
    }

    Object.entries(taskData).forEach((key, value) => { formData.append(key, value) });

    //send this stuff to the backend via fetch-API
    //.then => remove discard-button and reasign create-Button to use it as a setDone-Button and add taskid to the saved tr

    //apply changes to datasets
    form.dataset.taskid = taskData.id;
    classTd.dataset.class = form.querySelector('td[data-class]').innerText;
    subjectTd.dataset.subject = subjectTd.querySelector('select').value;

    addLessonToTimetable(taskData);
    removeEditability(item);
    removeDiscardButton(item);
    saveTaskToSetDoneButton(item);

    form.querySelectorAll('td').forEach((td) => { td.addEventListener('dblclick', makeEditable) });
    form.addEventListener('mouseover', hightlightLesson);
    form.addEventListener('mouseout', removeLessonHighlight);
}

function updateTask(item) {
    let form = item.closest('tr');
    let formData = new FormData();
    let taskData = {};

    let classTd = form.querySelector('td[data-class]');
    let subjectTd = form.querySelector('td[data-subject]');

    //apply changes to datasets
    classTd.dataset.class = form.querySelector('td[data-class]').innerText;
    if (subjectTd.querySelector('td[data-subject] select')) {
        subjectTd.dataset.subject = subjectTd.querySelector('select').value;
    } else {
        subjectTd.dataset.subject = subjectTd.innerText;
    }


    taskData = {
        'id': form.dataset.taskid,
        'class': form.querySelector('td[data-class]').innerText,
        'subject': form.querySelector('td[data-subject] select') // select or not?
            ? form.querySelector('td[data-subject] select').value
            : form.querySelector('td[data-subject]').innerText,
        'date': form.dataset.date,
        'timeslot': form.dataset.timeslot,
        'description': form.querySelector('td[data-taskDescription]').innerText
    }


    Object.entries(taskData).forEach((key, value) => { formData.append(key, value) });


    //send this stuff to the backend via fetch-API
    //then =>
    removeEditability(item);
    removeDiscardButton(item);
    saveTaskToSetDoneButton(item);
    updateLessonOnTimetable(taskData);
}

function discardNewTask(item) {
    let data = {
        'date': item.closest('tr').dataset.date,
        'timeslot': item.closest('tr').dataset.timeslot
    }
    let timeslot = getTimeslotOfLesson(data);

    timeslot.addEventListener('click', createTaskForm);
    item.closest('tr').remove();
}

function revertChanges(item) {
    let parentTr = item.closest('tr');
    let taskId = parentTr.dataset.taskid;

    parentTr.querySelector('td[data-class]').innerText = taskDataBackupObject[taskId].class;
    parentTr.querySelector('td[data-subject]').innerText = taskDataBackupObject[taskId].subject;
    parentTr.querySelector('td[data-taskDescription]').innerText = taskDataBackupObject[taskId].description;
    removeEditability(item);
    removeDiscardButton(item);
}

function setTaskDone(item) {
    console.log('task erledigt');
    console.log(item);
}


// BUTTONS!!!

function showAddLessonButton(event) {

    let timeslot = event.target.dataset.timeslot;
    let date = event.target.parentElement.dataset.date;

    removeAddLessonButton();

    if (hasLesson(event.target)) return;

    event.target.innerHTML = `<div class="addLessonButtonWrapper" data-timeslot="${timeslot}" data-date="${date}"><div class="addLessonButton">+</div></div>`;

}

function removeAddLessonButton() {

    document.querySelectorAll('.timeslot').forEach((timeslot) => {
        if (timeslot.querySelector('.addLessonButtonWrapper')) {
            timeslot.querySelector('.addLessonButtonWrapper').remove();
        }
    });
}

function createSaveAndDiscardChangesButton(event) {

    let parentTr = event.target.closest('tr');
    let buttonTd = parentTr.querySelector('.taskDone');

    if (buttonTd.querySelector('.setTaskDoneButton')) buttonTd.querySelector('.setTaskDoneButton').remove();

    buttonTd.innerHTML = '<button class="updateTaskButton" onclick="updateTask(this)">&#x2714;</button><button class="discardUpdateTaskButton" onclick="revertChanges(this)">&#x2718;</button>';

}

function removeDiscardButton(item) {
    item = item.target ? item.target : item;

    item.classList.contains('discardUpdateTaskButton') ? item.remove() : item.nextSibling.remove()

}

function saveTaskToSetDoneButton(item) {
    item = item.target ? item.target : item;
    let buttonTd = item.parentElement;

    item.remove();
    buttonTd.innerHTML = '<button class="setTaskDoneButton" onclick="setTaskDone(this)">&#x2714;</button>';
}

// FIDDLING WITH DATE

function setCalendarWeek() {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = 1;
    let currentYear = new Date().getFullYear();
    let referenceDate = new Date().setHours(0, 0, 0, 0);
    let firstThursday = getFirstThirsdayOfTheYear(currentYear);
    let monday = firstThursday - 86400000 * 3
    let sunday = firstThursday + 86400000 * 3;

    //checks, if the reference date lies in the current week. if not, tests against the next week
    while (monday < referenceDate && sunday < referenceDate) {
        monday += 86400000 * 7; // + 7 days
        sunday += 86400000 * 7; // + 7 days
        weekCounter++;
    }

    //check whether the year changes and reset weekcounter, if so
    calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
}

function setDateForWeekdays() {
    let todayUnix = new Date().setHours(0, 0, 0);

    //go back to monday of given week
    while (new Date(todayUnix).getDay() != 1) todayUnix -= 86400000;

    document.querySelectorAll('.weekday').forEach((weekday) => {

        weekday.dataset.date = new Date(todayUnix).toString();

        todayUnix += 86400000;    // 86400000 = ms/day
    })
}

function setWeekStartAndEndDate() {
    let startDateSpan = document.querySelector('#weekStartDate');
    let endDateSpan = document.querySelector('#weekEndDate');
    let mondayDate = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
    let sundayDate = document.querySelector('.weekday[data-weekday_number="0"]').dataset.date;

    mondayDate = new Date(mondayDate);
    sundayDate = new Date(sundayDate);

    startDateSpan.innerText = formatDate(mondayDate);
    endDateSpan.innerText = formatDate(sundayDate);
}

function switchToPreviousWeek() {

    cancelWeekSwitchAnimation(); //necessary to prevent animation from bugging out, if week is switched multipe times fast
    runWeekSwitchAnimation(false);

    // iterates over all weekday columns and adjusts date of weekdays
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date).getTime();
        let newDate = currentDate - 86400000 * 7; // -7 days

        weekday.dataset.date = new Date(newDate).toString();
    });

    setWeekStartAndEndDate();
    calcCalendarWeek(false);
    bindTasksToLessons();
}

function switchToNextWeek() {

    cancelWeekSwitchAnimation(); //necessary to prevent animation from bugging out, if week is switched multipe times fast
    runWeekSwitchAnimation(true);

    // iterates over all weekday columns and adjusts date of weekdays
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date).getTime();
        let newDate = currentDate + 86400000 * 7; // +7 days

        weekday.dataset.date = new Date(newDate).toString();
    });

    setWeekStartAndEndDate();
    calcCalendarWeek(true);
    bindTasksToLessons();
}

function calcCalendarWeek(countUp = true) {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = document.querySelector('#calendarWeekCounter').innerText;

    let mondayDate = new Date(document.querySelector('.weekday[data-weekday_number="1"]').dataset.date);

    let weeksPerYear = getNumberOfWeeksPerYear(mondayDate.getFullYear());

    countUp ? weekCounter++ : weekCounter--;

    if (weekCounter < 1) weekCounter = weeksPerYear;
    if (weekCounter > weeksPerYear) weekCounter = 1;

    calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
}

// ANIMATION FUNCTIONS

function runWeekSwitchAnimation(nextWeek = true) {
    let timetableContainer = document.querySelector('#timetableContainer');
    let timetableContainerInitialHeight = timetableContainer.getBoundingClientRect().height;
    let weekOverview = document.querySelector('#weekOverview');
    let weekOverviewPosition = weekOverview.getBoundingClientRect();
    let blankWeekTable = weekOverview.cloneNode(true);
    let verticalOffset;

    //should blankWeekTable come in from left or right?
    if (nextWeek == true) verticalOffset = window.innerWidth;
    if (nextWeek == false) verticalOffset = window.innerWidth * -1;

    removeAllLessons(blankWeekTable);

    //setup for the animation
    weekOverview.style.left = '0px';
    blankWeekTable.style.position = 'relative';
    blankWeekTable.classList.add('blankWeekTable');
    blankWeekTable.style.top = -1 * weekOverviewPosition.height + 'px';
    blankWeekTable.style.left = verticalOffset + 'px';
    blankWeekTable.style.width = weekOverviewPosition.width + 'px';
    blankWeekTable.style.height = weekOverviewPosition.height + 'px';

    timetableContainer.append(blankWeekTable);

    timetableContainer.style.height = timetableContainerInitialHeight + 'px';

    setTimeout(() => {
        blankWeekTable.style.left = '0px';
        weekOverview.style.left = verticalOffset * -1 + 'px';
    }, 10);
    setTimeout(() => {
        blankWeekTable.remove()
        weekOverview.style.left = 'auto';
        removeAllLessons(weekOverview);
        fillTimetableWithLessons();

        weekOverview.querySelectorAll('.lesson').forEach((lesson) => {
            lesson.style.opacity = '0';
            lesson.style.transition = 'all 0.2s ease-out';
        });
    }, 350);

    setTimeout(() => {
        weekOverview.querySelectorAll('.lesson').forEach((lesson) => {
            lesson.style.opacity = '1';
        });
    }, 360);

    setTimeout(() => {
        weekOverview.querySelectorAll('.lesson').forEach((lesson) => {
            lesson.removeAttribute('style');
        });
    }, 560);
}

function cancelWeekSwitchAnimation() {
    if (document.querySelector('.blankWeekTable')) {
        document.querySelector('.blankWeekTable').remove();
        document.querySelector('#weekOverview').style.left = 'auto';
    }
}


// HELPER FUNCTIONS



// filters an TaskArray by date, can return any task before and after a given date (including tasks on given date!)
// or returns all tasks between dates if startDate and endDate are specified
function filterTasksByDate(tasksArray, startDate, endDate = undefined, beforeStartDate = false) {

    let filteredTasks = [];
    let start = new Date(startDate);
    let end = endDate ? new Date(endDate) : undefined;

    if (startDate && endDate) {
        tasksArray.forEach((task) => {
            if (start <= new Date(task.date) && new Date(task.date) <= end) {
                filteredTasks.push(task);

                return filteredTasks;
            }
        });
    }

    if (startDate && beforeStartDate == true) {
        tasksArray.forEach((task) => {
            if (start >= new Date(task.date) && new Date(task.date) <= end) {
                filteredTasks.push(task);

                return filteredTasks;
            }
        });
    }



}