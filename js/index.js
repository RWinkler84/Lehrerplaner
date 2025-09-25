import LoginController from './Controller/LoginController.js';
import AbstractController from './Controller/AbstractController.js';
import TaskController from './Controller/TaskController.js';
import SettingsController from './Controller/SettingsController.js';
import AbstractView from './View/AbstractView.js';
import LessonView from './View/LessonView.js';
import TaskView from './View/TaskView.js';
import SettingsView from './View/SettingsView.js';
import Fn from './inc/utils.js';

//config
export const ONEDAY = 86400000;
export const ONEMIN = 60000;

export let unsyncedDeletedSubjects = [];
export let unsyncedDeletedTasks = [];
export let unsyncedDeletedTimetableChanges = [];

export let mailStatus = {
    authMailAlreadySend: false,
    resetMailAlreadySend: false
};

let abstCtrl = new AbstractController();

export let taskBackupArray = [];

async function startApp() {
    AbstractController.setVersion('0.9.1');
    await abstCtrl.syncData();

    document.addEventListener('visibilitychange', abstCtrl.syncData.bind(abstCtrl))

    //checking for unsynced changes
    setInterval(abstCtrl.syncData.bind(abstCtrl), ONEMIN * 5);

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

    //top menu handlers
    document.querySelector('#topMenuContainer').addEventListener('click', AbstractController.topMenuClickEventHandler)

    //handler for task tables
    document.querySelector('#upcomingTasksTable tbody').addEventListener('click', TaskController.tasksTableEventHandler);
    document.querySelector('#inProgressTasksTable tbody').addEventListener('click', TaskController.tasksTableEventHandler);
    document.querySelector('#upcomingTasksTable tbody').addEventListener('dblclick', TaskController.tasksTableEventHandler);
    document.querySelector('#inProgressTasksTable tbody').addEventListener('dblclick', TaskController.tasksTableEventHandler);
    document.querySelector('#upcomingTasksTable tbody').addEventListener('change', TaskController.tasksTableEventHandler);
    document.querySelector('#inProgressTasksTable tbody').addEventListener('change', TaskController.tasksTableEventHandler);

    //handlers for settings
    document.querySelector('#settingsContainer').addEventListener('click', SettingsController.settingsClickEventHandler);

    document.querySelector('#validFromPicker').addEventListener('change', SettingsController.isDateTaken);

    //on site login
    document.addEventListener('click', LoginController.dialogEventHandler);
    document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('cancel', LoginController.dialogEventHandler));

    AbstractController.renderTopMenu();

    setDateForWeekdays();
    setCalendarWeek();
    setWeekStartAndEndDate();
    await LessonView.renderLesson();

    await TaskView.renderTasks();

    await LessonView.showLessonHasTaskIndicator() // <- this has to run, after Tasks are rendered to work

    await SettingsView.renderSelectableLessonColors();
    await SettingsView.renderExistingSubjects();
    await SettingsView.setDateOfTimetableToDisplay();
    await SettingsView.renderLessons();

    LoginController.isAuth();
    LoginController.isRegister();
    LoginController.isReset();

    // FIDDLING WITH DATE

    function setCalendarWeek() {
        let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
        let weekCounter = 1;
        let currentYear = new Date().getFullYear();
        let referenceDate = new Date().setHours(12, 0, 0, 0);
        let firstThursday = Fn.getFirstThirsdayOfTheYear(currentYear);
        let monday = firstThursday - ONEDAY * 3
        let sunday = firstThursday + ONEDAY * 3;

        //checks, if the reference date lies in the current week. if not, tests against the next week
        while (monday < referenceDate && sunday < referenceDate) {
            monday += ONEDAY * 7; // + 7 days
            sunday += ONEDAY * 7; // + 7 days
            weekCounter++;
        }

        //check whether the year changes and reset weekcounter, if so
        calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
    }

    function setDateForWeekdays() {
        let todayUnix = new Date().setHours(12, 0, 0, 0);

        //go back to monday of given week
        while (new Date(todayUnix).getDay() != 1) todayUnix -= ONEDAY;

        document.querySelectorAll('.weekday').forEach((weekday) => {

            weekday.dataset.date = new Date(todayUnix).toString();

            todayUnix += ONEDAY;    // ONEDAY = ms/day
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
            let newDate = currentDate - ONEDAY * 7; // -7 days

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
            let newDate = currentDate + ONEDAY * 7; // +7 days

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
}

startApp();
