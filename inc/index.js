// handlers for lesson fields and weekOverview
document.querySelectorAll('.lesson').forEach((element) => {
    element.addEventListener('mouseover', highlightTask);
});

document.querySelectorAll('.lesson').forEach((element) => {
    element.addEventListener('mouseout', removeTaskHighlight);
});

// handlers for empty timeslots

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('mouseenter', showAddTaskButton);
});

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('click', createTaskForm);
});

// handlers for switching between weeks

document.querySelector('#weekBackwardButton').addEventListener('click', switchToPreviousWeek);
document.querySelector('#weekForwardButton').addEventListener('click', switchToNextWeek);

// handlers for task tables

document.querySelectorAll('#taskContainer td').forEach((td) => {
    td.addEventListener('dblclick', makeEditable);
})

// on ready

document.addEventListener('DOMContentLoaded', setDateForWeekdays);
document.addEventListener('DOMContentLoaded', setCalendarWeek);




//HIGHLIGHTING AND TOGGLING STUFF

function highlightTask(event) {

    let item = event.target;

    document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
        if (taskRow.dataset.taskid === item.dataset.taskid) {
            taskRow.style.backgroundColor = "var(--lightergrey)";
        }
    });

    removeAddTaskButton();
}

function removeTaskHighlight(event) {
    item = event.target;

    document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
        if (taskRow.dataset.taskid === item.dataset.taskid) {
            taskRow.style.backgroundColor = "var(--contentContainerBackground)";
        }
    });
}

function showAddTaskButton(event) {


    if (hasLesson(event.target)) {
        return;
    }

    removeAddTaskButton();

    event.target.innerHTML = '<div class="addTaskButtonWrapper"><div class="addTaskButton">+</div></div>';

}

function removeAddTaskButton() {

    document.querySelectorAll('.timeslot').forEach((timeslot) => {
        if (timeslot.querySelector('.addTaskButtonWrapper')) {
            timeslot.querySelector('.addTaskButtonWrapper').remove();
        }
    });
}

function createTaskForm() {
    let taskTable = document.querySelector('#upcomingTasksTable tbody');

    let trContent = `
        <td contenteditable data-class></td>
        <td contenteditable data-subject></td>
        <td class="taskDescription" data-taskDescription contenteditable></td>
        <td class="taskDone">&#x2714;</td>
        `;
    
    let newTableRow = document.createElement('tr');

    taskTable.append(newTableRow);

    let lastChild = taskTable.lastElementChild;

    lastChild.dataset.taskid = '';
    lastChild.innerHTML = trContent;

    lastChild.firstElementChild.focus();

}

function makeEditable(){
    console.log(event.target);
    if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound){
        return;
    }

    event.target.setAttribute('contenteditable', '');
    event.target.focus();
    window.getSelection().removeAllRanges();
    event.target.addEventListener('focusout', () => event.target.removeAttribute('contenteditable'));
}


// FIDDLING WITH DATE

function setCalendarWeek() {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = 1;
    let currentYear = new Date().getFullYear();
    let referenceDate = new Date().getTime();
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
    let today = new Date;

    document.querySelectorAll('.weekday').forEach((weekday) => {
        let dateDifference = weekday.dataset.weekday_number - today.getDay();
        let weekdayDateUnix = todayUnix + (dateDifference * 86400000);    // 86400000 = ms/day
        let weekdayDateString = new Date(weekdayDateUnix).toString();

        weekday.dataset.date = weekdayDateString;

    })
}

function switchToPreviousWeek() {

    // iterates over all weekday columns and adjusts date of weekdays
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date).getTime();
        let newDate = currentDate - 86400000 * 7; // -7 days

        weekday.dataset.date = new Date(newDate).toString();
    });

    resetWeekStartAndEndDate();
    calcCalendarWeek(false)
}

function switchToNextWeek() {

    // iterates over all weekday columns and adjusts date of weekdays
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date).getTime();
        let newDate = currentDate + 86400000 * 7; // +7 days

        weekday.dataset.date = new Date(newDate).toString();
    });

    resetWeekStartAndEndDate();
    calcCalendarWeek(true)
}

function resetWeekStartAndEndDate() {
    let startDateSpan = document.querySelector('#weekStartDate');
    let endDateSpan = document.querySelector('#weekEndDate');
    let mondayDate = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
    let sundayDate = document.querySelector('.weekday[data-weekday_number="7"]').dataset.date;

    mondayDate = new Date(mondayDate);
    sundayDate = new Date(sundayDate);

    startDateSpan.innerText = formatDate(mondayDate);
    endDateSpan.innerText = formatDate(sundayDate);
}

function calcCalendarWeek(countUp = true) {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = document.querySelector('#calendarWeekCounter').innerText;

    let mondayDate = new Date(document.querySelector('.weekday[data-weekday_number="1"]').dataset.date);
    let sundayDate = new Date(document.querySelector('.weekday[data-weekday_number="7"]').dataset.date);

    let weeksPerYear = getNumberOfWeeksPerYear(mondayDate.getFullYear());

    countUp ? weekCounter++ : weekCounter--;

    if (weekCounter < 1) weekCounter = weeksPerYear;
    if (weekCounter > weeksPerYear) weekCounter = 1;

    calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
}

// HELPER FUNCTIONS

function hasLesson(element) {
    let bool = false;

    if (element.classList.contains('lesson')) {
        return true;
    }

    element.querySelectorAll('*').forEach(child => {
        if (child.classList.contains('lesson')) {
            bool = true;
        }
    });

    return bool;
}

function formatDate(date) {
    let formatter = new Intl.DateTimeFormat('de-DE', {
        month: '2-digit',
        day: '2-digit'
    });

    return formatter.format(date);
}

function getNumberOfWeeksPerYear(year) {
    let nextNewYear = new Date('1.1.' + (year + 1)).getTime();
    let firstThursday = getFirstThirsdayOfTheYear(year);

    let weeksPerYear = 0;

    //count up until it is the next year starting with 0 because the first 
    while (firstThursday < nextNewYear) {
        firstThursday = firstThursday + 86400000 * 7;

        weeksPerYear++;
    }

    return weeksPerYear;
}

//find the first thursday of the year, which marks the first calendar week
function getFirstThirsdayOfTheYear(year) {
    let firstDay = new Date('1.1.' + year);

    if (firstDay.getDay() != 4) {
        while (firstDay.getDay() != 4) {
            firstDay = firstDay.getTime() + 86400000;
            firstDay = new Date(firstDay);
        }
    }

    return firstDay.getTime();
}