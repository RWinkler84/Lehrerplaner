import LoginController from './Controller/LoginController.js';
import AbstractController from './Controller/AbstractController.js';
import TaskController from './Controller/TaskController.js';
import SettingsController from './Controller/SettingsController.js';
import AbstractView from './View/AbstractView.js';
import TaskView from './View/TaskView.js';
import LessonView from './View/LessonView.js';
import Fn from './inc/utils.js';
import LessonNoteController from './Controller/LessonNoteController.js';
import LessonController from './Controller/LessonController.js';
import CurriculumController from './Controller/CurriculumController.js';
import SchoolYearController from './Controller/SchoolYearController.js';
import Editor from './inc/editor.js';
import TimetableController from './Controller/TimetableController.js';

//config
export const ONEDAY = 86400000;
export const ONEMIN = 60000;
export const TODAY = '2025-06-24';
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
    await LoginController.createGuestAccount(); //creates user data
    AbstractController.setVersion('0.9.7');
    await abstCtrl.syncData();

    //live demo stuff
    window.addEventListener("beforeunload", async () => {
        window.indexedDB.deleteDatabase('eduplanio');
    });

    document.addEventListener('click', runTour);
    document.querySelector('#logoutButton').addEventListener('click', async () => {
        window.indexedDB.deleteDatabase('eduplanio');
        window.location = '../';
    })

    window.addEventListener('blur', abstCtrl.syncData.bind(abstCtrl));
    window.addEventListener('focus', () => {
        abstCtrl.syncData();
    });

    //checking for unsynced changes
    setInterval(abstCtrl.syncData.bind(abstCtrl), ONEMIN * 15);

    document.addEventListener('click', (event) => {
        LoginController.dialogEventHandler(event);
        LessonController.timetableClickHandler(event);
        SettingsController.settingsClickEventHandler(event);
        SchoolYearController.clickEventHandler(event);
        TimetableController.timetableClickEventHandler(event);
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

    //handlers for timetableView
    document.querySelector('#validFromPicker').addEventListener('change', TimetableController.isDateTaken);

    //school year info and curriculum
    document.querySelector('#schoolYearViewContainer').addEventListener('change', (event) => {
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
        LessonController.toggleSaveCurriculumSpanNoteButton(event);
    });
    document.addEventListener('selectionchange', Editor.updateButtonStatus);

    //rerender on resize
    window.addEventListener('resize', () => {
        const curriculumSectionMainViewContainer = document.querySelector('#weekCurriculaDisplay');
        const curriculumSettingsView = document.querySelector('#schoolYearViewContainer');

        if (!curriculumSectionMainViewContainer.classList.contains('notDisplayed')) {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                LessonController.renderSelectedCurricula();
            }, 100);
        }

        if (curriculumSettingsView.style.display == 'block') {
            CurriculumController.resizeSpanContentContainers();
        }
    });

    AbstractController.renderTopMenu();

    setDateForWeekdays();
    setCalendarWeek();
    setWeekStartAndEndDate();

    await LessonController.renderCurriculaSelection();
    await LessonController.renderSelectedCurricula();
    await LessonView.renderLesson();

    await TaskView.renderTasks();

    await LessonView.showLessonHasTaskIndicator() // <- this has to run, after Tasks are rendered to work

    LoginController.isAuth();
    LoginController.isRegister();
    LoginController.isReset();

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
        const curriculaDisplayWeekdays = document.querySelectorAll('.curriculaDisplayWeekday');
        const weekdays = document.querySelectorAll('.weekday');

        let todayUnix = new Date(TODAY).setHours(12, 0, 0, 0);

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
        const nav = document.querySelector('nav');

        let translateLeft;

        if (event.target.classList && event.target.classList.contains('cancelTour')) {
            event.target.closest('.introWindow').style.display = 'none';
        }

        switch (event.target.id) {

            case 'window1Confirm':
                event.target.closest('.introWindow').style.display = 'none';

                window2.style.display = 'block';
                window2.style.top = getElementProperty(document.querySelector('#topMenuContainer'), 'bottom') + window.scrollY + 'px';
                window2.style.left = getElementProperty(document.querySelector('#topMenuButtonContainer'), 'right') - getElementProperty(window2, 'width') + 'px';

                checkPosition(window2);
                window.scroll(0, 0);

                document.querySelector('#topMenuButtonContainer').classList.add('highlighted');
                break;

            case 'window2Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('#topMenuButtonContainer').classList.remove('highlighted');

                window3.style.display = 'block';
                window3.style.top = getElementProperty(document.querySelector('#weekSwitcher'), 'bottom') + window.scrollY + 'px';
                window3.style.left = getElementProperty(document.querySelector('#topMenuButtonContainer'), 'right') - getElementProperty(window3, 'width') + 'px';

                checkPosition(window3);

                document.querySelector('#weekSwitcher').classList.add('highlighted');
                break;

            case 'window3Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('#weekSwitcher').classList.remove('highlighted');

                window4.style.display = 'block';
                window4.style.top = getElementProperty(document.querySelector('#weekOverviewContainer'), 'bottom') - 50 + window.scrollY + 'px';

                checkPosition(window4);
                scrollToPosition(event.target.id);

                document.querySelector('#weekOverviewContainer').classList.add('highlighted');
                break;

            case 'window4Confirm':
                event.target.closest('.introWindow').style.display = 'none';

                window5.style.display = 'block';
                window5.style.top = getElementProperty(document.querySelector('#weekOverviewContainer'), 'bottom') - 50 + window.scrollY + 'px';

                checkPosition(window5);

                break;

            case 'window5Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.addEventListener('formOpened', () => runTour({ target: { id: 'lessonFormOpened' } }));
                break;

            case 'lessonFormOpened':
                let navHeight = nav.getBoundingClientRect().height;
                // nav.style.transform = `translate(0, -${navHeight}px`;
                translateLeft = getElementProperty(document.querySelector('.lessonForm'), 'left') + getElementProperty(document.querySelector('.lessonForm'), 'width') / 2;

                document.querySelector('#weekOverviewContainer').classList.remove('highlighted');
                document.removeEventListener('click', () => runTour({ target: { id: 'lessonFormOpened' } }));

                window6.style.display = 'block';
                window6.style.top = getElementProperty(document.querySelector('.lessonForm'), 'bottom') + window.scrollY + 10 + 'px';
                window6.style.left = translateLeft + 'px';

                checkPosition(window6);
                scrollToPosition('lessonFormOpened');

                document.querySelector('.lessonForm').classList.add('highlighted');
                document.querySelector('#lessonForm').removeEventListener('submit', LessonView.saveNewLesson);
                document.querySelector('.discardNewLessonButton').removeEventListener('click', LessonView.removeLessonForm);

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
                scrollToPosition(event.target.id);

                document.querySelectorAll('.lessonForm').forEach(lessonForm => lessonForm.remove());
                document.querySelector('#markedSlot>.lesson').classList.add('highlighted');
                break;

            case 'window8Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('#markedSlot>.lesson').classList.remove('highlighted');

                window9.style.display = 'block';
                window9.style.top = getElementProperty(document.querySelector('#taskContainer'), 'bottom') + window.scrollY + 3 + 'px';

                checkPosition(window9);
                scrollToPosition(event.target.id);

                document.querySelector('#taskContainer').classList.add('highlighted');
                break;

            case 'window9Confirm':
                event.target.closest('.introWindow').style.visibility = 'hidden';
                document.querySelector('#taskContainer').classList.remove('highlighted');

                document.querySelectorAll('tr[data-taskid="6"]>td').forEach(td => {
                    td.classList.add('highlighted');

                    if (td.classList.contains('taskAdditionalInfo')) {
                        td.style.borderLeft = 'solid 3px var(--matteRed)';
                        td.style.borderRight = 'none';
                    }

                    if (td.classList.contains('taskClassName')) {
                        td.style.borderLeft = 'none';
                        td.style.borderRight = 'none';
                    }

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

                window10.style.display = 'block';
                window10.style.top = getElementProperty(document.querySelector('tr[data-taskid="6"]'), 'bottom') + window.scrollY + 3 + 'px';

                checkPosition(window10);
                scrollToPosition(event.target.id);
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
                translateLeft = getElementProperty(document.querySelector('.discardNewTaskButton'), 'right') - getElementProperty(window11, 'width');
                window11.style.top = getElementProperty(document.querySelector('.discardNewTaskButton'), 'bottom') + window.scrollY + 15 + 'px';
                window11.style.left = translateLeft + 'px';

                checkPosition(window11);
                scrollToPosition(event.target.id);

                document.querySelector('td[contenteditable]').nextElementSibling.classList.add('highlighted');
                document.querySelector('td[contenteditable]').nextElementSibling.style.borderRight = 'solid 3px';
                break;

            case 'window11Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('td[contenteditable]').nextElementSibling.classList.remove('highlighted');
                document.querySelector('td[contenteditable]').nextElementSibling.style.borderRight = 'none';

                document.querySelector('td[contenteditable]').closest('tr').nextElementSibling.firstElementChild.classList.add('highlighted');
                document.querySelector('td[contenteditable]').closest('tr').nextElementSibling.firstElementChild.style.border = 'solid 3px';

                window12.style.display = 'block';
                window12.style.top = getElementProperty(document.querySelector('td[contenteditable]').closest('tr').nextElementSibling.firstElementChild, 'bottom') + window.scrollY + 10 + 'px';

                checkPosition(window12);

                break;

            case 'window12Confirm':
                event.target.closest('.introWindow').style.display = 'none';

                window13.style.display = 'block';
                window13.style.top = getElementProperty(document.querySelector('td[contenteditable]').closest('tr').nextElementSibling.firstElementChild, 'bottom') + window.scrollY + 10 + 'px';

                checkPosition(window13);
                scrollToPosition(event.target.id);

                break;

            case 'window13Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                document.querySelector('td[contenteditable]').closest('tr').nextElementSibling.firstElementChild.classList.remove('highlighted');
                document.querySelector('td[contenteditable]').closest('tr').nextElementSibling.firstElementChild.style.border = 'none';

                window14.style.display = 'block';
                window14.style.top = getElementProperty(document.querySelector('tr[data-taskid="6"]'), 'bottom') + window.scrollY + 10 + 'px';
                checkPosition(window14);
                scrollToPosition(event.target.id);

                break;

            case 'window14Confirm':
                event.target.closest('.introWindow').style.display = 'none';
                window9.style.display = 'none';
                nav.removeAttribute('style');
                scrollToPosition(event.target.id);
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
            windowElem.style.position = 'fixed';
            windowElem.style.top = '';

            windowElem.style.left = '0px';
            windowElem.style.bottom = '0px';
            return;
        }

        let rect = windowElem.getBoundingClientRect();

        if (rect.right > window.outerWidth) {
            windowElem.style.left = '';
            windowElem.style.right = '16px';
            windowElem.style.transform = 'translate(0px)';
        }

        if (rect.left <= 0) {
            windowElem.style.left = '16px';
            windowElem.style.transform = 'translate(0px)';
        }

    }

    function scrollToPosition(buttonClicked) {

        const window6 = document.querySelector('#window6');
        const window8 = document.querySelector('#window8');
        const window9 = document.querySelector('#window9');
        const window10 = document.querySelector('#window10');
        const window11 = document.querySelector('#window11');
        const window13 = document.querySelector('#window13');
        const window14 = document.querySelector('#window14');

        let y;

        if (window.outerWidth <= 600) {
            switch (buttonClicked) {
                case 'window3Confirm':
                    window.scroll(0, getElementProperty(document.querySelector('#timetableContainer'), 'top'));
                    break;

                case 'lessonFormOpened':
                    let form = document.querySelector('#lessonForm');
                    y = form.getBoundingClientRect().y ;
                    window.scrollTo(0, y - 40);
                    break;

                case 'window7Confirm':
                    let markedSlot = document.querySelector('#markedSlot');
                    let nav = document.querySelector('nav');

                    y = markedSlot.getBoundingClientRect().y - markedSlot.getBoundingClientRect().height - nav.getBoundingClientRect().height;
                    window.scrollTo(0, y + window.scrollY);
                    break;

                case 'window8Confirm':
                    document.querySelector('#taskContainer').scrollIntoView();
                    break;

                case 'window9Confirm':
                    document.querySelector('tr[data-taskid="3"]').scrollIntoView({ block: 'start' });
                    break;

                case 'taskEdited':
                    window.requestAnimationFrame();
                    let td = document.querySelector('td[contendeditable]');
                    y = td.getBoundingClientRect().y - td.getBoundingClientRect().height;
                    window.scrollTo(0, y + window.scrollY);
                    break;

                case 'window14Confirm':
                    window.scroll(0, 0);
                    break;
            }

            return;
        }

        switch (buttonClicked) {
            case 'window3Confirm':
                window.scroll(0, getElementProperty(document.querySelector('#timetableContainer'), 'top') + 100);
                break;

            case 'lessonFormOpened':
                window.scroll(0, getElementProperty(window6, 'top'));
                break;

            case 'window7Confirm':
                window.scroll(0, getElementProperty(window8, 'top') + getElementProperty(window8, 'height') / 2);
                break;

            case 'window8Confirm':
                window.scroll(0, getElementProperty(window9, 'top') + getElementProperty(window9, 'height') / 2);
                break;

            case 'window9Confirm':
                window.scroll(0, getElementProperty(window10, 'top') + getElementProperty(window10, 'height') / 2);
                break;

            case 'taskEdited':
                window.scroll(0, getElementProperty(window11, 'top') + getElementProperty(window11, 'height') / 2);
                break;

            case 'window12Confirm':
                window.scroll(0, getElementProperty(window13, 'top') + getElementProperty(window13, 'height') / 2);
                break;

            case 'window13Confirm':
                window.scroll(0, getElementProperty(window14, 'top') + getElementProperty(window14, 'height') / 2);
                break;

            case 'window14Confirm':
                window.scroll(0, 0);
                break;
        }
    }

}



startApp();
