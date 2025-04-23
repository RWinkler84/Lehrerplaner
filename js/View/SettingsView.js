import { allSubjects, standardTimetable } from "../index.js";
import Controller from "../Controller/SettingsController.js";
import AbstractView from "./AbstractView.js";

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
        let subjectsHTML = '';

        allSubjects.forEach(entry => {
            subjectsHTML += `
                <div class="subjectListItem ${entry.colorCssClass} flex spaceBetween" data-id="${entry.id}">
                ${entry.subject}
                <button class="deleteSubjectButton" style="width: 1.5rem">&#215;</button>
                </div>
            `;
        });

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

    static renderLessons() {

        let regularLessons = Controller.getScheduledLessons();

        let timetableValidDates = [];
        let dateOfTimetableCurrentlyDisplayed = document.querySelector('#validFrom').innerText;
        let dateOfTimetableToDisplay;

        //get the all validity dates
        regularLessons.forEach(lesson => {
            if (!timetableValidDates.includes(lesson.validFrom)) timetableValidDates.push(lesson.validFrom);
        })

        console.log(standardTimetable);
        console.log(timetableValidDates)
        //get the validity date of the currently displayed timetable
        if (dateOfTimetableCurrentlyDisplayed == 'aktueller Plan') {
            dateOfTimetableToDisplay = timetableValidDates[timetableValidDates.length - 1];
        } else {
            dateOfTimetableToDisplay = timetableValidDates[timetableValidDates.length - 1];
        }

// aktuelle und vergangene Pläne sollen angezeigt werden können. Aktuell geht es darum, herauszufinden, welcher Plan aktuell angezeigt werden muss,
// abhängig vom Gültigkeitsdatum
// was fehlt ist unter anderem das Setzen des Datums im #validFrom-Feld in der View, der Abgleich, welche Stunden angezeigt werden müssen usw...


        //now render the lessons with the correct validity date
        // regularLessons.forEach((lesson) => {

        //     if (lesson.validFrom != validDateOfTimetableDisplayed) return;

        //     let timeslot = LessonView.#getTimeslotOfLesson(lesson);
        //     let lessonDate = timeslot.closest('.weekday').dataset.date;
        //     let lessonOptionsHTML = `
        //                 <div class="lessonOption"><button data-update_lesson>bearbeiten</button></div>
        //                 <div class="lessonOption"><button data-add_new_task>neue Aufgabe</button></div>
        //                 <div class="lessonOption"><button data-lesson_canceled>fällt aus</button></div>
        //     `;

        //     if (timeslot.closest('.weekday').classList.contains('passed')) {
        //         lessonOptionsHTML = `
        //             <div class="lessonOption lessonPastMessage"><button>Stunde hat bereits stattgefunden.</button></div>
        //             <div class="lessonOption lessonPastMessage responsive"><button>Stunde hat bereits statt-gefunden.</button></div>
        //         `;
        //     }

        //     timeslot.innerHTML = `
        //         <div class="lesson ${lesson.cssColorClass}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}" data-date="${lessonDate}">
        //              <div class="flex spaceBetween" style="width: 100%;">
        //                 <div style="width: 1.5rem;" class="spacerBlock"></div>
        //                 <div>${lesson.class} ${lesson.subject}</div>
        //                 <div class="lessonMenuWrapper">
        //                     <div style="display: flex; justify-content: left; align-items: center; width: 1.5rem;">
        //                         <button class="lessonOptionsButton">&#x2630;</button>
        //                     </div>
        //                 </div>
        //             </div>
        //             <div style="display: none;" class="${lesson.cssColorClass} light lessonOptionsWrapper">
        //                 ${lessonOptionsHTML}
        //             </div>   
        //         </div>`;

        // })
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

        timeslotElement.querySelector('#lessonForm').addEventListener('submit', SettingsView.saveNewLesson);

        timeslotElement.querySelector('.discardNewLessonButton').addEventListener('click', (event) => SettingsView.removeLessonForm(event));
        timeslotElement.querySelector('.lessonForm').addEventListener('mouseenter', AbstractView.removeAddLessonButton);

        //timeslot event handlers
        timeslotElement.removeEventListener('click', SettingsView.createLessonForm);
        timeslotElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
    }

    static removeLessonForm(event) {
        event.stopPropagation();

        let timeslotElement = event.target.closest('.settingsTimeslot');
        let createLessonForm = event.target.closest('#lessonForm');

        createLessonForm.remove();

        timeslotElement.addEventListener('click', SettingsView.createLessonForm);
        timeslotElement.addEventListener('mouseenter', AbstractView.showAddLessonButton);

    }

    static saveNewLesson(event) {
        event.preventDefault();

        let timeslotElement = event.target.closest('.settingsTimeslot');

        let lessonData = {
            'weekdayNumber': timeslotElement.closest('.settingsWeekday').dataset.weekday_number,
            'timeslot': timeslotElement.dataset.timeslot,
            'class': timeslotElement.querySelector('#class').value.toLowerCase(),
            'subject': timeslotElement.querySelector('#subject').value,
        }

        SettingsView.removeLessonForm(event);
    }

    static makeTimetableEditable() {
        document.querySelectorAll('.settingsTimeslot').forEach((element) => {
            element.innerHTML = '';
            element.addEventListener('mouseenter', AbstractView.showAddLessonButton);
            element.addEventListener('click', SettingsView.createLessonForm);
        });

        document.querySelector('#createTimetableButtonWrapper').style.display = 'none';
        document.querySelector('#saveDiscardTimetableButtonWrapper').style.display = 'flex';


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

}