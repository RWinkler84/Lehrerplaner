import { allSubjects } from "../index.js";
import Fn from '../inc/utils.js';
import SettingsView from "./SettingsView.js";
import SettingsController from "../Controller/SettingsController.js";
import AbstractController from "../Controller/AbstractController.js";

export default class AbstractView {

    static getSubjectSelectHTML(event = undefined) {
        //make an fetch-query to get all subject the teacher is teaching and create an select with those as options
        //for now it is static and stored in the global const allSubjects
        let optionsHTML = '<option value="">-</option>';

        allSubjects.forEach((entry) => {
            optionsHTML += `<option value="${entry.subject}">${entry.subject}</option>`;
        });

        optionsHTML += '<option value="Termin">Termin</option>';

        return `<select class="lessonSelect" id="subject">${optionsHTML}</select>`;
    }

    static showAddLessonButton(event) {

        let weekdayElement = event.target.closest('.weekday')
            ? event.target.closest('.weekday')
            : event.target.closest('.settingsWeekday');

        let timeslot = event.target.dataset.timeslot;
        let date = event.target.parentElement.dataset.date;

        AbstractView.removeAddLessonButton();

        if (Fn.hasLesson(event.target)) return;
        if (weekdayElement.classList.contains('passed')) return;

        event.target.innerHTML = `<div class="addLessonButtonWrapper" data-timeslot="${timeslot}" data-date="${date}"><div class="addLessonButton">+</div></div>`;

    }

    static removeAddLessonButton() {

        document.querySelectorAll('.timeslot').forEach((timeslot) => {
            if (timeslot.querySelector('.addLessonButtonWrapper')) {
                timeslot.querySelector('.addLessonButtonWrapper').remove();
            }
        });

        document.querySelectorAll('.settingsTimeslot').forEach((timeslot) => {
            if (timeslot.querySelector('.addLessonButtonWrapper')) {
                timeslot.querySelector('.addLessonButtonWrapper').remove();
            }
        });
    }

    static highlightTask(event) {

        let taskContainer = document.querySelector('#taskContainer')

        taskContainer.querySelectorAll('tr[data-date]').forEach((taskRow) => {

            if (new Date(taskRow.dataset.date).setHours(12, 0, 0, 0) != new Date(event.target.dataset.date).setHours(12, 0, 0, 0)) return;
            if (taskRow.querySelector('td[data-class]').dataset.class != event.target.dataset.class) return;
            if (taskRow.querySelector('td[data-subject').dataset.subject != event.target.dataset.subject) return;
            if (taskRow.dataset.timeslot != event.target.closest('.timeslot').dataset.timeslot) return;


            taskRow.style.backgroundColor = 'var(--lightergrey)';
            taskRow.nextElementSibling.style.backgroundColor = 'var(--lightergrey)';
            taskRow.nextElementSibling.nextElementSibling.style.backgroundColor = 'var(--lightergrey)';
        });

        AbstractView.removeAddLessonButton();
    }

    static removeTaskHighlight(event) {

        let taskContainer = document.querySelector('#taskContainer')

        taskContainer.querySelectorAll('tr[data-date]').forEach((taskRow) => {
            if (new Date(taskRow.dataset.date).setHours(12, 0, 0, 0) != new Date(event.target.dataset.date).setHours(12, 0, 0, 0)) return;
            if (taskRow.querySelector('td[data-class]').dataset.class != event.target.dataset.class) return;
            if (taskRow.querySelector('td[data-subject').dataset.subject != event.target.dataset.subject) return;

            taskRow.removeAttribute('style');

            if (taskRow.nextElementSibling.hasAttribute('data-new')) return;
            taskRow.nextElementSibling.style.backgroundColor = 'var(--contentContainerBackground)';
            taskRow.nextElementSibling.nextElementSibling.style.backgroundColor = 'var(--contentContainerBackground)';

        });
    }
    static greyOutPassedDays() {
        document.querySelectorAll('.weekday').forEach(weekday => {
            weekday.classList.remove('passed');
            if (new Date(weekday.dataset.date).setHours(12, 0, 0, 0) < new Date().setHours(12, 0, 0, 0)) weekday.classList.add('passed');
        })
    }

    static setDateOnWeekdayLabel() {
        document.querySelectorAll('.weekday').forEach(weekday => {
            let dateOfWeekday = new Date(weekday.dataset.date).setHours(12, 0, 0, 0);
            weekday.querySelector('.smallDate').innerText = Fn.formatDate(dateOfWeekday);
        })
    }

    static toogleIsCurrentWeekDot() {
        let today = new Date();
        let mondayOfDisplayedWeek = document.querySelector('.weekday[data-weekday_number="1"').dataset.date;
        let sundayOfDisplayedWeek = document.querySelector('.weekday[data-weekday_number="0"').dataset.date;

        if (Fn.isDateInWeek(today, mondayOfDisplayedWeek, sundayOfDisplayedWeek)) {
            document.querySelector('#isCurrentWeekDot').style.display = "block";
            return;
        }

        document.querySelector('#isCurrentWeekDot').style.display = "none";
    }

    static openSettings() {
        document.querySelector('#settingsContainer').style.display = 'block';
        document.querySelector('main').style.filter = 'blur(3px)';
        document.querySelector('nav').style.filter = 'blur(3px)';
    }

    static closeSettings() {
        document.querySelector('#settingsContainer').style.display = 'none';
        document.querySelector('main').style.removeProperty('filter');
        document.querySelector('nav').style.removeProperty('filter');

    }

    static openLoginDialog() {
        AbstractController.closeSendResetPasswordMailDialog();
        let loginDialog = document.querySelector('#loginDialog');
        loginDialog.setAttribute('open', '');
    }

    static closeLoginDialog() {
        let loginDialog = document.querySelector('#loginDialog');

        loginDialog.removeAttribute('open');
        loginDialog.querySelector('#userEmail').value = '';
        loginDialog.querySelector('#password').value = '';
        loginDialog.querySelector('#loginErrorMessageDisplay').innerText = 'Du wurdest wegen Inaktivität ausgeloggt. Melde dich erneut an, um Datenverlust zu vermeiden.';
    }

    static openSendResetPasswordMailDialog(event) {
        event.preventDefault();
        AbstractController.closeLoginDialog();

        let sendResetPasswordMailDialog = document.querySelector('#sendResetPasswordMailDialog');

        document.querySelector('#loginDialog').removeAttribute('open');

        sendResetPasswordMailDialog.setAttribute('open', '');
        sendResetPasswordMailErrorMessageDisplay.style.color = 'var(--matteRed)';
        sendResetPasswordMailErrorMessageDisplay.innerText = '';

        sendResetPasswordMailDialog.querySelector('.backToLoginLink').addEventListener('click', AbstractController.openLoginDialog);
    }

    static closeSendResetPasswordMailDialog() {
        let dialog = document.querySelector('#sendResetPasswordMailDialog');

        dialog.querySelector('#resetPasswordMail').value = '';
        dialog.removeAttribute('open');
    }

    static attemptLogin(event) {
        event.preventDefault();
        let controller = new AbstractController;
        let loginDialog = document.querySelector('#loginDialog');

        let loginData = {
            'userEmail': loginDialog.querySelector('#userEmail').value,
            'password': loginDialog.querySelector('#password').value
        }

        controller.attemptLogin(loginData);
    }

    static showLoginErrorMessage(message) {
        let loginErrorDisplay = document.querySelector('#loginErrorMessageDisplay');

        loginErrorDisplay.style.color = 'var(--matteRed)';
        loginErrorDisplay.innerText = message;
        loginErrorDisplay.innerHTML += '<p><a href="" id="sendResetPasswordMail" style="text-decoration: none;">Passwort vergessen?</a></p>';
        loginErrorDisplay.querySelector('#sendResetPasswordMail').addEventListener('click', AbstractView.openSendResetPasswordMailDialog);
    }

    static settingsClickEventHandler(event) {
        let target = event.target.id;

        switch (target) {
            //top menu
            case 'openTimetableSettingsButton':
                SettingsView.openTimetableSettings();
                break;

            case 'openAccountSettingsButton':
                SettingsView.openAccountSettings();
                break;

            //timetable settings
            case 'createSubjectButton':
                SettingsView.saveSubject();
                break;

            case 'timetableBackwardButton':
                SettingsView.changeDisplayedTimetable(event);
                break;

            case 'timetableForwardButton':
                SettingsView.changeDisplayedTimetable(event);
                break;

            case 'createNewTimetableButton':
                SettingsView.makeTimetableEditable();
                break;

            case 'saveNewTimetableButton':
                SettingsView.saveNewTimetable();
                break;

            case 'discardNewTimetableButton':
                SettingsView.discardNewTimetable();
                break;

            case 'editTimetableButton':
                SettingsView.makeLessonsEditable();
                break;

            case 'saveTimetableChangesButton':
                SettingsView.saveTimetableChanges();
                break;

            case 'discardTimetableChangesButton':
                SettingsView.discardNewTimetable();
                break;

            //account settings
            case 'deleteAccountButton':
                SettingsView.toogleAccountDeletionMenu(event);
                break;

            case 'approveAccountDeletionButton':
                SettingsController.deleteAccount();

            case 'cancelAccountDeletionButton':
                SettingsView.toogleAccountDeletionMenu(event);
                break;

            case 'cancelFailedAccountDeletionButton':
                SettingsView.toogleAccountDeletionMenu(event);
                break;
        }
    }

    //form validation errors
    static alertLoginDialogEmailInput() {
        let alertRing = document.querySelector('#userEmail').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertLoginDialogPasswordInput() {
        let alertRing = document.querySelector('#password').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertSendAccountResetMailInput() {
        let alertRing = document.querySelector('#resetPasswordMail').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}