// handlers for lesson fields
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

}



// FIDDLING WITH DATE

function setCalendarWeek() {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = 1;

    let mondayDate = new Date('12.27.2021').getTime();
    let referenceDate = new Date().getTime();
    let sundayDate = new Date('1.2.2022').getTime();

    while (!(referenceDate >= mondayDate && referenceDate <= sundayDate)) {
        mondayDate += 86400000 * 7; // + 7 days
        sundayDate += 86400000 * 7; // + 7 days
        weekCounter++;
        weekCounter = isChangeOfYear(mondayDate, sundayDate, true) ? 1 : weekCounter;
    }

    //check whether the year changes and reset weekcounter, if so
    calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
}

function setDateForWeekdays() {
    let todayUnix = Date.now();
    let today = new Date;

    document.querySelectorAll('.weekday').forEach((weekday) => {
        let dateDifference = weekday.dataset.weekday_number - today.getDay();
        let weekdayDateUnix = todayUnix + (dateDifference * 86400000);    // 86400000 = ms/day
        let weekdayDateString = new Date(weekdayDateUnix).toDateString();

        weekday.dataset.date = weekdayDateString;

    })
}

function switchToPreviousWeek() {

    // iterates over all weekday columns and adjusts date of weekdays
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date).getTime();
        let newDate = currentDate - 86400000 * 7; // -7 days

        weekday.dataset.date = new Date(newDate).toDateString();
    });

    resetWeekStartAndEndDate();
    calcCalendarWeek(false)
}

function switchToNextWeek() {

    // iterates over all weekday columns and adjusts date of weekdays
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date).getTime();
        let newDate = currentDate + 86400000 * 7; // +7 days

        console.log(newDate);
        weekday.dataset.date = new Date(newDate).toDateString();
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


    let mondayDate = new Date(document.querySelector('.weekday[data-weekday_number="1"]').dataset.date).getTime();
    let sundayDate = new Date(document.querySelector('.weekday[data-weekday_number="7"]').dataset.date).getTime();

    countUp ? weekCounter++ : weekCounter--;

    //check whether the year changes and reset weekcounter, if so
    if (calendarWeekCounterDiv.dataset.split_first_week == 'true') {
        if (countUp) {
            // weekCounter = 1;
            calendarWeekCounterDiv.dataset.split_first_week = 'false'
        } else {
            weekCounter = 52;
            calendarWeekCounterDiv.dataset.split_first_week = 'false'
        }
    }

    if (isChangeOfYear(mondayDate, sundayDate) && countUp) {
        weekCounter = 1;
    }

    if (isChangeOfYear(mondayDate, sundayDate) && !countUp) {
        if (calendarWeekCounterDiv.dataset.split_first_week == 'false')
            weekCounter = 52;
    }

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

// this function doesnt only check for the change of year, but also, if the thursday of that given week is
// in the new year. If so, it returns true and resets the weekCounter

function isChangeOfYear(monday, sunday, startedOnLoad = false) {
    let thursday = new Date(document.querySelector('.weekday[data-weekday_number="4"]').dataset.date);
    monday = new Date(monday);
    sunday = new Date(sunday);

    // after loading setCalendarWeek counts up from a reference date how many weeks have passed
    // if the year changes the counter is reset to one, if the week contains the first thursday of the year
    // if startedOnLoad is set, this part of the script searches for the thursday of each week

    if (startedOnLoad) {
        thursday = monday;

        while (thursday.getDay() != 4) {
            thursday = thursday.getTime() + 86400000; // + one day
            thursday = new Date(thursday);
        }
    }

    // is monday the first day in the year?
    if (formatDate(monday) == formatDate(new Date('1.1.1970'))) {
        return true;
    }

    // is thursday of given week a day of the new year?
    if (monday.getFullYear() != sunday.getFullYear()) {
        if (thursday.getFullYear() == sunday.getFullYear())

            startedOnLoad ? '' : document.querySelector('#calendarWeekCounter').dataset.split_first_week = 'true';

        return true;
    }
}