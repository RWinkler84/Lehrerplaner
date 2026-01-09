import AbstractView from "./AbstractView.js";
import Controller from "../Controller/SchoolYearController.js";
import Fn from "../inc/utils.js";

export default class SchoolYearView extends AbstractView {
    static async renderSchoolYearInfoSection(schoolYear) {

        const infoContainer = document.querySelector('#schoolYearInfoContainer');
        const schoolYearSelect = infoContainer.querySelector('#schoolYearNameSelect');
        const startDateDisplay = infoContainer.querySelector('#schoolYearStartDateDisplay');
        const endDateDisplay = infoContainer.querySelector('#schoolYearEndDateDisplay');
        const holidaysContainer = infoContainer.querySelector('#holidaysContainer');

        while (schoolYearSelect.childElementCount != 0) { schoolYearSelect.firstElementChild.remove(); }
        schoolYearSelect.append(await this.getSchoolYearSelectHTML(schoolYear));

        while (holidaysContainer.childElementCount != 1) { holidaysContainer.lastElementChild.remove(); }
        holidaysContainer.append(this.getHolidayDatesHTML(schoolYear));

        //selected teached grades
        infoContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (schoolYear && schoolYear.grades.includes(checkbox.value)) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        })

        //reset to default, if there is no schoolYear and no schoolYear creation ongoing
        const schoolYearCreationButtons = infoContainer.querySelector('#schoolYearCreationButtonsContainer');
        if (!schoolYear && schoolYearCreationButtons.classList.contains('notDisplayed')) {
            startDateDisplay.textContent = 'Leg ein Schuljahr an,...';
            endDateDisplay.textContent = '...damit hier etwas stehen kann.';

            infoContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {checkbox.disabled = true;})
            this.hideEditSchoolYearDatesGradesButton();
            this.hideSaveSchoolYearDatesGradesButton();
            this.hideCreateHolidayDatesButton();

            return;
        }

        infoContainer.dataset.school_year_id = schoolYear.id;

        startDateDisplay.setAttribute('data-date', schoolYear.startDate);
        endDateDisplay.setAttribute('data-date', schoolYear.endDate);
        startDateDisplay.textContent = Fn.formatDateWithFullYear(schoolYear.startDate);
        endDateDisplay.textContent = Fn.formatDateWithFullYear(schoolYear.endDate);

        //show the right buttons
        if (holidaysContainer.childElementCount == 1) { //one element is always present (label)
            this.showCreateHolidayDatesButton();
            this.hideEditHolidayDatesButton();
            return;
        }

        this.showEditHolidayDatesButton();
        this.enableEditHolidayDatesButton();
        this.showEditSchoolYearDatesGradesButton();
        this.enableEditSchoolYearDatesGradesButton();
        this.showCreateNewSchoolYearButton();

        this.hideCreateHolidayDatesButton();
        this.hideSaveSchoolYearDatesGradesButton();
        this.hideSchoolYearCreationButtonsContainer();
    }

    static async getSchoolYearSelectHTML(preSelectedYear) {
        const allSchoolYears = await Controller.getAllSchoolYears();
        const fragment = document.createDocumentFragment();
        const blankOption = document.createElement('option');

        allSchoolYears.forEach(year => {
            const option = blankOption.cloneNode();
            option.textContent = year.name;
            option.setAttribute('value', year.name);
            option.setAttribute('data-yearid', year.id);
            if (preSelectedYear && year.id == preSelectedYear.id) option.setAttribute('selected', '');

            fragment.append(option);
        });

        if (!fragment.firstElementChild) {
            blankOption.textContent = '-';
            fragment.append(blankOption);
        }

        return fragment;
    }

    static getHolidayDatesHTML(schoolYear) {
        const fragment = document.createDocumentFragment();
        const div = document.createElement('div');

        if (!schoolYear) {
            div.innerHTML = '<div>Hier gibt es noch nichts zu sehen.</div>';
            return div;
        }

        const container = div.cloneNode();

        container.classList.add('singleHolidayContainer');

        schoolYear.holidays.forEach(holiday => {
            const holidayContainer = container.cloneNode();

            if (holiday.startDate.setHours(12) == holiday.endDate.setHours(12)) {
                holidayContainer.innerHTML = `
                    <div class="holidayName">${holiday.name}</div>
                    <div class="holidayDates">
                        <div class="holidayDate">${Fn.formatDateWithFullYear(holiday.startDate)}</div>
                    </div>
                    `;
            } else {
                holidayContainer.innerHTML = `
                    <div class="holidayName">${holiday.name}</div>
                    <div class="holidayDates">
                        <div class="holidayDate">${Fn.formatDateWithFullYear(holiday.startDate)}</div>
                        <div class="holidayDateHyphen">&nbsp;-&nbsp;</div>
                        <div class="holidayDate">${Fn.formatDateWithFullYear(holiday.endDate)}</div>
                    </div>
                    `;
            }
            fragment.append(holidayContainer);
        });

        if (!fragment.firstElementChild) {
            div.innerHTML = '<div>Hier gibt es noch nichts zu sehen.</div>';
            fragment.append(div);
        }

        return fragment;
    }

    static editSchoolYearDates(newYearForm = false) {
        const startDateDisplay = document.querySelector('#schoolYearStartDateDisplay');
        const endDateDisplay = document.querySelector('#schoolYearEndDateDisplay');
        const picker = document.createElement('input');
        const alertRing = document.createElement('div');

        picker.setAttribute('type', 'date');
        alertRing.classList.add('alertRing');

        const startPicker = picker.cloneNode();
        const endPicker = picker.cloneNode();
        const alertStart = alertRing.cloneNode();
        const alertEnd = alertRing.cloneNode();

        startPicker.setAttribute('id', 'yearStartDatePicker');
        endPicker.setAttribute('id', 'yearEndDatePicker');

        if (!newYearForm) {
            endPicker.setAttribute('value', Fn.formatDateSqlCompatible(endDateDisplay.dataset.date));
            startPicker.setAttribute('value', Fn.formatDateSqlCompatible(startDateDisplay.dataset.date));
        }

        while (startDateDisplay.childNodes.length != 0) startDateDisplay.childNodes[0].remove();
        while (endDateDisplay.childNodes.length != 0) endDateDisplay.childNodes[0].remove();

        alertStart.append(startPicker);
        alertEnd.append(endPicker);
        startDateDisplay.append(alertStart);
        endDateDisplay.append(alertEnd);
    }

    static getSchoolYearDatesFromPicker() {
        const infoContainer = document.querySelector('#schoolYearInfoContainer')
        const startPicker = infoContainer.querySelector('#yearStartDatePicker');
        const endPicker = infoContainer.querySelector('#yearEndDatePicker');

        return {
            id: infoContainer.dataset.school_year_id,
            startDate: startPicker.value,
            endDate: endPicker.value
        }
    }

    static getSchoolYearDatesFromDisplay() {
        return {
            startDate: new Date(document.querySelector('#schoolYearStartDateDisplay').dataset.date),
            endDate: new Date(document.querySelector('#schoolYearEndDateDisplay').dataset.date)
        }
    }

    static removeSchoolYearDatePicker() {
        const infoContainer = document.querySelector('#schoolYearInfoContainer')
        const startDateDisplay = infoContainer.querySelector('#schoolYearStartDateDisplay');
        const endDateDisplay = infoContainer.querySelector('#schoolYearEndDateDisplay');
        const startPicker = infoContainer.querySelector('#yearStartDatePicker');
        const endPicker = infoContainer.querySelector('#yearEndDatePicker');

        const startDate = Fn.formatDateWithFullYear(startPicker.value);
        const endDate = Fn.formatDateWithFullYear(endPicker.value);

        startDateDisplay.dataset.date = new Date(startPicker.value);
        startDateDisplay.textContent = startDate;
        endDateDisplay.dataset.date = new Date(endPicker.value);
        endDateDisplay.textContent = endDate;
    }

    static getSelectedYearId() {
        const select = document.querySelector('#schoolYearNameSelect');
        const selectedOptions = select.selectedOptions;

        return selectedOptions[0].dataset.yearid;
    }

    static setDisplayedSchoolYearId(id) {
        document.querySelector('#schoolYearInfoContainer').dataset.school_year_id = id;
    }

    static getDisplayedSchoolYearId() {
        return document.querySelector('#schoolYearInfoContainer').dataset.school_year_id;
    }

    static showNewSchoolYearForm() {
        const infoContainer = document.querySelector('#schoolYearInfoContainer');
        const holidaysContainer = infoContainer.querySelector('#holidaysContainer');
        const div = document.createElement('div');

        infoContainer.dataset.school_year_id = '';

        infoContainer.querySelector('#schoolYearNameSelect').parentElement.classList.add('hidden');
        infoContainer.querySelector('#createHolidayDatesButton').classList.add('hidden');

        this.editSchoolYearDates(true);
        this.editTaughtGrades(true);

        while (holidaysContainer.childElementCount != 1) { holidaysContainer.lastElementChild.remove() };
        div.textContent = 'Hier gibt es noch nichts zu sehen...';
        holidaysContainer.append(div);
    }

    static editTaughtGrades(newYearForm = false) {
        const form = document.querySelector('#gradeSelectionContainer');

        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (newYearForm) checkbox.checked = false;
            checkbox.removeAttribute('disabled');
        });

    }

    static saveTaughtGrades() {
        const form = document.querySelector('#gradeSelectionContainer');
        const taughtGrades = [];

        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked == true) taughtGrades.push(checkbox.value);
            checkbox.setAttribute('disabled', '');
        });

        return taughtGrades;
    }

    static isNewSchoolYear() {
        if (document.querySelector('#createNewSchoolYearButton').classList.contains('notDisplayed')) return true;

        return false;
    }

    //show/enable and hide/disable buttons
    static showEditHolidayDatesButton() {
        document.querySelector('#editHolidayDatesButton').classList.remove('notDisplayed');
    }
    static showCreateHolidayDatesButton() {
        document.querySelector('#createHolidayDatesButton').classList.remove('notDisplayed');
    }
    static showEditSchoolYearDatesGradesButton() {
        document.querySelector('#editSchoolYearDatesGradesButton').classList.remove('notDisplayed');
    }
    static showSaveSchoolYearDatesGradesButton() {
        document.querySelector('#saveSchoolYearDatesGradesButton').classList.remove('notDisplayed');
    }
    static showCreateNewSchoolYearButton() {
        document.querySelector('#createNewSchoolYearButton').classList.remove('notDisplayed');
    }
    static showSchoolYearCreationButtonsContainer() {
        document.querySelector('#schoolYearCreationButtonsContainer').classList.remove('notDisplayed');
    }
    static showSchoolYearSelect() {
        document.querySelector('#schoolYearNameSelect').parentElement.classList.remove('hidden');
    }

    //enable
    static enableSaveNewSchoolYearButton() {
        document.querySelector('#saveNewSchoolYearButton').disabled = false;
    }
    static enableCreateNewSchoolYearButton() {
        document.querySelector('#createNewSchoolYearButton').disabled = false;
    }
    static enableEditSchoolYearDatesGradesButton() {
        document.querySelector('#editSchoolYearDatesGradesButton').disabled = false;
    }
    static enableEditHolidayDatesButton() {
        document.querySelector('#editHolidayDatesButton').disabled = false;
    }
    static enableCreateHolidayDatesButton() {
        document.querySelector('#createHolidayDatesButton').disabled = false;
    }


    //hide
    static hideEditHolidayDatesButton() {
        document.querySelector('#editHolidayDatesButton').classList.add('notDisplayed');
    }
    static hideCreateHolidayDatesButton() {
        document.querySelector('#createHolidayDatesButton').classList.add('notDisplayed');
    }
    static hideEditSchoolYearDatesGradesButton() {
        document.querySelector('#editSchoolYearDatesGradesButton').classList.add('notDisplayed');
    }
    static hideSaveSchoolYearDatesGradesButton() {
        document.querySelector('#saveSchoolYearDatesGradesButton').classList.add('notDisplayed');
    }
    static hideCreateNewSchoolYearButton() {
        document.querySelector('#createNewSchoolYearButton').classList.add('notDisplayed');
    }
    static hideSchoolYearCreationButtonsContainer() {
        document.querySelector('#schoolYearCreationButtonsContainer').classList.add('notDisplayed');
    }

    //disable
    static disableSaveNewSchoolYearButton() {
        document.querySelector('#saveNewSchoolYearButton').disabled = true;
    }
    static disableCreateNewSchoolYearButton() {
        document.querySelector('#createNewSchoolYearButton').disabled = true;
    }
    static disableEditSchoolYearDatesGradesButton() {
        document.querySelector('#editSchoolYearDatesGradesButton').disabled = true;
    }
    static disableEditHolidayDatesButton() {
        document.querySelector('#editHolidayDatesButton').disabled = true;
    }
    static disableCreateHolidayDatesButton() {
        document.querySelector('#createHolidayDatesButton').disabled = true;
    }

    //displayed, but hidden
    static showCreateHolidaysButton() {
        document.querySelector('#createHolidayDatesButton').classList.remove('hidden');
    }
    static showSchoolYearSelect() {
        document.querySelector('#schoolYearNameSelect').parentElement.classList.remove('hidden');
    }
    static hideSchoolYearSelect() {
        document.querySelector('#schoolYearNameSelect').parentElement.classList.add('hidden');
    }

    //validation error
    static alertSchoolYearStartDatePicker() {
        const alertRing = document.querySelector('#yearStartDatePicker').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
    static alertSchoolYearEndDatePicker() {
        const alertRing = document.querySelector('#yearEndDatePicker').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}