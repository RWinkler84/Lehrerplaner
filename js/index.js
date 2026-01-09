import LoginController from './Controller/LoginController.js';
import AbstractController from './Controller/AbstractController.js';
import TaskController from './Controller/TaskController.js';
import SettingsController from './Controller/SettingsController.js';
import AbstractView from './View/AbstractView.js';
import TaskView from './View/TaskView.js';
import SettingsView from './View/SettingsView.js';
import LessonView from './View/LessonView.js';
import Fn from './inc/utils.js';
import LessonNoteController from './Controller/LessonNoteController.js';
import LessonController from './Controller/LessonController.js';
import CurriculumController from './Controller/CurriculumController.js';
import SchoolYearController from './Controller/SchoolYearController.js';
import Editor from './inc/editor.js';

//config
export const ONEDAY = 86400000;
export const ONEMIN = 60000;
export const ANIMATIONRUNTIME = 300;
export const ALLOWEDTAGS = ['div', 'span', 'ul', 'ol', 'li', 'b', 'p', 'br']

export let unsyncedDeletedSubjects = [];
export let unsyncedDeletedTasks = [];
export let unsyncedDeletedTimetableChanges = [];

//track lessonNote inputs
export let editorChangesArray = [];

export let mailStatus = {
    authMailAlreadySend: false,
    resetMailAlreadySend: false
};

export let taskBackupArray = [];

let abstCtrl = new AbstractController();
let timeout = false //for resize debouncing

async function startApp() {
    AbstractController.setVersion('0.9.5');
    await abstCtrl.syncData();

    window.addEventListener('blur', abstCtrl.syncData.bind(abstCtrl));
    window.addEventListener('focus', abstCtrl.syncData.bind(abstCtrl));

    //checking for unsynced changes
    setInterval(abstCtrl.syncData.bind(abstCtrl), ONEMIN * 15);

    document.addEventListener('click', (event) => {
        LoginController.dialogEventHandler(event);
        LessonController.timetableClickHandler(event);
    });

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

    //school year info and curriculum
    document.querySelector('#curriculumViewContainer').addEventListener('change', (event) => {
        SchoolYearController.changeEventHandler(event);
        CurriculumController.changeEventHandler(event);
    });
    document.querySelector('#curriculumContainer').addEventListener('click', CurriculumController.handleClickEvents);
    document.querySelector('#yearContainer').addEventListener('pointerdown', CurriculumController.handleMouseDownOnDayElements);

    //on site login
    document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('cancel', LoginController.dialogEventHandler));

    //lesson note handler
    document.querySelector('#lessonNoteDialog').addEventListener('click', LessonNoteController.handleClickEvents);

    //text editor
    document.querySelectorAll('.editorContainer').forEach(element => element.addEventListener('click', Editor.handleClickEvents));
    document.querySelectorAll('.editorContainer').forEach(element => element.addEventListener('keydown', Editor.handleKeyDownEvents));
    document.querySelectorAll('.editorButtonContainer').forEach(element => element.addEventListener('mousedown', event => event.preventDefault()));
    document.addEventListener('input', (event) => {
        Editor.normalizeInput(event);
        LessonNoteController.toggleSaveLessonNoteButton(event);
    });
    document.addEventListener('selectionchange', Editor.updateButtonStatus);

    //rerender on resize
    window.addEventListener('resize', () => {
        const curriculumSectionMainViewContainer = document.querySelector('#weekCurriculaDisplay');
        const curriculumSettingsView = document.querySelector('#curriculumViewContainer');

        if (!curriculumSectionMainViewContainer.classList.contains('notDisplayed')) {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                LessonController.renderSelectedCurricula();
            }, 100);
        }

        if (curriculumSettingsView.style.display == 'block') {
            const curriculumId = CurriculumController.getDisplayedCurriculumId();
            CurriculumController.rerenderDisplayedCurriculum(curriculumId);

        }
    });


    AbstractController.renderTopMenu();

    setDateForWeekdays();
    setCalendarWeek();
    setWeekStartAndEndDate();
    
    await SchoolYearController.removeProvisionalData();

    await LessonController.renderCurriculaSelection();
    await LessonController.renderSelectedCurricula();
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
        const curriculaDisplayWeekdays = document.querySelectorAll('.curriculaDisplayWeekday');
        const weekdays = document.querySelectorAll('.weekday');

        let todayUnix = new Date().setHours(12, 0, 0, 0);

        //go back to monday of given week
        while (new Date(todayUnix).getDay() != 1) todayUnix -= ONEDAY;

        for (let i = 0; i < weekdays.length; i++) {
            curriculaDisplayWeekdays[i].dataset.date = new Date(todayUnix).toString();
            weekdays[i].dataset.date = new Date(todayUnix).toString();

            todayUnix += ONEDAY;
        }

        AbstractView.setDateOnWeekdayLabel();
        AbstractController.greyOutHolidaysAndPassedDays();
        AbstractView.setIsTodayDot();
        AbstractView.scrollToCurrentDay();
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

        document.querySelectorAll('.curriculaDisplayWeekday').forEach((weekday) => {
            let currentDate = new Date(weekday.dataset.date).setHours(12, 0, 0, 0);
            let newDate = currentDate - ONEDAY * 7; // -7 days

            weekday.dataset.date = new Date(newDate).toString();
        });

        AbstractView.setDateOnWeekdayLabel();
        AbstractController.greyOutHolidaysAndPassedDays();
        AbstractView.toogleIsCurrentWeekDot();
        setWeekStartAndEndDate();
        calcCalendarWeek(false);
        AbstractView.setIsTodayDot();
        AbstractView.scrollToCurrentDay();
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

        document.querySelectorAll('.curriculaDisplayWeekday').forEach((weekday) => {
            let currentDate = new Date(weekday.dataset.date).setHours(12, 0, 0, 0);
            let newDate = currentDate + ONEDAY * 7; // -7 days

            weekday.dataset.date = new Date(newDate).toString();
        });

        AbstractView.setDateOnWeekdayLabel();
        AbstractController.greyOutHolidaysAndPassedDays();
        AbstractView.toogleIsCurrentWeekDot();
        setWeekStartAndEndDate();
        calcCalendarWeek(true);
        AbstractView.setIsTodayDot();
        AbstractView.scrollToCurrentDay();
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
        LessonController.removeAllCurriculumSpans(blankWeekTable);

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
            timetableContainer.style.height = '';

            LessonView.renderLesson();
            LessonController.renderCurriculaSelection();
            LessonController.renderSelectedCurricula();

            weekOverview.querySelectorAll('.lesson').forEach((lesson) => {
                lesson.style.opacity = '0';
                lesson.style.transition = 'all 1s ease-out';
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
