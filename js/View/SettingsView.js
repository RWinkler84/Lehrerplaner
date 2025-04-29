import Controller from "../Controller/SettingsController.js";
import AbstractView from "./AbstractView.js";
import Fn from "../inc/utils.js";

export default class SettingsView {

    static renderSelectableLessonColors() {
        let allColorsArray = [
            'subjectColorOne',
            'subjectColorTwo',
            'subjectColorThree',
            'subjectColorFour',
            'subjectColorFive',
        ];

        let selectionContainer = document.querySelector('#colourSelection');
        let selectableColorsHTML = '';
        let allSubjects = Controller.getAllSubjects();

        allSubjects.forEach(entry => {
            let i = allColorsArray.indexOf(entry.colorCssClass);
            allColorsArray.splice(i, 1);
        })

        allColorsArray.forEach(color => {
            selectableColorsHTML += `<div class="colorSelectionBox ${color}" data-colorClass="${color}"></div>`;
        })

        selectionContainer.innerHTML = selectableColorsHTML;

        SettingsView.#makeColorsSelectable(selectionContainer);
    }

    static #makeColorsSelectable(selectionContainer) {
        selectionContainer.querySelectorAll('.colorSelectionBox').forEach(element => {
            element.addEventListener('click', SettingsView.markColorSelected)
        });

    }

    static markColorSelected(event) {
        document.querySelectorAll('.colorSelectionBox').forEach(element => element.classList.remove('selected'));
        event.target.classList.add('selected')
    }

    static renderExistingSubjects() {
        let subjectsContainer = document.querySelector('#subjectsListContainer');
        let allSubjects = Controller.getAllSubjects();
        let subjectsHTML = '';

        allSubjects.forEach(entry => {
            subjectsHTML += `
                <div class="subjectListItem ${entry.colorCssClass} flex spaceBetween" data-id="${entry.id}">
                ${entry.subject}
                <button class="deleteSubjectButton" style="width: 1.5rem">&#215;</button>
                </div>
            `;
        });

        if (allSubjects.length == 0) {
            subjectsHTML = 'Keine Fächer gefunden.'
        }

        subjectsContainer.innerHTML = subjectsHTML;

        subjectsContainer.querySelectorAll('.deleteSubjectButton').forEach(element => element.addEventListener('click', SettingsView.deleteSubject));

    }

    static deleteSubject(event) {
        let subjectId = event.target.closest('.subjectListItem').dataset.id;

        Controller.deleteSubject(subjectId);
    }

    static saveSubject() {

        let colorCssClass = document.querySelector('.colorSelectionBox.selected')
            ? document.querySelector('.colorSelectionBox.selected').dataset.colorclass
            : undefined;

        let subject = {
            'subject': document.querySelector('#subjectName').value,
            'colorCssClass': colorCssClass
        };

        Controller.saveSubject(subject);

        document.querySelector('#subjectName').value = '';

    }

    static setDateOfTimetableToDisplay() {
        let regularLessons = Controller.getScheduledLessons();
        let validFromElement = document.querySelector('#validFrom');
        let allValidDates = [];
        let date;

        regularLessons.forEach(lesson => {
            if (!allValidDates.includes(new Date(lesson.validFrom).setHours(12, 0, 0, 0))) allValidDates.push(new Date(lesson.validFrom).setHours(12, 0, 0, 0));
            lesson.validFrom = new Date(lesson.validFrom).setHours(12, 0, 0, 0);
        })

        date = allValidDates.length > 0 ? new Date(allValidDates[allValidDates.length - 1]) : undefined;


        validFromElement.innerText = date != undefined ? Fn.formatDateWithFullYear(date) : 'keine Daten';
        validFromElement.dataset.date = date;

        //hide timetable changing buttons, if necessary
        document.querySelector('#timetableForwardButton').style.visibility = 'hidden';
        if (allValidDates.length <= 1) document.querySelector('#timetableBackwardButton').style.visibility = 'hidden';

        //hide edit timetable button, if there is not yet a timetable
        if (date == undefined) document.querySelector('#editTimetableButton').style.display = 'none';
    }

    static renderLessons() {

        let regularLessons = Controller.getScheduledLessons();
        let validFromElement = document.querySelector('#validFrom');
        let timetableValidDates = [];
        let dateOfTimetableToDisplay = new Date(validFromElement.dataset.date).setHours(12, 0, 0, 0);

        //get the all validity dates
        regularLessons.forEach(lesson => {
            if (!timetableValidDates.includes(new Date(lesson.validFrom).setHours(12, 0, 0, 0))) timetableValidDates.push(new Date(lesson.validFrom).setHours(12, 0, 0, 0));
            lesson.validFrom = new Date(lesson.validFrom).setHours(12, 0, 0, 0);
        })

        //clean the timetable
        document.querySelectorAll('.settingsTimeslot').forEach((element) => {
            element.innerHTML = '';
        });

        // now render the lessons with the correct validity date
        regularLessons.forEach((lesson) => {

            if (lesson.validFrom != dateOfTimetableToDisplay) return;

            let timeslot = SettingsView.#getTimeslotOfLesson(lesson);

            timeslot.innerHTML = `
                <div class="settingsLesson ${lesson.cssColorClass}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}">
                     <div class="flex spaceBetween" style="width: 100%;">
                        <div style="width: 1.5rem;"></div>
                        <div>${lesson.class} ${lesson.subject}</div>
                        <button class="deleteLessonButton" style="width: 1.5rem; visibility: hidden;">&#215;</button>
                    </div> 
                </div>`;

            timeslot.querySelector('.deleteLessonButton').addEventListener('click', SettingsView.deleteLesson);
        });

    }

    static createLessonForm(event) {

        let timeslotElement = event.target.closest('.settingsTimeslot');

        let timeslotProps = timeslotElement.getBoundingClientRect()
        let timetableProps = document.querySelector('.settingsWeekOverview').getBoundingClientRect();
        let subjectSelectHTML = AbstractView.getSubjectSelectHTML()

        let lessonFormHTML = `
                <form id="lessonForm">
                    <div class="lessonForm">
                        <input type="text" name="class" id="class" placeholder="Klasse" style="width: 4rem;" required>
                        ${subjectSelectHTML}
                        <button type="submit" class="saveNewLessonButton" style="margin-right: 0px">&#x2714;</button>
                        <button class="discardNewLessonButton">&#x2718;</button>
                    </div>
                </form>
            `;

        timeslotElement.innerHTML = lessonFormHTML;
        let lessonForm = timeslotElement.querySelector('.lessonForm');
        let lessonFormProps = lessonForm.getBoundingClientRect()

        if (lessonFormProps.right > timetableProps.right) {
            let offset = lessonFormProps.width - timeslotProps.width;
            lessonForm.style.transform = `translateX(-${offset}px)`;
        }

        //form button event handlers

        timeslotElement.querySelector('#lessonForm').addEventListener('submit', SettingsView.createNewLesson);

        timeslotElement.querySelector('.discardNewLessonButton').addEventListener('click', (event) => SettingsView.removeLessonForm(event));
        timeslotElement.querySelector('.lessonForm').addEventListener('mouseenter', AbstractView.removeAddLessonButton);

        //timeslot event handlers
        timeslotElement.removeEventListener('click', SettingsView.createLessonForm);
        timeslotElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
    }

    static changeDisplayedTimetable(event) {
        let allScheduledLessons = Controller.getScheduledLessons();
        let validFromElement = document.querySelector('#validFrom');
        let allValidDates = [];
        let currentlyDisplayedDate = new Date(validFromElement.dataset.date).setHours(12, 0, 0, 0);
        let i;

        allScheduledLessons.forEach(lesson => {
            if (!allValidDates.includes(new Date(lesson.validFrom).setHours(12, 0, 0, 0))) allValidDates.push(new Date(lesson.validFrom).setHours(12, 0, 0, 0));

            lesson.validFrom = new Date(lesson.validFrom).setHours(12, 0, 0, 0);
        })

        i = allValidDates.indexOf(currentlyDisplayedDate);

        if (event.target.getAttribute('id') == 'timetableBackwardButton') {
            validFromElement.innerText = Fn.formatDateWithFullYear(allValidDates[i - 1]);
            validFromElement.dataset.date = new Date(allValidDates[i - 1]);
        } else {
            validFromElement.innerText = Fn.formatDateWithFullYear(allValidDates[i + 1]);
            validFromElement.dataset.date = new Date(allValidDates[i + 1]);
        }

        //hide the back and forward buttons, if the first or last timetable is displayed 
        document.querySelector('#timetableBackwardButton').style.visibility = 'visible';
        document.querySelector('#timetableForwardButton').style.visibility = 'visible';

        if (allValidDates.at(-1) == new Date(validFromElement.dataset.date).setHours(12, 0, 0, 0)) {
            document.querySelector('#timetableForwardButton').style.visibility = 'hidden';
        }

        if (allValidDates.indexOf(new Date(validFromElement.dataset.date).setHours(12, 0, 0, 0)) == 0) {
            document.querySelector('#timetableBackwardButton').style.visibility = 'hidden';
        }

        SettingsView.renderLessons();
    }

    static removeLessonForm(event) {
        event.stopPropagation();

        let timeslotElement = event.target.closest('.settingsTimeslot');
        let createLessonForm = event.target.closest('#lessonForm');

        createLessonForm.remove();

        timeslotElement.addEventListener('click', SettingsView.createLessonForm);
        timeslotElement.addEventListener('mouseenter', AbstractView.showAddLessonButton);

    }

    static createNewLesson(event) {
        event.preventDefault();

        let timeslotElement = event.target.closest('.settingsTimeslot');

        let lessonData = {
            'weekdayNumber': timeslotElement.closest('.settingsWeekday').dataset.weekday_number,
            'timeslot': timeslotElement.dataset.timeslot,
            'class': timeslotElement.querySelector('#class').value.toLowerCase(),
            'subject': timeslotElement.querySelector('#subject').value,
        }

        let lesson = Controller.getLessonObject(lessonData);

        timeslotElement.innerHTML = `
                <div class="settingsLesson ${lesson.cssColorClass}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}">
                     <div class="flex spaceBetween" style="width: 100%;">
                        <div style="width: 1.5rem;"></div>
                        <div>${lesson.class} ${lesson.subject}</div>
                        <button class="deleteLessonButton" style="width: 1.5rem;">&#215;</button>
                    </div> 
                </div>`;

        timeslotElement.addEventListener('mouseenter', AbstractView.showAddLessonButton);
        timeslotElement.querySelector('.deleteLessonButton').addEventListener('click', SettingsView.deleteLesson);
    }

    static deleteLesson(event) {
        event.stopPropagation();

        let timeslotElement = event.target.closest('.settingsTimeslot');

        event.target.closest('.settingsLesson').remove();

        timeslotElement.addEventListener('mouseenter', AbstractView.showAddLessonButton);
        timeslotElement.addEventListener('click', SettingsView.createLessonForm);
    }

    static saveNewTimetable() {
        let validFrom = document.querySelector('#validFromPicker').value;
        let lessons = [];

        document.querySelectorAll('.settingsTimeslot').forEach(timeslot => {
            if (!Fn.hasLesson(timeslot)) return;

            let lessonData = {
                'validFrom': validFrom,
                'class': timeslot.firstElementChild.dataset.class,
                'subject': timeslot.firstElementChild.dataset.subject,
                'weekdayNumber': timeslot.closest('.settingsWeekday').dataset.weekday_number,
                'timeslot': timeslot.dataset.timeslot
            }

            lessons.push(lessonData);
        });

        Controller.saveNewTimetable(validFrom, lessons);
    }

    static discardNewTimetable() {
        document.querySelectorAll('.settingsTimeslot').forEach((element) => {
            element.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
            element.removeEventListener('click', SettingsView.createLessonForm);
        });

        document.querySelector('#createChangeTimetableButtonContainer').style.display = 'flex';
        document.querySelector('#saveDiscardTimetableButtonContainer').style.display = 'none';
        document.querySelector('#saveDiscardTimetableChangesButtonContainer').style.display = 'none';

        document.querySelector('#validFrom').style.display = 'inline';
        document.querySelector('#validFromPickerWrapper').style.display = 'none';
        document.querySelector('#validFromPickerWrapper').value = '';
        document.querySelector('#timetableBackwardButton').style.visibility = 'visible';
        document.querySelector('#timetableForwardButton').style.visibility = 'visible';
        SettingsView.setDateOfTimetableToDisplay();
        SettingsView.renderLessons();
    }

    static saveTimetableChanges() {
        let validFrom = Fn.formatDateSqlCompatible(document.querySelector('#validFrom').dataset.date);
        let lessons = [];

        document.querySelectorAll('.settingsTimeslot').forEach(timeslot => {
            if (!Fn.hasLesson(timeslot)) return;

            let lessonData = {
                'validFrom': validFrom,
                'class': timeslot.firstElementChild.dataset.class,
                'subject': timeslot.firstElementChild.dataset.subject,
                'weekdayNumber': timeslot.closest('.settingsWeekday').dataset.weekday_number,
                'timeslot': timeslot.dataset.timeslot
            }

            lessons.push(lessonData);
        });

        Controller.saveTimetableChanges(validFrom, lessons);
    }

    static makeTimetableEditable() {

        document.querySelectorAll('.settingsTimeslot').forEach((element) => {
            element.innerHTML = '';
            element.addEventListener('mouseenter', AbstractView.showAddLessonButton);
            element.addEventListener('click', SettingsView.createLessonForm);
        });

        document.querySelector('#validFromPickerWrapper').style.display = 'flex';
        document.querySelector('#validFrom').style.display = 'none';
        document.querySelector('#timetableBackwardButton').style.visibility = 'hidden';
        document.querySelector('#timetableForwardButton').style.visibility = 'hidden';

        document.querySelector('#createChangeTimetableButtonContainer').style.display = 'none';
        document.querySelector('#saveDiscardTimetableButtonContainer').style.display = 'flex';

        if (SettingsView.isAllSubjectsEmpty()) {
            SettingsView.alertTimetable(true);

            document.querySelectorAll('.settingsTimeslot').forEach((element) => {
                element.innerHTML = '';
                element.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
                element.removeEventListener('click', SettingsView.createLessonForm);
            });
            return;
        }
    }

    static makeLessonsEditable() {
        document.querySelectorAll('.settingsTimeslot').forEach((element) => {
            if (Fn.hasLesson(element)) {
                element.querySelector('.deleteLessonButton').style.visibility = 'visible';
                element.addEventListener('mouseenter', AbstractView.showAddLessonButton);

                return;
            }

            document.querySelector('#timetableBackwardButton').style.visibility = 'hidden';
            document.querySelector('#timetableForwardButton').style.visibility = 'hidden';

            element.addEventListener('mouseenter', AbstractView.showAddLessonButton);
            element.addEventListener('click', SettingsView.createLessonForm);
        });

        document.querySelector('#createChangeTimetableButtonContainer').style.display = 'none';
        document.querySelector('#saveDiscardTimetableChangesButtonContainer').style.display = 'flex';
    }

    static isDateTaken() {
        let pickedDate = document.querySelector('#validFromPicker').value;
        let timetables = Controller.getScheduledLessons();

        document.querySelector('#validFromPickerAlertTooltip').style.display = 'none';

        for (let entry of timetables) {
            if (entry.validFrom == pickedDate) {
                SettingsView.alertValidFromPicker(true)
                return true;
            }
        }

        return false;
    }

    static isAllSubjectsEmpty() {
        let allSubjects = Controller.getAllSubjects();

        document.querySelector('#noSubjectsAlertTooltip').style.display = 'none';

        if (allSubjects.length == 0) return true;

        return false;
    }

    static #getTimeslotOfLesson(lesson) {

        let allWeekdays = document.querySelectorAll('.settingsWeekday');
        let weekday;
        let timeslot;

        allWeekdays.forEach((day) => { if (day.dataset.weekday_number == lesson.weekday) weekday = day });
        weekday.querySelectorAll('.settingsTimeslot').forEach((slot) => { if (slot.dataset.timeslot == lesson.timeslot) timeslot = slot });

        return timeslot;
    }

    //validation functions
    static alertColorSelection() {
        let colorSelection = document.querySelector('#colourSelection');

        colorSelection.classList.add('validationError');
        setTimeout(() => {
            colorSelection.classList.remove('validationError');
        }, 300);
    }

    static alertSubjectNameInput() {
        let subjectNameInput = document.querySelector('#subjectName');

        subjectNameInput.parentElement.classList.add('validationError');
        setTimeout(() => {
            subjectNameInput.parentElement.classList.remove('validationError');
        }, 300);
    }

    static alertValidFromPicker(dateTaken = false) {
        let validFromPicker = document.querySelector('#validFromPicker');
        let alertTooltip = document.querySelector('#validFromPickerAlertTooltip');

        if (dateTaken) alertTooltip.style.display = 'flex';

        validFromPicker.parentElement.classList.add('validationError');
        setTimeout(() => {
            validFromPicker.parentElement.classList.remove('validationError');
        }, 300);
    }

    static alertTimetable(noSubjectsFound = false) {
        let timetable = document.querySelector('.settingsWeekOverview.alertRing');

        if (noSubjectsFound == true) {
            document.querySelector('#noSubjectsAlertTooltip').style.display = 'flex';
        }

        timetable.classList.add('validationError');
        setTimeout(() => {
            timetable.classList.remove('validationError');
        }, 300);
    }
}