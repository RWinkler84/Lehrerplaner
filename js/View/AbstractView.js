import Fn from '../inc/utils.js';
import AbstractController from "../Controller/AbstractController.js";
import { runWeekSwitchAnimation, cancelWeekSwitchAnimation, ONEDAY } from '../index.js';

export default class AbstractView {

    static openWeekView() {
        document.querySelector('#openWeekViewButton').classList.add('selected');
        document.querySelector('#openSchoolYearViewButton').classList.remove('selected');
        document.querySelector('#openTimetableViewButton').classList.remove('selected');

        document.querySelector('#weekViewContainer').style.display = 'block';
        document.querySelector('#timetableViewContainer').style.display = 'none';
        document.querySelector('#schoolYearViewContainer').style.display = 'none';
    }

    static openTimetableSettings() {
        document.querySelector('#openWeekViewButton').classList.remove('selected');
        document.querySelector('#openSchoolYearViewButton').classList.remove('selected');
        document.querySelector('#openTimetableViewButton').classList.add('selected');

        document.querySelector('#weekViewContainer').style.display = 'none';
        document.querySelector('#timetableViewContainer').style.display = 'block';
        document.querySelector('#schoolYearViewContainer').style.display = 'none';
    }

    static openSchoolYearSettings() {
        document.querySelector('#openWeekViewButton').classList.remove('selected');
        document.querySelector('#openTimetableViewButton').classList.remove('selected');
        document.querySelector('#openSchoolYearViewButton').classList.add('selected');

        document.querySelector('#weekViewContainer').style.display = 'none';
        document.querySelector('#timetableViewContainer').style.display = 'none';
        document.querySelector('#schoolYearViewContainer').style.display = 'block';
    }

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

    static greyOutHolidaysAndPassedDays(schoolYears) {
        const mondayDate = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
        const sundayDate = document.querySelector('.weekday[data-weekday_number="6"]').dataset.date;

        const holidays = [];

        schoolYears.forEach(schoolYear => holidays.push(...schoolYear.getHolidaysInDateRange(mondayDate, sundayDate)));

        //passed days
        document.querySelectorAll('.weekday').forEach(weekday => {
            weekday.classList.remove('passed');
            weekday.classList.remove('holiday');

            weekday.querySelectorAll('.holidayNameMask').forEach(mask => mask.remove());

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

    static toggleIsCurrentWeekDot() {
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

    // FIDDLING WITH DATE

    static setCalendarWeek(referenceDate = null) {
        referenceDate = referenceDate ? new Date(referenceDate) : new Date();

        let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
        let weekCounter = 1;
        let currentYear = referenceDate.getFullYear();
        let firstThursday = Fn.getFirstThirsdayOfTheYear(currentYear);
        let monday = firstThursday - ONEDAY * 3
        let sunday = firstThursday + ONEDAY * 3;

        referenceDate = referenceDate.setHours(12, 0, 0, 0);

        //checks, if the reference date lies in the current week. if not, tests against the next week
        while (monday < referenceDate && sunday < referenceDate) {
            monday += ONEDAY * 7; // + 7 days
            sunday += ONEDAY * 7; // + 7 days
            weekCounter++;
        }

        //check whether the year changes and reset weekcounter, if so
        calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
    }

    static setDateForWeekdays(referenceDate = null) {
        referenceDate = referenceDate ? new Date(referenceDate) : new Date();

        const curriculaDisplayWeekdays = document.querySelectorAll('.curriculaDisplayWeekday');
        const weekdays = document.querySelectorAll('.weekday');

        let todayUnix = referenceDate.setHours(12, 0, 0, 0);

        //go back to monday of given week
        while (new Date(todayUnix).getDay() != 1) todayUnix -= ONEDAY;

        for (let i = 0; i < weekdays.length; i++) {
            curriculaDisplayWeekdays[i].dataset.date = new Date(todayUnix).toString();
            weekdays[i].dataset.date = new Date(todayUnix).toString();

            todayUnix += ONEDAY;
        }

        this.setDateOnWeekdayLabel();
        AbstractController.greyOutHolidaysAndPassedDays(); //needs to be called via Controller for additional data
        this.setIsTodayDot();
        this.scrollToCurrentDay();
    }

    static setDateOnWeekViewDatePicker() {
        const datePicker = document.querySelector('#weekSwitcherDatePicker');
        const mondayDate = new Date(document.querySelector('.weekday[data-weekday_number="1"]')?.dataset.date).setHours(12, 0, 0, 0);
        const sundayDate = new Date(document.querySelector('.weekday[data-weekday_number="0"]')?.dataset.date).setHours(12, 0, 0, 0);
        const today = new Date().setHours(12, 0, 0, 0);

        let selectedDate;

        if (mondayDate <= today && today <= sundayDate) {
            selectedDate = Fn.formatDateSqlCompatible(today);
        } else {
            selectedDate = Fn.formatDateSqlCompatible(mondayDate);
        }

        datePicker.value = selectedDate;
    }

    static getDateFromWeekViewPicker() {
        return document.querySelector('#weekSwitcherDatePicker').value;
    }

    static setWeekStartAndEndDate() {
        let startDateSpan = document.querySelector('#weekStartDate');
        let endDateSpan = document.querySelector('#weekEndDate');
        let mondayDate = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
        let sundayDate = document.querySelector('.weekday[data-weekday_number="0"]').dataset.date;

        mondayDate = new Date(mondayDate);
        sundayDate = new Date(sundayDate);

        startDateSpan.innerText = Fn.formatDate(mondayDate);
        endDateSpan.innerText = Fn.formatDate(sundayDate);
    }

    static switchToPreviousWeek() {

        cancelWeekSwitchAnimation(); //necessary to prevent animation from bugging out, if week is switched multipe times fast
        runWeekSwitchAnimation(false)

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

        this.setDateOnWeekdayLabel();
        AbstractController.greyOutHolidaysAndPassedDays(); //needs to be called via Controller for additional data
        this.toggleIsCurrentWeekDot();
        this.setWeekStartAndEndDate();
        this.calcCalendarWeek(false);
        this.setIsTodayDot();
        this.scrollToCurrentDay();
        this.setDateOnWeekViewDatePicker();
    }

    static switchToNextWeek() {

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

        this.setDateOnWeekdayLabel();
        AbstractController.greyOutHolidaysAndPassedDays(); //needs to be called via Controller for additional data
        this.toggleIsCurrentWeekDot();
        this.setWeekStartAndEndDate();
        this.calcCalendarWeek(true);
        this.setIsTodayDot();
        this.scrollToCurrentDay();
        this.setDateOnWeekViewDatePicker();
    }

    static calcCalendarWeek(countUp = true) {
        let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
        let weekCounter = document.querySelector('#calendarWeekCounter').innerText;

        let mondayDate = new Date(document.querySelector('.weekday[data-weekday_number="1"]').dataset.date);

        let weeksPerYear = Fn.getNumberOfWeeksPerYear(mondayDate.getFullYear());

        countUp ? weekCounter++ : weekCounter--;

        if (weekCounter < 1) weekCounter = weeksPerYear;
        if (weekCounter > weeksPerYear) weekCounter = 1;

        calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
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

    static showWeekViewDateSelector() {
        const dateDisplay = document.querySelector('#currentWeekDateSpanWrapper');
        const datePickerWrapper = document.querySelector('#weekSwitcherDatePickerWrapper');

        datePickerWrapper.classList.remove('notDisplayed');
        dateDisplay.classList.add('notDisplayed');
    }

    static hideWeekViewDateSelector() {
        const dateDisplay = document.querySelector('#currentWeekDateSpanWrapper');
        const datePickerWrapper = document.querySelector('#weekSwitcherDatePickerWrapper');

        dateDisplay.classList.remove('notDisplayed');
        datePickerWrapper.classList.add('notDisplayed');

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

    static showUpdateNotification() {
        document.querySelector('#updateNotifcation').classList.remove('notDisplayed');
    }

    static openPlusExpirationDialog(daysLeft) {
        const dialog = document.querySelector('#plusExpirationDialog');
        const daysLeftSpan = dialog.querySelector('#plusDaysRemainingSpan');
        const daysLeftString = {
            0: 'heute',
            1: 'in einem Tag',
            7: 'in sieben Tagen'
        }

        if (daysLeft == -1) {
            dialog.querySelector('h3').textContent = 'Eduplanio Plus abgelaufen'
            dialog.querySelector('.dialogText').innerHTML = `
                <p>Deine Eduplanio Plus-Lizenz ist <strong>abgelaufen</strong>.</p>
                <p>Du kannst Eduplanio weiter verwenden, musst aber auf die Cloud-Backups und auf die Synchronisation zwischen mehreren Geräten verzichten. 
                Deine Lizenz kannst du in den Kontoeinstellungen verlängern.</p>
            `;
            dialog.showModal();

            return;
        }

        daysLeftSpan.textContent = daysLeftString[daysLeft];

        dialog.showModal();
    }

    static closePlusExpirationDialog() {
        const dialog = document.querySelector('#plusExpirationDialog').close();
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

    static openWelcomeDialog() {
        document.querySelector('#welcomeDialog').showModal();
    }

    static closeWelcomeDialog() {
        document.querySelector('#welcomeDialog').close();
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

    static getCurrentlyOpenedView() {
        if (document.querySelector('#weekViewContainer').style.display == 'block') return 'weekOverview';
        if (document.querySelector('#timetableViewContainer').style.display == 'block') return 'timetableOverview';
        if (document.querySelector('#schoolYearViewContainer').style.display == 'block') return 'yearOverview';
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