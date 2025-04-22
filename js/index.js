import AbstractView from './View/AbstractView.js';
import TaskView from './View/TaskView.js';
import LessonView from './View/LessonView.js';
import SettingsView from './View/SettingsView.js';
import Fn from './inc/utils.js';
import AbstractController from './Controller/AbstractController.js';

let abstCtrl = new AbstractController();

export let allSubjects = [];

export let allTasksArray = [];

export let standardTimetable = [];

export let timetableChanges = [];

export let taskBackupArray = [];


async function loadData() {
    let subjects = await abstCtrl.getSubjects();
    let timetable = await abstCtrl.getTimetable();
    let changes = await abstCtrl.getTimetableChanges();
    let tasks = await abstCtrl.getAllTasks();

    subjects.forEach(entry => {
        allSubjects.push(entry)
    });

    timetable.forEach(entry => {
        standardTimetable.push(entry);
    });

    changes.forEach(entry => {
        timetableChanges.push(entry);
    });

    tasks.forEach(entry => {
        allTasksArray.push(entry);
    })
}

async function startApp() {
    await loadData();

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

    //handler for weekday label
    document.querySelectorAll('.weekdayLabel').forEach(label => {
        label.addEventListener('mouseenter', AbstractView.removeAddLessonButton);
    })

    //handlers for settings
    document.querySelector('#createSubjectButton').addEventListener('click', SettingsView.saveSubject);


    setDateForWeekdays();
    setCalendarWeek();
    setWeekStartAndEndDate();
    LessonView.renderLesson();

    TaskView.renderUpcomingTasks();
    TaskView.renderInProgressTasks();

    SettingsView.renderSelectableLessonColors();
    SettingsView.renderExistingSubjects();

    // FIDDLING WITH DATE

    function setCalendarWeek() {
        let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
        let weekCounter = 1;
        let currentYear = new Date().getFullYear();
        let referenceDate = new Date().setHours(12, 0, 0, 0);
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
        let todayUnix = new Date().setHours(12, 0, 0, 0);

        //go back to monday of given week
        while (new Date(todayUnix).getDay() != 1) todayUnix -= 86400000;

        document.querySelectorAll('.weekday').forEach((weekday) => {

            weekday.dataset.date = new Date(todayUnix).toString();

            todayUnix += 86400000;    // 86400000 = ms/day
        })
        AbstractView.setDateOnWeekdayLabel();
        AbstractView.greyOutPassedDays();
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
            let currentDate = new Date(weekday.dataset.date).setHours(12, 0, 0, 0);
            let newDate = currentDate - 86400000 * 7; // -7 days

            weekday.dataset.date = new Date(newDate).toString();
        });

        AbstractView.setDateOnWeekdayLabel();
        AbstractView.greyOutPassedDays();
        AbstractView.toogleIsCurrentWeekDot();
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

        AbstractView.setDateOnWeekdayLabel();
        AbstractView.greyOutPassedDays();
        AbstractView.toogleIsCurrentWeekDot();
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
        let weekOverview = document.querySelector('#weekOverviewContainer');
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
            document.querySelector('#weekOverviewContainer').style.left = 'auto';
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
}

startApp();