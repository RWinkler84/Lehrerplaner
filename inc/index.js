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
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date);
        let newDate = currentDate - 86400000 * 7 // 7 days

        weekday.dataset.date = new Date(newDate).toDateString();
    });

    resetWeekStartAndEndDate();
    resetCalenderWeek()
}

function switchToNextWeek() { }

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

function resetCalenderWeek(){
    let referenceDate = new Date('1.1.2025')
    let calenderWeekCounter = document.querySelector('#callenderWeekCounter');

    console.log(referenceDate);
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