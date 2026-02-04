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
        });
    }
    static async greyOutHolidaysAndPassedDays(schoolYears) {
        const mondayDate = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
        const sundayDate = document.querySelector('.weekday[data-weekday_number="6"]').dataset.date;

        const holidays = [];
        
        schoolYears.forEach(schoolYear => holidays.push(...schoolYear.getHolidaysInDateRange(mondayDate, sundayDate)));

        //passed days
        document.querySelectorAll('.weekday').forEach(weekday => {
            weekday.classList.remove('passed');
            weekday.classList.remove('holiday');

            weekday.querySelector('.holidayNameMask')?.remove();

            if (new Date(weekday.dataset.date).setHours(12, 0, 0, 0) < new Date().setHours(12, 0, 0, 0)) weekday.classList.add('passed');
        })

        //holidays and weekends
        document.querySelectorAll('.weekday').forEach(weekday => {
            if (weekday.dataset.weekday_number == '6' || weekday.dataset.weekday_number == '0') weekday.classList.add('holiday');

            holidays.forEach(holiday => {
                const weekdayTimestamp = new Date(weekday.dataset.date).setHours(12, 0, 0, 0);
                const holidayStartTstmp = new Date(holiday.startDate).setHours(12, 0, 0, 0);
                const holidayEndTstmp = new Date(holiday.endDate).setHours(12, 0, 0, 0);

                if (weekdayTimestamp >= holidayStartTstmp && weekdayTimestamp <= holidayEndTstmp) {
                    const holidayNameContainer = document.createElement('div');

                    holidayNameContainer.classList.add('holidayNameMask');
                    holidayNameContainer.textContent = holiday.name;

                    weekday.classList.add('holiday');

                    if (weekday.dataset.weekday_number != '0' && weekday.dataset.weekday_number != '6') {
                        weekday.insertBefore(holidayNameContainer, weekday.firstElementChild);
                    }
                }
            })
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
        let loginButton = document.querySelector('#openLoginButton');
        let logoutButton = document.querySelector('#logoutButton');
        let createAccountButton = document.querySelector('#createAccountButton');
        let openSettingsButton = document.querySelector('#openSettingsButton');
        let openSupportDialogButton = document.querySelector('#openSupportDialogButton');

        openSettingsButton.removeAttribute('style');
        loginButton.style.display = 'none';
        logoutButton.style.display = 'none';
        createAccountButton.style.display = 'none';
        openSupportDialogButton.style.display = 'none';

        //set the syncIndicator to unsynced, if activeUntil is expired
        console.log(userInfo);

        if (new Date().setHours(12,0,0,0) > new Date(userInfo.activeUntil).setHours(12,0,0,0)) AbstractController.setSyncIndicatorStatus('unsynced');

        if ((userInfo.accountType == 'registeredUser' && !userInfo.loggedIn)) {
            loginButton.removeAttribute('style');
            openSupportDialogButton.removeAttribute('style');
            return;
        }

        if (userInfo.accountType == 'guestUser') {
            createAccountButton.removeAttribute('style');
            loginButton.removeAttribute('style');
            openSupportDialogButton.removeAttribute('style');
            return;
        }

        if (userInfo.accountType == 'registeredUser' && userInfo.loggedIn) {
            logoutButton.removeAttribute('style');
            openSupportDialogButton.removeAttribute('style');
            return;
        }

        if (userInfo.accountType == 'not set') {
            openSettingsButton.style.display = 'none';
            createAccountButton.removeAttribute('style');
            loginButton.removeAttribute('style');
            return;
        }
    }

    static toggleTopMenu(event) {
        event.stopPropagation();
        let topMenuElement = document.querySelector('#topMenu');

        if (topMenuElement.style.display == 'flex') {
            this.closeTopMenu(event);
            return;
        }

        topMenuElement.style.display = 'flex';
        document.addEventListener('click', AbstractView.closeTopMenu);
    }

    static closeTopMenu(event) {
        if (event.target.id != 'topMenu') {
            document.querySelector('#topMenu').removeAttribute('style');
            document.removeEventListener('click', AbstractView.closeTopMenu);
        }
    }

    static setIsTodayDot() {
        let weekdays = document.querySelectorAll('.weekday');
        let today = new Date().setHours(12, 0, 0, 0);

        weekdays.forEach((weekday) => {
            let weekdayDate = new Date(weekday.dataset.date).setHours(12, 0, 0, 0);
            if (weekdayDate != today) {
                weekday.querySelector('.isTodayDot').style.display = 'none';
                return;
            }

            weekday.querySelector('.isTodayDot').style.display = 'inline-block';
        });
    }

    static scrollToCurrentDay() {
        if (window.innerWidth <= 620) {
            const timetable = document.querySelector('#weekOverviewContainer');
            const timeslotLabelWidth = document.querySelector('#timeslots').getBoundingClientRect().width;
            const offset = '14'; //padding 16px - border width

            let weekdays = document.querySelectorAll('.weekday');
            let weekdayProps;
            let today = new Date().setHours(12, 0, 0, 0);

            //go for monday of the displayed week
            weekdayProps = weekdays[0].getBoundingClientRect();
            timetable.scrollTo({
                top: weekdayProps.y,
                left: weekdayProps.x - timeslotLabelWidth - offset,
                // behavior: 'smooth'
            });

            //find today, if it lies in the currently displayed week, after the week switch animation is finished
            setTimeout(() => {
                let match = false //on week switches the timetable gets duplicated, to ensure the scrolling scrolls to the right element, it must only run once

                weekdays.forEach((weekday) => {
                    if (match) return;
                    let weekdayDate = new Date(weekday.dataset.date).setHours(12, 0, 0, 0);
                    if (weekdayDate != today) return;

                    weekdayProps = weekday.getBoundingClientRect();
                    match = true;
                    timetable.scrollTo({
                        top: weekdayProps.y,
                        left: weekdayProps.x - timeslotLabelWidth - offset,
                        behavior: 'smooth'

                    });

                    return;
                });
            }, 350);
        }
    }

    static setSyncIndicatorStatus(status, errorMessage = null) {
        let syncIndicator = document.querySelector('#syncIndicator');
        let tooltipText = syncIndicator.querySelector('span');

        syncIndicator.removeAttribute('class');

        switch (status) {
            case 'synced':
                syncIndicator.classList.add('synced');
                tooltipText.textContent = 'Die Verbindung zum Server ist her-gestellt. Deine Daten werden gesichert.'
                break;
            case 'unsynced':
                syncIndicator.classList.add('unsynced');
                let infoText = 'Deine Daten werden nur lokal gespeichert. Verbinde dein Gerät mit dem Internet und melde dich an, um Datenverlust zu vermeiden.';
                
                if (errorMessage == 'Plus licence expired') infoText = 'Es sieht so aus als wäre deine Plus-Lizenz abgelaufen. Deine Daten werden nur lokal gespeichert. Erneuere die Lizenz, um Datenverlust sicher zu vermeiden.'
                
                tooltipText.textContent = infoText;
                break;
        }
    }

    static openSupportDialog() {
        let dialog = document.querySelector('#supportDialog');
        dialog.showModal();
    }

    static closeSupportDialog() {
        let dialog = document.querySelector('#supportDialog');

        dialog.querySelector('#supportTicketUserEmail').value = '';
        dialog.querySelector('#supportTicketTopic').value = '';
        dialog.querySelector('#supportTicketContent').value = '';
        dialog.querySelector('#supportTicketAnswer').value = '';

        this.toggleSupportDialogButtons('close');

        dialog.close();
    }

    static getSupportTicketContentFromForm() {
        let dialog = document.querySelector('#supportDialog');

        return {
            userEmail: dialog.querySelector('#supportTicketUserEmail').value,
            ticketTopic: dialog.querySelector('#supportTicketTopic').value,
            ticketContent: dialog.querySelector('#supportTicketContent').value,
            captchaAnswer: dialog.querySelector('#supportTicketAnswer').value,
            appVersion: document.querySelector('#versionDisplay').textContent
        }
    }

    static toggleSupportDialogButtons(status) {
        let submitButton = document.querySelector('#sendSupportTicketButton');
        let closeButton = document.querySelector('#closeSupportDialogButton');

        switch (status) {
            case 'sending':
                submitButton.style.display = 'none';
                break;

            case 'success':
                closeButton.style.display = 'block'
                break;

            case 'failed':
                submitButton.style.display = 'block';
                break;

            case 'close':
                submitButton.style.display = 'block';
                closeButton.style.display = 'none';
                break;
        }
    }

    static displayMessageOnSupportDialog(result) {
        let errorMessageDisplay = document.querySelector('#supportTicketErrorMessageDisplay');

        if (result.status == 'success') {
            errorMessageDisplay.textContent = result.message;
            errorMessageDisplay.style.color = 'var(--matteGreen)';
        }

        if (result.status == 'failed') {
            errorMessageDisplay.textContent = result.message;
            if (errorMessageDisplay.hasAttribute('style')) errorMessageDisplay.removeAttribute('style');
        }
    }

    //support ticket alerts

    static alertSupportTicketUserEmail(message = null) {
        let alertRing = document.querySelector('#supportTicketUserEmail').parentElement;
        let errorMessageDisplay = document.querySelector('#supportTicketErrorMessageDisplay');

        if (message) {
            errorMessageDisplay.textContent = message;
            if (errorMessageDisplay.hasAttribute('style')) errorMessageDisplay.removeAttribute('style');
        } else {
            errorMessageDisplay.textContent = '';
        }

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertSupportTicketTopic() {
        let alertRing = document.querySelector('#supportTicketTopic').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertSupportTicketContent() {
        let alertRing = document.querySelector('#supportTicketContent').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertSupportTicketCaptcha() {
        let alertRing = document.querySelector('#supportTicketAnswer').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}