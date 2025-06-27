import SettingsView from './View/SettingsView.js';
import TaskView from './View/TaskView.js';
import LessonView from './View/LessonView.js';
import AbstractView from './View/AbstractView.js';
import AbstractController from './Controller/AbstractController.js';
import SettingsController from './Controller/SettingsController.js';
import Fn from './inc/utils.js';

//config
export const ONEDAY = 86400000;
export const ONEMIN = 60000;

export let unsyncedDeletedSubjects = [];
export let unsyncedDeletedTasks = [];
export let unsyncedDeletedTimetableChanges = [];

let abstCtrl = new AbstractController();

export let allSubjects = [
    { "id": "1", "subject": "De", "colorCssClass": "subjectColorOne", "lastEdited": "2025-06-13 12:14:18" },
    { "id": "3", "subject": "Sk", "colorCssClass": "subjectColorFive", "lastEdited": "2025-06-19 13:18:25" },
    { "id": "4", "subject": "Ge", "colorCssClass": "subjectColorThree", "lastEdited": "2025-06-19 13:54:17" }
];
export let allTasksArray = [
    { "id": "3", "date": "2025-06-24", "timeslot": "3", "class": "6a", "subject": "Ge", "description": "Römische Expansion Germanien vorbereiten", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:46:50" },
    { "id": "6", "date": "2025-06-23", "timeslot": "4", "class": "7c", "subject": "Ge", "description": "Steckbrief Ludwig XIV", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:47:26" },
    { "id": "7", "date": "2025-06-24", "timeslot": "3", "class": "6a", "subject": "De", "description": "Arbeitsblatt Wortarten", "status": "inProgress", "fixedTime": "0", "lastEdited": "2025-06-19 13:57:59" },
    { "id": "8", "date": "2025-06-25", "timeslot": "3", "class": "8b", "subject": "Sk", "description": "Leben in der Gemeinde", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:48:42" },
    { "id": "9", "date": "2025-06-25", "timeslot": "4", "class": "6a", "subject": "De", "description": "Kk Wortarten", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:57:59" },
    { "id": "10", "date": "2025-06-25", "timeslot": "2", "class": "6b", "subject": "De", "description": "Kk Wortarten", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:49:23" },
    { "id": "11", "date": "2025-06-27", "timeslot": "1", "class": "6b", "subject": "De", "description": "Rückgabe Kk", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:49:58" },
    { "id": "13", "date": "2025-06-26", "timeslot": "4", "class": "10a", "subject": "Ge", "description": "Gruppenarbeit Wiedervereinigung", "status": "inProgress", "fixedTime": "0", "lastEdited": "2025-06-19 13:51:02" }
];
export let standardTimetable = [
    { "id": "1", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekdayNumber": "1", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "2", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekdayNumber": "1", "timeslot": "3", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "3", "validFrom": "2025-06-13", "validUntil": null, "class": "7c", "subject": "Ge", "weekdayNumber": "1", "timeslot": "4", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "4", "validFrom": "2025-06-13", "validUntil": null, "class": "9b", "subject": "Ge", "weekdayNumber": "1", "timeslot": "5", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "5", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekdayNumber": "2", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "6", "validFrom": "2025-06-13", "validUntil": null, "class": "8a", "subject": "Ge", "weekdayNumber": "2", "timeslot": "2", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "7", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekdayNumber": "2", "timeslot": "3", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "8", "validFrom": "2025-06-13", "validUntil": null, "class": "8a", "subject": "Sk", "weekdayNumber": "2", "timeslot": "5", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "9", "validFrom": "2025-06-13", "validUntil": null, "class": "10a", "subject": "Ge", "weekdayNumber": "3", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "10", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekdayNumber": "3", "timeslot": "2", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "11", "validFrom": "2025-06-13", "validUntil": null, "class": "8b", "subject": "Sk", "weekdayNumber": "3", "timeslot": "3", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "12", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekdayNumber": "3", "timeslot": "4", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "13", "validFrom": "2025-06-13", "validUntil": null, "class": "9a", "subject": "Sk", "weekdayNumber": "3", "timeslot": "6", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "14", "validFrom": "2025-06-13", "validUntil": null, "class": "8a", "subject": "Ge", "weekdayNumber": "4", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "15", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekdayNumber": "4", "timeslot": "2", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "16", "validFrom": "2025-06-13", "validUntil": null, "class": "10a", "subject": "Ge", "weekdayNumber": "4", "timeslot": "4", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "17", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekdayNumber": "4", "timeslot": "5", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "18", "validFrom": "2025-06-13", "validUntil": null, "class": "8b", "subject": "Sk", "weekdayNumber": "4", "timeslot": "6", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "19", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekdayNumber": "5", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "20", "validFrom": "2025-06-13", "validUntil": null, "class": "8a", "subject": "Sk", "weekdayNumber": "5", "timeslot": "2", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "21", "validFrom": "2025-06-13", "validUntil": null, "class": "7c", "subject": "Ge", "weekdayNumber": "5", "timeslot": "3", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "22", "validFrom": "2025-06-13", "validUntil": null, "class": "9b", "subject": "Ge", "weekdayNumber": "5", "timeslot": "4", "lastEdited": "2025-06-19 13:36:09" },
    { "id": "23", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekdayNumber": "5", "timeslot": "5", "lastEdited": "2025-06-19 13:36:09" }
];

export let timetableChanges = [
    { "id": "1", "date": "2025-06-11", "timeslot": "5", "class": "6a", "subject": "Termin", "canceled": "false", "type": "appointement", "lastEdited": "2025-06-10 18:11:15" },
    { "id": "5", "date": "2025-06-30", "timeslot": "1", "class": "6a", "subject": "De", "canceled": "true", "type": "normal", "lastEdited": "2025-06-13 20:08:46" },
    { "id": "6", "date": "2025-06-20", "timeslot": "1", "class": "Fobi", "subject": "Termin", "canceled": "false", "type": "appointement", "lastEdited": "2025-06-18 11:38:04" },
    { "id": "7", "date": "2025-06-27", "timeslot": "6", "class": "Egs", "subject": "Termin", "canceled": "false", "type": "appointement", "lastEdited": "2025-06-19 13:43:37" },
    { "id": "8", "date": "2025-06-23", "timeslot": "1", "class": "6a", "subject": "De", "canceled": "true", "type": "normal", "lastEdited": "2025-06-19 13:57:59" },
    { "id": "9", "date": "2025-06-27", "timeslot": "3", "class": "7c", "subject": "Ge", "canceled": "true", "type": "normal", "lastEdited": "2025-06-19 13:58:31" }
];

export let taskBackupArray = [];


async function startApp() {

    document.addEventListener('click', runTour);

    document.querySelector('#logoutButton').addEventListener('click', () => { window.location = '../' });
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
    document.querySelector('#settingsContainer').addEventListener('click', AbstractView.settingsClickEventHandler);
    document.querySelector('#openSettingsButton').addEventListener('click', AbstractView.openSettings);
    document.querySelector('#closeSettingsButton').addEventListener('click', AbstractView.closeSettings);

    document.querySelector('#validFromPicker').addEventListener('change', SettingsView.isDateTaken);


    setDateForWeekdays();
    setCalendarWeek();
    setWeekStartAndEndDate();
    LessonView.renderLesson();

    TaskView.renderUpcomingTasks();
    TaskView.renderInProgressTasks();

    LessonView.showLessonHasTaskIndicator() // <- this has to run, after Tasks are rendered to work

    SettingsView.renderSelectableLessonColors();
    SettingsView.renderExistingSubjects();
    SettingsView.setDateOfTimetableToDisplay();
    SettingsView.renderLessons();

    // FIDDLING WITH DATE

    function setCalendarWeek() {
        let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
        let weekCounter = 1;
        let currentYear = 2025;
        let referenceDate = new Date('2025-06-24').setHours(12, 0, 0, 0);
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
        let todayUnix = new Date('2025-06-24').setHours(12, 0, 0, 0);

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

    function runTour(event) {
        if (event.preventDefault && document.querySelector('#window6').style.display == 'block') event.preventDefault();

        const window1 = document.querySelector('#window1');
        const window2 = document.querySelector('#window2');
        const window3 = document.querySelector('#window3');
        const window4 = document.querySelector('#window4');
        const window5 = document.querySelector('#window5');
        const window6 = document.querySelector('#window6');
        const window7 = document.querySelector('#window7');
        const window8 = document.querySelector('#window8');
        const window9 = document.querySelector('#window9');
        const window10 = document.querySelector('#window10');
        const window11 = document.querySelector('#window11');
        const window12 = document.querySelector('#window12');
        const window13 = document.querySelector('#window13');
        const window14 = document.querySelector('#window14');

        let translateLeft;

        if (event.target.classList && event.target.classList.contains('cancelTour')) {
            introRunning = false;
            event.target.closest('.introWindow').style.display = 'none';
        }

        switch (event.target.id) {

            case 'window1Confirm':
                event.target.closest('.introWindow').style.display = 'none';

                window2.style.display = 'block';
                window2.style.top = getElementProperty(document.querySelector('#topMenuContainer'), 'bottom') + window.scrollY + 'px';
                window2.style.left = getElementProperty(document.querySelector('#topMenuButtonContainer'), 'right') - getElementProperty(window2, 'width') + 'px';

                checkPosition(window2);

                document.querySelector('#topMenuButtonContainer').classList.add('highlighted');
                break;

            case 'window2Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('#topMenuButtonContainer').classList.remove('highlighted');

                window3.style.display = 'block';
                window3.style.top = getElementProperty(document.querySelector('#switchWeekContainer'), 'bottom') + window.scrollY + 'px';
                window3.style.left = getElementProperty(document.querySelector('#topMenuButtonContainer'), 'right') - getElementProperty(window3, 'width') + 'px';

                checkPosition(window3);

                document.querySelector('#switchWeekContainer').classList.add('highlighted');
                break;

            case 'window3Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('#switchWeekContainer').remove('highlighted');

                window.scroll(0, getElementProperty(document.querySelector('#timetableContainer'), 'top') + 100);

                window4.style.display = 'block';
                window4.style.top = getElementProperty(document.querySelector('#weekOverviewContainer'), 'bottom') - 50 + window.scrollY + 'px';
                document.querySelector('#weekOverviewContainer').classList.add('highlighted');
                break;

            case 'window4Confirm':
                event.target.closest('.introWindow').style.display = 'none';

                window5.style.display = 'block';
                window5.style.top = getElementProperty(document.querySelector('#weekOverviewContainer'), 'bottom') - 50 + window.scrollY + 'px';
                break;

            case 'window5Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('#weekOverviewContainer').addEventListener('click', continueTourAfterOpeningLessonForm);
                break;

            case 'lessonFormOpened':
                translateLeft = getElementProperty(document.querySelector('.lessonForm'), 'left') + getElementProperty(document.querySelector('.lessonForm'), 'width') / 2;

                document.querySelector('#weekOverviewContainer').classList.remove('highlighted');
                document.querySelector('#weekOverviewContainer').removeEventListener('click', continueTourAfterOpeningLessonForm);

                window6.style.display = 'block';
                window6.style.top = getElementProperty(document.querySelector('.lessonForm'), 'bottom') + window.scrollY + 10 + 'px';
                window6.style.left = translateLeft + 'px';

                checkPosition(window6);

                document.querySelector('.lessonForm').classList.add('highlighted');
                document.querySelector('#lessonForm').removeEventListener('submit', LessonView.saveNewLesson);
                document.querySelector('.discardNewLessonButton').removeEventListener('click', LessonView.removeLessonForm);

                window.scroll(0, getElementProperty(window6, 'top'));
                break;

            case 'window6Confirm':
                event.target.closest('.introWindow').style.display = 'none';

                translateLeft = getElementProperty(document.querySelector('.lessonForm'), 'left') + getElementProperty(document.querySelector('.lessonForm'), 'width') / 2;

                window7.style.display = 'block';
                window7.style.top = getElementProperty(document.querySelector('.lessonForm'), 'bottom') + window.scrollY + 10 + 'px';
                window7.style.left = translateLeft + 'px';

                checkPosition(window7);

                document.querySelector('.lessonForm').classList.add('highlighted');
                document.querySelector('#lessonForm').addEventListener('submit', LessonView.saveNewLesson);
                document.querySelector('.discardNewLessonButton').addEventListener('click', LessonView.removeLessonForm);
                break;

            case 'window7Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                if (document.querySelector('.lessonForm')) document.querySelector('.lessonForm').classList.remove('highlighted');

                translateLeft = getElementProperty(document.querySelector('#markedSlot>.lesson'), 'left') + getElementProperty(document.querySelector('#markedSlot>.lesson'), 'width') / 2;

                window8.style.display = 'block';
                window8.style.top = getElementProperty(document.querySelector('#markedSlot>.lesson'), 'bottom') + window.scrollY + 10 + 'px';
                window8.style.left = translateLeft + 'px';

                checkPosition(window8);

                window.scroll(0, getElementProperty(window8, 'top') + getElementProperty(window8, 'height') / 2);

                document.querySelectorAll('.lessonForm').forEach(lessonForm => lessonForm.remove());
                document.querySelector('#markedSlot>.lesson').classList.add('highlighted');
                break;

            case 'window8Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('#markedSlot>.lesson').classList.remove('highlighted');

                window9.style.display = 'block';
                window9.style.top = getElementProperty(document.querySelector('#taskContainer'), 'bottom') + window.scrollY + 3 + 'px';
                window.scroll(0, getElementProperty(window9, 'top') + getElementProperty(window9, 'height') / 2);

                document.querySelector('#taskContainer').classList.add('highlighted');
                break;

            case 'window9Confirm':
                event.target.closest('.introWindow').style.visibility = 'hidden';
                document.querySelector('#taskContainer').classList.remove('highlighted');

                document.querySelectorAll('tr[data-taskid="3"]>td').forEach(td => {
                    td.classList.add('highlighted');

                    if (td.classList.contains('taskSubjectContainer')) {
                        td.style.borderLeft = 'none';
                        td.style.borderRight = 'none';
                    }

                    if (td.classList.contains('taskDescription')) {
                        td.style.borderLeft = 'none';
                        td.style.borderRight = 'none';
                    }

                    if (td.classList.contains('taskDone')) {
                        td.style.borderLeft = 'none';
                        td.style.borderRight = 'solid 3px';
                        td.style.height = '55px';
                    }
                });

                document.querySelectorAll('tr[data-taskid="3"]>td.taskDone button').forEach(button => button.style.height = '1.25rem')
                
                window10.style.display = 'block';
                window10.style.top = getElementProperty(document.querySelector('tr[data-taskid="3"]'), 'bottom') + window.scrollY + 3 + 'px';
                window.scroll(0, getElementProperty(window10, 'bottom'));

                console.log(getElementProperty(window10, 'bottom'));

                break;

            case 'window10Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelectorAll('.highlighted').forEach(td => {
                    td.classList.remove('highlighted');
                    td.removeAttribute('style');
                })

                document.querySelector('#taskContainer').addEventListener('dblclick', continueTourAfterMakingTaskEditable);
                break;

            case 'taskEdited':
                document.querySelector('#taskContainer').removeEventListener('dblclick', continueTourAfterMakingTaskEditable);

                window11.style.display = 'block';
                translateLeft = getElementProperty(document.querySelector('.discardUpdateTaskButton'), 'right') - getElementProperty(window11, 'width');
                window11.style.top = getElementProperty(document.querySelector('.discardUpdateTaskButton'), 'bottom') + window.scrollY + 15 + 'px';
                window11.style.left = translateLeft + 'px';

                checkPosition(window11);

                window.scroll(0, getElementProperty(window11, 'top') + getElementProperty(window11, 'height') / 2);

                document.querySelector('.discardUpdateTaskButton').closest('td').classList.add('highlighted');
                document.querySelector('.discardUpdateTaskButton').closest('td').style.borderRight = 'solid 3px';
                break;

            case 'window11Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('.discardUpdateTaskButton').closest('td').classList.remove('highlighted');
                document.querySelector('.discardUpdateTaskButton').closest('td').style.borderRight = 'none';

                document.querySelector('.discardUpdateTaskButton').closest('tr').nextElementSibling.firstElementChild.classList.add('highlighted');
                document.querySelector('.discardUpdateTaskButton').closest('tr').nextElementSibling.firstElementChild.style.borderRight = 'solid 3px';

                window12.style.display = 'block';
                window12.style.top = getElementProperty(document.querySelector('.discardUpdateTaskButton').closest('tr').nextElementSibling.firstElementChild, 'bottom') + window.scrollY + 10 + 'px';

                break;

            case 'window12Confirm':
                event.target.closest('.introWindow').style.display = 'none';

                window13.style.display = 'block';
                window13.style.top = getElementProperty(document.querySelector('.discardUpdateTaskButton').closest('tr').nextElementSibling.firstElementChild, 'bottom') + window.scrollY + 10 + 'px';
                window.scroll(0, getElementProperty(window13, 'bottom'));

                break;

            case 'window13Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('.discardUpdateTaskButton').closest('tr').nextElementSibling.firstElementChild.classList.remove('highlighted');
                document.querySelector('.discardUpdateTaskButton').closest('tr').nextElementSibling.firstElementChild.style.borderRight = 'none';

                window14.style.display = 'block';
                window14.style.top = getElementProperty(document.querySelector('tr[data-taskid="6"]'), 'bottom') + window.scrollY + 10 + 'px';
                window.scroll(0, getElementProperty(window14, 'bottom'));

                break;

            case 'window14Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                window9.style.display = 'none';
                window.scroll(0, 0);
        }
    }

    function continueTourAfterOpeningLessonForm(event) {
        if (
            event.target.classList.contains('addLessonButtonWrapper') ||
            event.target.classList.contains('addLessonButton')
        ) {
            runTour({ target: { id: 'lessonFormOpened' } });
        }
    }

    function continueTourAfterMakingTaskEditable(event) {
        if (event.target.closest('tr')) {
            runTour({ target: { id: 'taskEdited' } });
        }
    }

    function getElementProperty(element, prop) {
        let rect = element.getBoundingClientRect()
        return rect[prop];
    }

    function checkPosition(windowElem) {
        if (window.outerWidth <= 600) {
            windowElem.style.left = '0px';
            return;
        }

        let rect = windowElem.getBoundingClientRect();

        if (rect.right > window.outerWidth) {
            windowElem.style.left = '';
            windowElem.style.right = '16px';
            windowElem.style.transform = 'translate(0px)';
        }

    }
}


startApp();
