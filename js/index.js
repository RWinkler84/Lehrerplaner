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
import DayNoteController from './Controller/DayNoteController.js';
import GlobalNotesController from './Controller/GlobalNotesController.js';

//livedemo stuff
export let tourStatus = {
    running: true
};
import Tour from './tour.js';
document.addEventListener('DOMContentLoaded', () => {
    Tour.initTourModal();
    Tour.openSlide()
});
document.querySelector('#topMenuContainer').addEventListener('click', Tour.clickHandler);


//config
export const ONEDAY = 86400000;
export const ONEMIN = 60000;
export const TODAY = '2025-06-24';
export const ANIMATIONRUNTIME = 300;
export const ALLOWEDTAGS = ['div', 'span', 'ul', 'ol', 'li', 'b', 'p', 'br']
export const VERSION = '0.9.280826';

export const SF_ID_ROOT = 0;
export const SF_ID_TRASH = 1;

export const MOBILE_VIEW_WIDTH = 620;

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

export let userStatus = {
    firstTimeUser: false
}

//stores the necessary for rightclick on touch 
export let contextMenuEvent = {
    touchstartTimeOutId: null,
    touchEndTimeOutId: null,
    contextMenuOpened: false,
    touchEndFired: false,
    touchScrolled: false,
    touchStartX: null,
    touchStartY: null,
};

export let globalItemsMultiSelectData = {
    mouseDown: false,
    ignoreNextClickEvent: false,
    startX: null,
    startY: null,
    selectables: [],
    selecatablesPos: {}
};

let timeout = false //for resize debouncing
let abstCtrl = new AbstractController();

async function startApp() {
    await LoginController.createGuestAccount(); //creates user data
    // await registerWorker();

    // AbstractController.checkVersion();
    SettingsController.setVersion(VERSION);

    await SettingsController.checkForPendingLogout();
    await abstCtrl.syncData();

    //live demo stuff
    window.addEventListener("beforeunload", async () => {
        window.indexedDB.deleteDatabase('eduplanio_demo');
    });
    document.querySelector('#logoutButton').addEventListener('click', async () => {
        window.indexedDB.deleteDatabase('eduplanio_demo');
        window.location = '../'
    });

    //checking for unsynced changes
    setInterval(abstCtrl.syncData.bind(abstCtrl), ONEMIN * 15);

    document.addEventListener('click', (event) => {
        AbstractController.clickEventHandler(event);
        LoginController.dialogEventHandler(event);
        LessonController.timetableClickHandler(event);
        SettingsController.settingsClickEventHandler(event);
        SchoolYearController.clickEventHandler(event);
        TimetableController.timetableClickEventHandler(event);
        DayNoteController.clickHandler(event);
        GlobalNotesController.clickHandler(event);
    });

    document.addEventListener('keydown', (event) => {
        if (event.srcElement.closest('.editorContainer')) Editor.handleKeyDownEvents(event);
        if (document.querySelector('#globalNotesContainer')?.style.display == 'block') GlobalNotesController.handleKeyboardShortcuts(event);
    });


    // handlers for empty timeslots
    document.querySelectorAll('.timeslot').forEach((element) => {
        element.addEventListener('mouseenter', AbstractView.showAddLessonButton);
    });

    document.querySelectorAll('.timeslot').forEach((element) => {
        element.addEventListener('click', LessonView.createLessonForm);
    });

    //handler for weekday label
    document.querySelectorAll('.weekdayLabel').forEach(label => {
        label.addEventListener('mouseenter', AbstractView.removeAddLessonButton);
    })

    //weekView datepicker
    document.querySelector('#weekSwitcherDatePicker').addEventListener('change', AbstractController.switchToSelectedWeek);

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
    // document.querySelectorAll('.editorContainer').forEach(element => element.addEventListener('keydown', Editor.handleKeyDownEvents));
    document.querySelectorAll('.editorButtonContainer').forEach(element => element.addEventListener('mousedown', event => event.preventDefault()));
    document.addEventListener('input', (event) => {
        if (!event.target.closest('.textEditor')) return;
        Editor.normalizeInput(event);
        LessonNoteController.toggleSaveLessonNoteButton(event);
        LessonController.toggleSaveCurriculumSpanNoteButton(event);
        DayNoteController.toggleSaveDayNoteButton(event);
        GlobalNotesController.toggleSaveGlobalNoteButton(event);
    });

    document.addEventListener('selectionchange', (event) => {
        if (event.srcElement.tagName == 'TEXTAREA') return;
        Editor.updateButtonStatus(event)
    });

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

    // global Notes
    // rectangle selection
    document.querySelector('#globalNotesFileContainer').addEventListener('mousedown', (event) => {
        globalItemsMultiSelectData.mouseDown = true;
        globalItemsMultiSelectData.startX = event.clientX;
        globalItemsMultiSelectData.startY = event.clientY;
    })

    document.querySelector('#globalNotesFileContainer').addEventListener('mousemove', (event) => {
        if (globalItemsMultiSelectData.mouseDown) {
            GlobalNotesController.selectMultipleOnMouseDrag(event);
        }
    });

    document.querySelector('#globalNotesFileContainer').addEventListener('mouseup', (event) => {
        globalItemsMultiSelectData.mouseDown = false;
        globalItemsMultiSelectData.startX = null;
        globalItemsMultiSelectData.startY = null;
        globalItemsMultiSelectData.selectables = [];
        globalItemsMultiSelectData.selecatablesPos = {};

        GlobalNotesController.removeSelectionRectangle();
    })

    // context menu
    document.querySelector('#globalNotesFileContainer').addEventListener('contextmenu', (event) => {
        // touch context menus are handled by ios workaround on all plattforms to prevent event duplication
        if (event.pointerType == 'touch') {
            event.preventDefault();

            return;
        }

        // prevents unwanted rectangle selection on right clicks
        const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true })
        document.querySelector('#globalNotesFileContainer').dispatchEvent(mouseUpEvent);

        GlobalNotesController.rightClickHandler(event);
    })

    //iOS/iPad OS touch workaround
    document.querySelector('#globalNotesFileContainer').addEventListener('touchstart', (event) => {
        contextMenuEvent.touchstartTimeOutId = setTimeout(() => {
            contextMenuEvent.contextMenuOpened = true;
            contextMenuEvent.touchStartX = event.touches[0].clientX;
            contextMenuEvent.touchStartY = event.touches[0].clientY;
            GlobalNotesController.rightClickHandler(event);

        }, 600);

        // in some cases touchend does not fire and needs to be dispatched manually to prevent unwanted
        // context menu calls
        contextMenuEvent.touchEndFired = false;

        contextMenuEvent.touchEndTimeOutId = setTimeout(() => {
            if (contextMenuEvent.touchEndFired == false) {
                const touchEndEvent = new TouchEvent('touchend', { bubbles: true, cancelable: true })
                document.querySelector('#globalNotesFileContainer').dispatchEvent(touchEndEvent);
            }
        }, 2000)
    })

    document.querySelector('#globalNotesFileContainer').addEventListener('touchmove', (event) => {
        const deltaX = Math.abs(event.touches[0].clientX - contextMenuEvent.touchStartX);
        const deltaY = Math.abs(event.touches[0].clientY - contextMenuEvent.touchStartY);

        if (deltaX >= 10 || deltaY >= 10) {
            clearTimeout(contextMenuEvent.touchstartTimeOutId);
            contextMenuEvent.touchstartTimeOutId = null;
            contextMenuEvent.touchScrolled = true;
        }
    });

    document.querySelector('#globalNotesFileContainer').addEventListener('touchend', (event) => {
        clearTimeout(contextMenuEvent.touchEndTimeOutId);
        contextMenuEvent.touchEndFired = true;
        contextMenuEvent.touchEndTimeOutId = null;

        if (!event.isTrusted) event.preventDefault();

        if (contextMenuEvent.contextMenuOpened) {
            contextMenuEvent.contextMenuOpened = false;
            contextMenuEvent.touchScrolled = false;

            return;
        }

        // if user scrolls during a touch event, no items should be opened or newly selected after the touch ends
        if (contextMenuEvent.touchScrolled) {
            contextMenuEvent.touchScrolled = false;

            return;
        }

        clearTimeout(contextMenuEvent.touchstartTimeOutId);
        contextMenuEvent.touchstartTimeOutId = null;
        contextMenuEvent.touchScrolled = false;

        GlobalNotesController.handleTouchEvents(event);
    });

    AbstractController.renderTopMenu();

    AbstractController.setDateForWeekdays();
    AbstractController.setCalendarWeek();
    AbstractController.setWeekStartAndEndDate();
    AbstractController.setDateOnWeekViewDatePicker();

    await DayNoteController.renderDayNoteIcons();

    await LessonController.renderCurriculaSelection();
    await LessonController.renderSelectedCurricula();
    await LessonView.renderLesson();

    await TaskView.renderTasks();

    await LessonView.showLessonHasTaskIndicator() // <- this has to run, after Tasks are rendered to work

    LoginController.isAuth();
    LoginController.isRegister();
    LoginController.isReset();


}

// ANIMATION FUNCTIONS

export function runWeekSwitchAnimation(nextWeek = true) {
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

export function cancelWeekSwitchAnimation() {
    if (document.querySelector('.blankWeekTable')) {
        document.querySelector('.blankWeekTable').remove();
        document.querySelector('#weekOverviewContainer').style.left = 'auto';
    }
}


startApp();

async function registerWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./worker.js', {
                scope: './'
            });

            if (registration.installing) {
                console.log("Service worker installing");
            } else if (registration.waiting) {
                console.log('Service working awaiting registration');
                AbstractController.showUpdateNotification();
            } else if (registration.active) {
                console.log("Service worker active");
            }
        }
        catch (error) {
            console.error(`Service Worker registration failed with: ${error}`);
        }
    }
}