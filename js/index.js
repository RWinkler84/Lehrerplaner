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

export let allTasksArray = [
    {
        'id': 1,
        'date': '2025-03-11',
        'timeslot': '2',
        'class': '6A',
        'subject': 'Gesch',
        'description': 'die Schafe hüten',
        'status': 'inProgress',
        'fixedTime': true
    },
    {
        'id': 2,
        'date': '2025-02-10',
        'timeslot': '3',
        'class': '7B',
        'subject': 'Deu',
        'description': 'den Klassenraum streichen',
        'status': 'inProgress',
        'fixedTime': false
    },
    {
        'id': 3,
        'date': '2025-03-18',
        'timeslot': '2',
        'class': '6A',
        'subject': 'Gesch',
        'description': 'Wette verloren! Kopfstand auf dem Lehrertisch',
        'status': 'open',
        'fixedTime': true
    },
    {
        'id': 4,
        'date': '2025-03-06',
        'timeslot': '5',
        'class': '7A',
        'subject': 'Gesch',
        'description': 'Napoleon war ein kleiner Mann und hatte rote Röcke an',
        'status': 'open',
        'fixedTime': false
    },
    {
        'id': 5,
        'date': '2025-03-10',
        'timeslot': '2',
        'class': '7A',
        'subject': 'Gesch',
        'description': 'Napoleon war ein kleiner Mann und hatte rote Röcke an',
        'status': 'open',
        'fixedTime': false
    },
    {
        'id': 6,
        'date': '2025-03-13',
        'timeslot': '5',
        'class': '7A',
        'subject': 'Gesch',
        'description': 'Napoleon war ein kleiner Mann und hatte rote Röcke an',
        'status': 'open',
        'fixedTime': true
    }
];

export let standardTimetable = [
    {
        'class': '7B',
        'subject': 'Deu',
        'weekdayNumber': 1,
        'timeslot': 3
    },
    {
        'class': '6A',
        'subject': 'Gesch',
        'weekdayNumber': 2,
        'timeslot': 2
    },
    {
        'class': '7B',
        'subject': 'Deu',
        'weekdayNumber': 4,
        'timeslot': 3
    }, {
        'class': '7A',
        'subject': 'Gesch',
        'weekdayNumber': 4,
        'timeslot': 5
    }
];

export let timetableChanges = [
    {
        'date': '2025-03-06',
        'timeslot': '5',
        'class': '7A',
        'subject': 'Gesch',
        'status': 'canceled',
    },
    {
        'date': '2025-03-7',
        'timeslot': '5',
        'class': '5B',
        'subject': 'MNT',
        'status': 'sub',
    },
    {
        'date': '2025-03-11',
        'timeslot': '5',
        'class': '5B',
        'subject': 'MNT',
        'status': 'sub',
    }
];

export let taskBackupArray = [];

import AbstractView from './Views/AbstractView.js';
import TaskView from './Views/TaskView.js';
import LessonView from './Views/LessonView.js';
import Fn from './inc/utils.js';


// handlers for highlighting tasks and lessonfields

// document.querySelectorAll('tr[data-taskid]').forEach((element) => {
//     element.addEventListener('mouseover', hightlightLesson);
// });

// document.querySelectorAll('tr[data-taskid]').forEach((element) => {
//     element.addEventListener('mouseout', removeLessonHighlight);
// });


// handlers for empty timeslots

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('mouseenter', AbstractView.showAddLessonButton);
});

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('click', LessonView.createLessonForm);
});


// handlers for switching between weeks

document.querySelector('#weekBackwardButton').addEventListener('click', switchToPreviousWeek);
document.querySelector('#weekForwardButton').addEventListener('click', switchToNextWeek);

// on ready

document.addEventListener('DOMContentLoaded', setDateForWeekdays);
document.addEventListener('DOMContentLoaded', setCalendarWeek);
document.addEventListener('DOMContentLoaded', setWeekStartAndEndDate)
document.addEventListener('DOMContentLoaded', LessonView.renderLesson);

document.addEventListener('DOMContentLoaded', TaskView.renderUpcomingTasks);
document.addEventListener('DOMContentLoaded', TaskView.renderInProgressTasks);



//HIGHLIGHTING AND TOGGLING STUFF

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




// FIDDLING WITH DATE

function setCalendarWeek() {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = 1;
    let currentYear = new Date().getFullYear();
    let referenceDate = new Date().setHours(0, 0, 0, 0);
    let firstThursday = Fn.getFirstThirsdayOfTheYear(currentYear);
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

    startDateSpan.innerText = Fn.formatDate(mondayDate);
    endDateSpan.innerText = Fn.formatDate(sundayDate);
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
}

function calcCalendarWeek(countUp = true) {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = document.querySelector('#calendarWeekCounter').innerText;

    let mondayDate = new Date(document.querySelector('.weekday[data-weekday_number="1"]').dataset.date);

    let weeksPerYear = Fn.getNumberOfWeeksPerYear(mondayDate.getFullYear());

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

    LessonView.removeAllLessons(blankWeekTable);

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
        LessonView.removeAllLessons(weekOverview);
        LessonView.renderLesson();

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