import Controller from "../Controller/SettingsController.js";
import AbstractView from "./AbstractView.js";
import Fn from "../inc/utils.js";

export default class SettingsView {

    static openSettings() {
        document.querySelector('#settingsContainer').style.display = 'flex';
        document.querySelector('main').style.filter = 'blur(3px)';
        document.querySelector('nav').style.filter = 'blur(3px)';
    }

    static closeSettings() {
        document.querySelector('#settingsContainer').style.display = 'none';
        document.querySelector('main').style.removeProperty('filter');
        document.querySelector('nav').style.removeProperty('filter');

    }

    static toggleSettingsMenu(event) {
        event.stopPropagation();
        let settingsMenuElement = document.querySelector('#settingsMenu');

        if (settingsMenuElement.style.display == 'flex') {
            this.closeSettingsMenu(event);
            return;
        }

        settingsMenuElement.style.display = 'flex';
        document.addEventListener('click', SettingsView.closeSettingsMenu);
    }

    static closeSettingsMenu(event) {
        if (event.target.id != 'settingsMenu') {
            document.querySelector('#settingsMenu').removeAttribute('style');
            document.removeEventListener('click', SettingsView.closeSettingsMenu);
        }
    }

    //////////////////////////////////
    // timetable settings functions //
    //////////////////////////////////

    static async renderSelectableLessonColors() {
        let allSubjects = await Controller.getAllSubjects();
        let allColorsArray = [
            'subjectColorOne',
            'subjectColorTwo',
            'subjectColorThree',
            'subjectColorFour',
            'subjectColorFive',
            'subjectColorSix',
            'subjectColorSeven',
            'subjectColorEight',
            'subjectColorNine',
            'subjectColorTen',
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

    static async renderExistingSubjects() {
        let subjectsContainer = document.querySelector('#subjectsListContainer');
        let allSubjects = await Controller.getAllSubjects();
        let subjectsHTML = '';

        allSubjects.forEach(entry => {
            subjectsHTML += `
                <div class="subjectListItem ${entry.colorCssClass} flex spaceBetween" data-id="${entry.id}" data-subject="${entry.subject}">
                ${entry.subject}
                <button class="deleteSubjectButton deleteItemButton" style="width: 1.5rem">&#215;</button>
                </div>
            `;
        });

        if (allSubjects.length == 0) {
            subjectsHTML = 'Keine Fächer gefunden.'
        }

        subjectsContainer.innerHTML = subjectsHTML;
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

        if (Controller.saveSubject(subject)) {
            document.querySelector('#subjectName').value = '';
        }

    }

    static async setDateOfTimetableToDisplay() {
        let regularLessons = await Controller.getAllRegularLessons();
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

        if (allValidDates.length <= 1) {
            document.querySelector('#timetableBackwardButton').style.visibility = 'hidden';
        } else {
            document.querySelector('#timetableBackwardButton').style.visibility = 'visible';
        }

        //hide edit timetable button, if there is not yet a timetable
        if (date == undefined) document.querySelector('#editTimetableButton').style.display = 'none';
    }

    static async renderLessons() {

        let regularLessons = await Controller.getAllRegularLessons();
        let validFromElement = document.querySelector('#validFrom');
        let timetableValidDates = [];
        let dateOfTimetableToDisplay = new Date(validFromElement.dataset.date).setHours(12, 0, 0, 0);
        let allSubjects = await Controller.getAllSubjects();

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
            lesson.cssColorClass = Fn.getCssColorClass(lesson, allSubjects);

            timeslot.innerHTML = `
                <div class="settingsLesson ${lesson.cssColorClass}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}" data-id="${lesson.id}" data-validuntil="${lesson.validUntil}" data-created="${lesson.created}">
                     <div class="flex spaceBetween" style="width: 100%;">
                        <div style="width: 1.5rem;"></div>
                        <div class="lessonClassSubjectField">${lesson.class} ${lesson.subject}</div>
                        <button class="deleteLessonButton" style="width: 1.5rem; visibility: hidden;">&#215;</button>
                    </div> 
                </div>`;

            timeslot.querySelector('.deleteLessonButton').addEventListener('click', SettingsView.deleteLesson);
        });

    }

    static async createLessonForm(event) {

        let timeslotElement = event.target.closest('.settingsTimeslot');

        let timeslotProps = timeslotElement.getBoundingClientRect()
        let timetableProps = document.querySelector('.settingsWeekOverview').getBoundingClientRect();
        let subjectSelectHTML = await AbstractView.getSubjectSelectHTML()

        let lessonFormHTML = `
                <form id="lessonForm">
                    <div class="lessonForm">
                        <div class="flex">
                            <div class="alertRing"><input type="text" name="class" id="class" placeholder="Klasse" style="width: 4rem;"></div>
                            <div class="alertRing">${subjectSelectHTML}</div>
                        </div>
                        <div class="flex alignCenter halfGap">
                            <button type="submit" class="saveNewLessonButton confirmationButton" style="margin-right: 0px"><span class="icon checkIcon"></span></button>
                            <button class="discardNewLessonButton cancelButton"><span class="icon crossIcon"></span></button>
                        </div>
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

    static async changeDisplayedTimetable(event) {
        let allScheduledLessons = await Controller.getAllRegularLessons();
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

    static async createNewLesson(event) {
        event.preventDefault();
        let allSubjects = await Controller.getAllSubjects();
        let timeslotElement = event.target.closest('.settingsTimeslot');

        let lessonData = {
            'weekday': timeslotElement.closest('.settingsWeekday').dataset.weekday_number,
            'timeslot': timeslotElement.dataset.timeslot,
            'class': timeslotElement.querySelector('#class').value.toLowerCase(),
            'subject': timeslotElement.querySelector('#subject').value,
        }

        if (lessonData.class == '') {
            SettingsView.alertClassInput(event);
            return;
        }

        if (lessonData.subject == '') {
            SettingsView.alertSubjectInput(event);
            return;
        }

        let lesson = await Controller.getLessonObject(lessonData);
        lesson.cssColorClass = Fn.getCssColorClass(lesson, allSubjects);


        timeslotElement.innerHTML = `
                <div class="settingsLesson ${lesson.cssColorClass}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}">
                     <div class="flex spaceBetween" style="width: 100%;">
                        <div style="width: 1.5rem;"></div>
                        <div class="lessonClassSubjectField">${lesson.class} ${lesson.subject}</div>
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
        let editTimetableButton = document.querySelector('#editTimetableButton');
        let validFrom = document.querySelector('#validFromPicker').value;
        let lessons = [];

        document.querySelectorAll('.settingsTimeslot').forEach(timeslot => {
            if (!Fn.hasLesson(timeslot)) return;

            let lessonData = {
                'validFrom': validFrom,
                'class': timeslot.firstElementChild.dataset.class,
                'subject': timeslot.firstElementChild.dataset.subject,
                'weekday': timeslot.closest('.settingsWeekday').dataset.weekday_number,
                'timeslot': timeslot.dataset.timeslot
            }

            lessons.push(lessonData);
        });

        Controller.saveNewTimetable(validFrom, lessons);


        if (editTimetableButton.hasAttribute('style')) editTimetableButton.removeAttribute('style');
    }

    static discardNewTimetable() {
        document.querySelectorAll('.settingsTimeslot').forEach((element) => {
            element.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
            element.removeEventListener('click', SettingsView.createLessonForm);
        });

        document.querySelector('#createChangeTimetableButtonContainer').style.display = 'flex';
        document.querySelector('#saveDiscardTimetableButtonContainer').style.display = 'none';
        document.querySelector('#saveDiscardTimetableChangesButtonContainer').style.display = 'none';

        document.querySelector('#saveNewTimetableButton').removeAttribute('style');
        document.querySelector('#noSubjectsAlertTooltip').removeAttribute('style');

        document.querySelector('#validFrom').style.display = 'inline';
        document.querySelector('#validFromPickerWrapper').style.display = 'none';
        document.querySelector('#validFromPickerWrapper').value = '';
        document.querySelector('#timetableBackwardButton').style.visibility = 'visible';
        document.querySelector('#timetableForwardButton').style.visibility = 'visible';
        SettingsView.setDateOfTimetableToDisplay();
        SettingsView.renderLessons();
    }

    static saveTimetableUpdates() {
        let validFrom = Fn.formatDateSqlCompatible(document.querySelector('#validFrom').dataset.date);
        let lessons = [];

        document.querySelectorAll('.settingsTimeslot').forEach(timeslot => {
            if (!Fn.hasLesson(timeslot)) return;

            let lessonData = {
                'id': timeslot.firstElementChild.dataset.id,
                'validFrom': validFrom,
                'validUntil': timeslot.firstElementChild.dataset.validuntil,
                'class': timeslot.firstElementChild.dataset.class,
                'subject': timeslot.firstElementChild.dataset.subject,
                'weekday': timeslot.closest('.settingsWeekday').dataset.weekday_number,
                'timeslot': timeslot.dataset.timeslot,
                'created': timeslot.firstElementChild.dataset.created
            }

            lessons.push(lessonData);
        });

        Controller.saveTimetableUpdates(validFrom, lessons);
    }

    static renderLessonChangesAndTasksToKeepDialog(affectedLessonChanges, affectedTasks, timetableValidFromDate) {
        let dialog = document.querySelector('#LessonChangesAndTasksToKeepDialog');
        let lessonConflictsContainer = dialog.querySelector('#lessonChangesConflictsContainer');
        let taskConflictsContainer = dialog.querySelector('#taskConflictsContainer');
        let descriptionText = 'Du hast in der Vergangenheit Vertretungsstunden, Termine und Aufgaben angelegt, deren Datum im Gültigkeitsbereich des neuen Stundenplans liegen. Sollten diese durch die Änderung hinfällig sein, lösche die entsprechenden Einträge bitte.';
        let lessonChangesHTML = '';
        let tasksHTML = '';

        if (affectedLessonChanges.length == 0) {
            descriptionText = 'Du hast Aufgaben zu älteren Stundenplänen angelegt, deren Termin im Gültigkeitsbereich des neuen Stundenplans liegen. Sollten Aufgaben durch die Änderung hinfällig sein, lösche sie bitte.';
            lessonConflictsContainer.style.display = 'none';
        } else if (affectedTasks.length == 0) {
            descriptionText = 'Du hast Vertretungsstunden oder Termine angelegt, deren Datum im Gültigkeitsbereich des neuen Stundenplans liegen. Sollten Vertretungen oder Termine durch die Änderung hinfällig sein, lösche sie bitte.';
            taskConflictsContainer.style.display = 'none';
        }

        dialog.setAttribute('data-timetablevalidfrom', timetableValidFromDate);
        dialog.querySelector('#descriptionPara').innerText = descriptionText;

        affectedLessonChanges.forEach(entry => {
            if (new Date(entry.date).setHours(12, 0, 0, 0) < new Date().setHours(12, 0, 0, 0)) return;

            let subject = entry.subject == 'Termin' ? ' - ' : entry.subject;
            let date = Fn.formatDate(entry.date)
            let day = Fn.getAbbreviatedDayName(entry.weekday);
            let type;

            if (entry.type == 'sub') type = 'Vertretung';
            if (entry.type == 'appointement') type = 'Termin';
            if (entry.canceled == 'true') type = 'Ausfall';

            let html = `
                <tr data-type="lessonChange" data-id="${entry.id}">
                    <td>${entry.class}</td>
                    <td>${subject}</td>
                    <td>
                        <div>${day}</div>
                        <div style="font-size: 0.8rem;">${date}</div>
                        <div style="font-size: 0.8rem; text-wrap: nowrap;">${entry.timeslot}. Stunde</div>
                    </td>
                    <td>${type}</td>
                    <td style="border: none;"><button class="deleteItemButton" style="width: 1.5rem">&#215;</button></td>
                </tr>
            `;

            lessonChangesHTML += html;
        })

        affectedTasks.forEach(entry => {
            if (new Date(entry.date).setHours(12, 0, 0, 0) < new Date().setHours(12, 0, 0, 0)) return;

            let date = Fn.formatDate(entry.date)

            let html = `
                <tr data-type="task" data-id="${entry.id}">
                    <td>${entry.class}</td>
                    <td>${entry.subject}</td>
                    <td>${date}</td>
                    <td>${entry.description}</td>
                    <td style="border: none;"><button class="deleteItemButton" style="width: 1.5rem">&#215;</button></td>
                </tr>
            `;

            tasksHTML += html;
        })

        lessonConflictsContainer.querySelector('table tbody').innerHTML = lessonChangesHTML;
        taskConflictsContainer.querySelector('table tbody').innerHTML = tasksHTML;

        dialog.querySelectorAll('.deleteItemButton').forEach(button => {
            button.addEventListener('click', SettingsView.deleteLessonChangeOrTaskConflict)
        });

        dialog.querySelector('#closeLessonChangesAndTasksToKeepDialogButton').addEventListener('click', SettingsView.closeLessonChangesAndTasksToKeepDialog);

        if (lessonConflictsContainer.querySelector('table tbody').children.length > 0 || taskConflictsContainer.querySelector('table tbody').children.length > 0) dialog.showModal();
    }

    static closeLessonChangesAndTasksToKeepDialog() {
        let remainingLessonIds = [];
        let timetableValidFromDate = document.querySelector('#LessonChangesAndTasksToKeepDialog').dataset.timetablevalidfrom;

        document.querySelectorAll('#lessonChangesConflictsTable tbody>tr').forEach(tr => remainingLessonIds.push(tr.dataset.id));
        document.querySelector('#LessonChangesAndTasksToKeepDialog').close();

        Controller.handleTimetableChangesCarryover(remainingLessonIds, timetableValidFromDate);
    }

    static deleteLessonChangeOrTaskConflict(event) {
        let itemTr = event.target.closest('tr');
        let itemType = itemTr.dataset.type;
        let itemId = itemTr.dataset.id;

        if (itemType == 'task') Controller.deleteTaskById(itemId);
        if (itemType == 'lessonChange') Controller.deleteLessonChangeById(itemId);

        itemTr.remove();

    }

    static async makeTimetableEditable() {

        if (await SettingsView.isAllSubjectsEmpty()) {
            SettingsView.alertTimetable(true);

            return;
        }

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

    static async isDateTaken() {
        let pickedDate = document.querySelector('#validFromPicker').value;
        let timetables = await Controller.getAllRegularLessons();

        document.querySelector('#validFromPickerAlertTooltip').style.display = 'none';

        for (let entry of timetables) {
            if (entry.validFrom == pickedDate) {
                SettingsView.alertValidFromPicker(true)
                return true;
            }
        }

        return false;
    }

    static async isAllSubjectsEmpty() {
        let allSubjects = await Controller.getAllSubjects();

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

    ////////////////////////////////
    // account settings functions //
    ////////////////////////////////

    static openTimetableSettings() {
        document.querySelector('#openAccountSettingsButton').classList.remove('selected');
        document.querySelector('#openSchoolYearSettingsButton').classList.remove('selected');
        document.querySelector('#openTimetableSettingsButton').classList.add('selected');

        document.querySelector('#curriculumViewContainer').style.display = 'none';
        document.querySelector('#accountSettingsContainer').style.display = 'none';
        document.querySelector('#timetableSettingsContainer').style.display = 'block';
    }

    static openSchoolYearSettings() {
        document.querySelector('#openAccountSettingsButton').classList.remove('selected');
        document.querySelector('#openTimetableSettingsButton').classList.remove('selected');
        document.querySelector('#openSchoolYearSettingsButton').classList.add('selected');

        document.querySelector('#accountSettingsContainer').style.display = 'none';
        document.querySelector('#timetableSettingsContainer').style.display = 'none';
        document.querySelector('#curriculumViewContainer').style.display = 'block';
    }

    static openAccountSettings(userInfo = null) {
        let accountSettingsContainer = document.querySelector('#accountSettingsContainer');
        let timetableSettingsContainer = document.querySelector('#timetableSettingsContainer');
        let curriculumEditor = document.querySelector('#curriculumViewContainer');

        let containerHeight = timetableSettingsContainer.clientHeight;

        document.querySelector('#openTimetableSettingsButton').classList.remove('selected');
        document.querySelector('#openSchoolYearSettingsButton').classList.remove('selected');
        document.querySelector('#openAccountSettingsButton').classList.add('selected');

        if (userInfo) {
            const notLoggedInMessage = accountSettingsContainer.querySelector('#eduplanioPlusNotLoggedInMessage');
            const eduplanioPlusStatusSpan = document.querySelector('#eduplanioPlusStatusSpan');
            const eduplanioPlusExpirationDateSpan = document.querySelector('#eduplanioPlusExpirationDateSpan');

            let expirationDateString = '-';
            let statusString = 'inaktiv';
            let statusTextClass = 'redText';

            if (userInfo.activeUntil) {
                const expirationDate = new Date(userInfo.activeUntil);
                const todayTimestamp = new Date().setHours(12, 0, 0, 0);

                if (expirationDate.setHours(12, 0, 0, 0) >= todayTimestamp) {
                    statusString = 'aktiv';
                    statusTextClass = 'greenText';
                }

                expirationDateString = Fn.formatDateWithFullYear(expirationDate);
            }

            eduplanioPlusStatusSpan.textContent = statusString;
            eduplanioPlusExpirationDateSpan.textContent = expirationDateString;

            notLoggedInMessage.classList.add('notDisplayed');
            eduplanioPlusStatusSpan.classList.add(statusTextClass);
        }

        //make account settings visible
        accountSettingsContainer.style.height = containerHeight + 'px';
        accountSettingsContainer.style.display = 'block';

        timetableSettingsContainer.style.display = 'none';
        curriculumEditor.style.display = 'none';

    }
    
    static isAccountSettingsOpen() { 
        let accountSettingsContainer = document.querySelector('#accountSettingsContainer');

        if (accountSettingsContainer.style.display == 'block') return true;

        return false;
    }

    static toogleAccountDeletionMenu(event) {
        let deleteAccountMenu = document.querySelector('#approveAccountDeletionContainer');
        let requestDeletionMenu = document.querySelector('#requestDeletionContainer');
        let deletionErrorDisplay = document.querySelector('#deletionErrorDisplay');

        if (event.target.id == 'deleteAccountButton') {
            requestDeletionMenu.style.display = 'none';
            deletionErrorDisplay.style.display = 'none';
            deleteAccountMenu.style.display = 'block';
        }

        if (event.target.id == 'cancelAccountDeletionButton') {
            requestDeletionMenu.style.display = 'block';
            deleteAccountMenu.style.display = 'none';
            deletionErrorDisplay.style.display = 'none';
        }

        if (event.target.id == 'cancelFailedAccountDeletionButton') {
            requestDeletionMenu.style.display = 'block';
            deleteAccountMenu.style.display = 'none';
            deletionErrorDisplay.style.display = 'none';
        }
    }

    static showAccountDeletionResult(status) {
        if (status == 'success') {
            alert('Dein Account wurde erfolgreich gelöscht.');
            Controller.logout();
        }

        if (status == 'failed') {
            document.querySelector('#deletionErrorDisplay').style.display = 'block';
            document.querySelector('#approveAccountDeletionContainer').style.display = 'none';
        }
    }

    static setVersionDisplay(version) {
        document.querySelector('#versionDisplay').textContent = version;
    }

    static openRegistrationNeededDialog() {
        document.querySelector('#registrationNeededDialog').showModal();
    }

    static closeRegistrationNeededDialog() {
        document.querySelector('#registrationNeededDialog').close();
    }

    static openCheckout(clickedPurchaseButton, newWindow) {
        const baselink = './stripe/checkout.html';

        let purchaseItem;

        if (clickedPurchaseButton.id == 'oneYearEduplanioPlusButton') purchaseItem = 'oneYear';
        if (clickedPurchaseButton.id == 'oneMonthEduplanioPlusButton') purchaseItem = 'oneMonth';

        newWindow.location.href = `${baselink}?item=${purchaseItem}`;
        window.focus();
    }

    //////////////////////////
    // validation functions //
    //////////////////////////
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

    static alertClassInput(event) {
        let alertRing = event.target.querySelector('#class').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertSubjectInput(event) {
        let alertRing = event.target.querySelector('#subject').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}