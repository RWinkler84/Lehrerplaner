import Fn from '../inc/utils.js';
import AbstractController from "../Controller/AbstractController.js";

export default class AbstractView {

    static async getSubjectSelectHTML(event = undefined) {
        let allSubjects = await AbstractController.getAllSubjects();
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

        if (Fn.isDateInTimespan(today, mondayOfDisplayedWeek, sundayOfDisplayedWeek)) {
            document.querySelector('#isCurrentWeekDot').style.display = "block";
            return;
        }

        document.querySelector('#isCurrentWeekDot').style.display = "none";
    }

    static async renderTopMenu(userInfo) {
        let loginButton = document.querySelector('#loginButton');
        let logoutButton = document.querySelector('#logoutButton');
        let createAccountButton = document.querySelector('#createAccountButton');
        let openSettingsButton = document.querySelector('#openSettingsButton');

        console.log(userInfo)

        openSettingsButton.removeAttribute('style');
        loginButton.style.display = 'none';
        logoutButton.style.display = 'none';
        createAccountButton.style.display = 'none';

        if ((userInfo.accountType == 'registeredUser' && !userInfo.loggedIn) || userInfo.accountType == 'guestUser') {
            createAccountButton.removeAttribute('style');
            loginButton.removeAttribute('style');
            return;
        }

        if (userInfo.accountType == 'registeredUser' && userInfo.loggedIn) {
            logoutButton.removeAttribute('style');
            return; 
        }

        if (userInfo.accountType == 'not set') {
            openSettingsButton.style.display = 'none';
            createAccountButton.removeAttribute('style');
            loginButton.removeAttribute('style');
            return;
        }
    }

    static openTopMenu(event) {
        event.stopPropagation();

        document.querySelector('#topMenu').style.display = 'flex';

        document.addEventListener('click', AbstractView.closeTopMenu);
    }

    static closeTopMenu(event) {
        if (event.target.id != 'topMenu') {
            document.querySelector('#topMenu').removeAttribute('style');
            document.removeEventListener('click', AbstractView.closeTopMenu);
        }
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

    static setSyncIndicatorStatus(status) {
        let syncIndicator = document.querySelector('#syncIndicator');

        syncIndicator.removeAttribute('class');

        switch (status) {
            case 'synced':
                syncIndicator.classList.add('synced');
                break;
            case 'unsynced':
                syncIndicator.classList.add('unsynced');
                break;
        }
    }
}