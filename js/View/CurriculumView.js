import { ONEDAY } from "../index.js";
import AbstractView from "./AbstractView.js";
import Controller from '../Controller/CurriculumController.js';
import Editor from "../inc/editor.js";

export default class CurriculumView extends AbstractView {
    static renderEmptyCalendar(startDate = null, endDate = null) {
        const yearContainer = document.querySelector('#yearContainer');
        const curriculumSelectionContainer = document.querySelector('#curriculumSelectionContainer');
        const editorNameSpan = document.querySelector('#editorNameSpan');
        const fragment = document.createDocumentFragment();

        if (startDate && startDate instanceof Date == false) startDate = new Date(startDate);
        if (endDate && endDate instanceof Date == false) endDate = new Date(endDate);

        editorNameSpan.textContent = 'Stoffverteilungsplan';

        while (yearContainer.firstElementChild) {
            yearContainer.firstElementChild.remove();
        }

        while (curriculumSelectionContainer.firstElementChild) {
            curriculumSelectionContainer.firstElementChild.remove();
        }

        if (!startDate) {
            const div = document.createElement('div');
            div.classList.add('marginTop');
            div.textContent = 'Bisher hast du noch keinen Jahresplan angelegt. Um die Jahresübersicht zu nutzen, lege zuerst ein neues Schuljahr mit Start- und Enddatum an.';

            yearContainer.append(div);
            document.querySelector('#dayNameContainer').setAttribute('style', 'display: none');

            return;
        }

        const monthNames = {
            0: 'Januar',
            1: 'Februar',
            2: 'März',
            3: 'April',
            4: 'Mai',
            5: 'Juni',
            6: 'Juli',
            7: 'August',
            8: 'September',
            9: 'Oktober',
            10: 'November',
            11: 'Dezember'
        };
        const dayNames = {
            0: 'So',
            1: 'Mo',
            2: 'Di',
            3: 'Mi',
            4: 'Do',
            5: 'Fr',
            6: 'Sa',
        }

        let dateIterator = new Date(startDate).setHours(12, 0, 0, 0);
        endDate = new Date(endDate).setHours(12);
        let monthIterator = 0;
        let rowCounter = 0;

        let blankMonth = document.createElement('div');
        let blankWeek = document.createElement('div');

        blankMonth.classList.add('month');
        blankMonth.innerHTML = `
                <div class="monthName">${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}</div>
            `;

        blankWeek.classList.add('week');
        blankWeek.setAttribute('data-row', rowCounter);
        blankWeek.innerHTML = `
                <div class="day" data-weekdayNumber="1"></div>
                <div class="day" data-weekdayNumber="2"></div>
                <div class="day" data-weekdayNumber="3"></div>
                <div class="day" data-weekdayNumber="4"></div>
                <div class="day" data-weekdayNumber="5"></div>
                <div class="day" data-weekdayNumber="6"></div>
                <div class="day" data-weekdayNumber="0"></div>
            `
        let isYearCompleted = false;
        let currentMonth = blankMonth.cloneNode(true);
        let currentWeek = blankWeek.cloneNode(true);

        do {
            let currentDay = new Date(dateIterator);
            currentDay.setHours(12);

            if (currentDay.getDay() == 1 && currentWeek.querySelector('.dateContainer')) {
                currentMonth.appendChild(currentWeek);

                if (
                    (rowCounter != 0 &&
                        new Date(currentWeek.firstElementChild.dataset.date).getMonth() != new Date(currentWeek.lastElementChild.dataset.date).getMonth()) ||
                    currentDay.getDate() == 1
                ) {
                    fragment.appendChild(currentMonth);
                    currentMonth = blankMonth.cloneNode(true);
                    currentMonth.querySelector('.monthName').textContent = `${monthNames[currentDay.getMonth()]} ${currentDay.getFullYear()}`;
                    monthIterator++;
                }

                currentWeek = blankWeek.cloneNode(true);
                rowCounter++;
            }

            currentWeek.querySelectorAll('.day').forEach(day => {
                if (day.dataset.weekdaynumber != currentDay.getDay()) return;

                day.setAttribute('data-date', currentDay);
                day.innerHTML = `
                        <div class="dateContainer">
                            <div class="dayDate">${currentDay.getDate()}. </div>
                        </div>
                    `;

                if (currentDay.getDate() == 1) {
                    day.classList.add('firstOfMonth');
                    day.querySelector('.dayDate').innerText += monthNames[currentDay.getMonth()];
                }

            });

            if (currentDay.setHours(12) == endDate) {
                isYearCompleted = true;
                currentMonth.appendChild(currentWeek);
                fragment.appendChild(currentMonth);
            }

            currentWeek.dataset.row = rowCounter;
            dateIterator += ONEDAY;
        } while (!isYearCompleted);

        //replace items in the year container
        yearContainer.append(fragment);

        //hide empty day containers
        yearContainer.querySelectorAll('.day').forEach(day => {
            if (day.children.length == 0) day.classList.add('hidden');
        });

        document.querySelector('#dayNameContainer').removeAttribute('style');
    }

    static openHolidayEditor(schoolYear) {
        const yearContainer = document.querySelector('#yearContainer');

        yearContainer.classList.remove('curriculumEditor');
        yearContainer.classList.add('holidayEditor');
        yearContainer.classList.remove('notDisplayed');

        schoolYear.holidays.forEach((holiday) => {
            this.renderSpan(holiday.id, holiday);
            this.renderSpanContentContainer(holiday.id, holiday);
        });

        document.querySelector('#closeHolidayEditorButton').classList.remove('notDisplayed');
        document.querySelector('#editorNameSpan').textContent = `Ferien und freie Tage ${schoolYear.name}`;
    }

    static closeHolidayEditor() {
        document.querySelector('#closeHolidayEditorButton').classList.add('notDisplayed');
    }

    static async renderSchoolYearCurriculumEditor(schoolYear, curriculumId = null) {

        const curriculumSelectionContainer = document.querySelector('#curriculumSelectionContainer');
        const yearContainer = document.querySelector('#yearContainer');
        const allDays = yearContainer.querySelectorAll('.day');
        const dayNameContainer = document.querySelector('#dayNameContainer');

        const curriculumElements = await this.getCurriculaSelectionItems(schoolYear);
        const curriculumSelectionItem = curriculumElements?.querySelector('.curriculumSelectionItem')

        yearContainer.classList.remove('holidayEditor');
        yearContainer.classList.add('curriculumEditor');

        document.querySelector('#editorNameSpan').textContent = `Stoffverteilungspläne ${schoolYear.name}`;

        //render the curricula selection
        while (curriculumSelectionContainer.firstChild) { curriculumSelectionContainer.firstChild.remove() };

        if (!curriculumSelectionItem) {
            const div = document.createElement('div');
            div.classList.add('marginTop');
            div.textContent = 'Du hast für dieses Schuljahr noch keine Stoffverteilungspläne angelegt.';

            curriculumSelectionContainer.append(div);
            dayNameContainer.classList.add('notDisplayed');
            yearContainer.classList.add('notDisplayed');

            return;
        }

        curriculumSelectionContainer.append(curriculumElements);

        this.markHolidays(schoolYear, allDays);

        //render the curriculum spans
        if (!curriculumId) {
            document.querySelector('#curriculumContainer').dataset.curriculumid = schoolYear.curricula[0].id;
            document.querySelector(`.curriculumSelectionItem[data-curriculumid="${schoolYear.curricula[0].id}"].settingsView`).classList.add('selected');

            yearContainer.classList.remove('notDisplayed');
            dayNameContainer.classList.remove('notDisplayed');

            schoolYear.curricula[0].curriculumSpans.forEach(span => {
                this.renderSpan(span.id, span);
                this.renderSpanContentContainer(span.id, span);
            });

            return;
        }

        const curriculumToRender = schoolYear.getCurriculumById(curriculumId);

        if (curriculumToRender) {
            yearContainer.classList.remove('notDisplayed');
            dayNameContainer.classList.remove('notDisplayed');

            document.querySelector('#curriculumContainer').dataset.curriculumid = curriculumId;
            document.querySelector(`.curriculumSelectionItem.settingsView[data-curriculumid="${curriculumId}"]`)?.classList.add('selected');

            curriculumToRender.curriculumSpans.forEach(span => {
                this.renderSpan(span.id, span);
                this.renderSpanContentContainer(span.id, span);
            });
        }
    }

    /** This function rerenders the displayed curriculum without rerendering the whole calendar. Although it adds complexity it is necessary for performance reasons as it makes switching and editing curricula way smoother. */
    static rerenderDisplayedCurriculum(schoolYear, curriculumId) {
        const yearContainer = document.querySelector('#yearContainer');
        const dayNameContainer = document.querySelector('#dayNameContainer');

        document.querySelectorAll('.curriculumSelectionItem.settingsView').forEach(item => item.classList.remove('selected'));

        //clear the old spans
        yearContainer.querySelectorAll('.day').forEach(day => {
            day.classList.remove('selected');
            day.classList.remove('start');
            day.classList.remove('end');
            day.removeAttribute('data-spanid');
        });

        yearContainer.querySelectorAll('.spanContentContainer').forEach(container => container.remove());

        let curriculumToRender = schoolYear.getCurriculumById(curriculumId);
        if (this.getEditorType() == 'Holiday Editor') curriculumToRender = { curriculumSpans: schoolYear.holidays };

        if (curriculumToRender) {
            const selectedCurriculumItem = document.querySelector(`.curriculumSelectionItem[data-curriculumid="${curriculumId}"].settingsView`);
            if (selectedCurriculumItem) selectedCurriculumItem.classList.add('selected');

            curriculumToRender.curriculumSpans.forEach(span => {
                this.renderSpan(span.id, span);
                this.renderSpanContentContainer(span.id, span);
            });

        }

        document.querySelector('#curriculumContainer').dataset.curriculumid = curriculumId;

        if (yearContainer.classList.contains('notDisplayed')) yearContainer.classList.remove('notDisplayed');
        if (dayNameContainer.classList.contains('notDisplayed')) dayNameContainer.classList.remove('notDisplayed');
    }

    static async renderCurriculumSubjectAndGradeSelect(schoolYear) {
        const subjectGradeSelect = await this.getSubjectAndGradeSelectHTML(schoolYear);
        const container = document.querySelector('#curriculumCreationSelectContainer');
        const selectContainer = container.querySelector('#curriculumCreationSelectWrapper');
        const errorMessageDisplay = container.querySelector('#curriculumCreationSelectErrorDisplay');

        let errorText = 'Für diese Klassenstufen- und Fachkombination gibt es bereits einen Stoffverteilungsplan.';

        //preselect a subject/grade combination without a corresponding curriculum
        let freeCombinationFound = false;

        if (subjectGradeSelect) {
            const subjectSelectOptions = subjectGradeSelect.querySelector('#curriculumSubjectSelect').querySelectorAll('option');
            const gradeSelectOptions = subjectGradeSelect.querySelector('#curriculumGradeSelect').querySelectorAll('option');

            gradeSelectOptions.forEach(option => {
                if (freeCombinationFound) return;

                let i = 0;
                let subjectToSetSelected = subjectSelectOptions[i];
                let matchingCurriculum = false;

                do {
                    matchingCurriculum = schoolYear.curricula.find(entry => { return entry.grade == option.value && entry.subject == subjectToSetSelected.value });

                    if (matchingCurriculum) {
                        i++
                        subjectToSetSelected = subjectSelectOptions[i];
                    }
                } while (matchingCurriculum && subjectToSetSelected)

                if (!matchingCurriculum) {
                    freeCombinationFound = true;
                    option.setAttribute('selected', 'true');
                    subjectToSetSelected.setAttribute('selected', 'true');
                }
            });
        }

        //add the errorMessageDisplay
        errorMessageDisplay.classList.add('notDisplayed');
        errorMessageDisplay.classList.add('errorMessageDisplay');
        errorMessageDisplay.classList.add('alertRing');

        if (!freeCombinationFound) {
            errorMessageDisplay.classList.remove('notDisplayed');
            errorText = 'Es existieren bereits Jahrespläne für jede mögliche Kombination von Klassenstufen und Fächern, die du angelegt hast.';

            this.disableSaveCurriculumButton();
            document.querySelector('#yearContainer').classList.add('notDisplayed');
            document.querySelector('#dayNameContainer').classList.add('notDisplayed');
        }

        if (!subjectGradeSelect) {
            errorMessageDisplay.classList.remove('notDisplayed');
            errorText = 'Um einen Stoffverteilungsplan anlegen zu können, musst du sowohl deine unterrichteten Klassenstufen als auch die unterrichteten Fächer angelegt haben. Letzteres ist in den Einstellungen unter "Stundenplan" möglich.';

            this.disableSaveCurriculumButton();
            document.querySelector('#yearContainer').classList.add('notDisplayed');
        }

        errorMessageDisplay.textContent = errorText;

        while (selectContainer.firstElementChild) {
            selectContainer.firstElementChild.remove();
        }

        //and stick it all together
        if (subjectGradeSelect && freeCombinationFound) {
            selectContainer.append(subjectGradeSelect);
            this.enableSaveCurriculumButton();
            document.querySelector('#yearContainer').classList.remove('notDisplayed');
        }
    }

    static async getCurriculaSelectionItems(schoolYear, forMainView = false, preselectedIds = null) {
        if (schoolYear.curricula.length == 0) return null;

        const subjects = await Controller.getAllSubjects();
        const blankDiv = document.createElement('div');
        const fragment = document.createDocumentFragment();

        schoolYear.grades.forEach(grade => {
            const gradeContainer = blankDiv.cloneNode();
            const gradeLabel = document.createElement('label');

            gradeContainer.dataset.grade = grade;
            gradeContainer.classList.add('flex');
            gradeContainer.classList.add('wrap');
            gradeContainer.classList.add('halfGap');
            gradeContainer.classList.add('marginBottom');
            gradeContainer.classList.add('curriculumItemContainer');

            gradeLabel.dataset.grade = grade;
            gradeLabel.textContent = `Klasse ${grade}:`;

            fragment.append(gradeLabel);
            fragment.append(gradeContainer);
        });

        schoolYear.curricula.forEach(item => {
            const container = blankDiv.cloneNode();
            const curriculumName = blankDiv.cloneNode();
            const subject = subjects.find(subject => { return item.subject == subject.subject });

            container.dataset.curriculumid = item.id;
            container.classList.add('curriculumSelectionItem');

            if (forMainView) { container.classList.add('mainView'); } else { container.classList.add('settingsView'); }
            if (subject) { container.classList.add(subject.colorCssClass); } else { container.classList.add('undefined'); }
            if (preselectedIds && preselectedIds.includes(item.id)) container.classList.add('selected');

            curriculumName.textContent = `${item.subject}`;

            container.append(curriculumName);

            let itemAppended = false;

            Array.from(fragment.children).forEach(child => {
                if (child.dataset.grade == item.grade) {
                    child.append(container);
                    itemAppended = true;
                }
            })

            //if the user created a curriculum, but later unselected the grade, it is set for, it will not be appended.
            //To still list it, the missing gradeContainer must be added.
            if (!itemAppended) {
                const gradeContainer = blankDiv.cloneNode();
                const gradeLabel = document.createElement('label');

                gradeContainer.dataset.grade = item.grade;
                gradeContainer.classList.add('flex');
                gradeContainer.classList.add('wrap');
                gradeContainer.classList.add('halfGap');
                gradeContainer.classList.add('marginBottom');
                gradeLabel.textContent = `Klasse ${item.grade}:`;

                gradeContainer.append(container);
                fragment.insertBefore(gradeLabel, fragment.querySelector(`label[data-grade="${Number(item.grade) + 1}"]`));
                fragment.insertBefore(gradeContainer, fragment.querySelector(`[data-grade="${Number(item.grade) + 1}"]`));
            }
        });

        //remove empty gradeContainer and their label
        Array.from(fragment.querySelectorAll('.curriculumItemContainer')).forEach(container => {
            if (container.childElementCount == 0) {
                const grade = container.dataset.grade;
                fragment.querySelector(`label[data-grade="${grade}"]`)?.remove();
                container.remove();
            }
        });

        return fragment;
    }

    static async getSubjectAndGradeSelectHTML(schoolYear) {
        const subjects = await Controller.getAllSubjects();

        if (schoolYear.grades.length == 0 || subjects.length == 0) return false;

        const fragment = document.createDocumentFragment();
        const blankSelect = document.createElement('select');
        const blankOption = document.createElement('option');
        const blankDiv = document.createElement('div');
        const blankLabel = document.createElement('label');

        // prepare the elements and structure
        const gradeSelect = blankSelect.cloneNode();
        const subjectSelect = blankSelect.cloneNode();
        const gradeLabel = blankLabel.cloneNode();
        const subjectLabel = blankLabel.cloneNode();
        const gradeSelectContainer = blankDiv.cloneNode();
        const subjectSelectContainer = blankDiv.cloneNode();

        gradeSelect.setAttribute('id', 'curriculumGradeSelect');
        subjectSelect.setAttribute('id', 'curriculumSubjectSelect');
        gradeSelectContainer.setAttribute('id', 'gradeSelectContainer');
        subjectSelectContainer.setAttribute('id', 'subjectSelectContainer');

        gradeLabel.textContent = 'Klassenstufe:';
        subjectLabel.textContent = 'Fach:';

        gradeSelectContainer.append(gradeLabel);
        gradeSelectContainer.append(gradeSelect);
        subjectSelectContainer.append(subjectLabel);
        subjectSelectContainer.append(subjectSelect);

        // create the select options and add them
        schoolYear.grades.forEach(grade => {
            const option = blankOption.cloneNode();
            option.setAttribute('value', grade);
            option.textContent = grade;

            gradeSelect.append(option);
        });

        subjects.forEach(entry => {
            const option = blankOption.cloneNode();
            option.setAttribute('value', entry.subject);
            option.textContent = entry.subject;

            subjectSelect.append(option);
        });

        fragment.append(gradeSelectContainer);
        fragment.append(subjectSelectContainer);

        return fragment;
    }

    static async markHolidays(schoolYear, allDays) {
        const dayLookup = {};
        const div = document.createElement('div');

        allDays.forEach(day => {
            if (day.classList.contains('hidden')) return;
            dayLookup[new Date(day.dataset.date).setHours(12)] = day;
        });

        schoolYear.holidays.forEach(holiday => {
            let currentDay = holiday.startDate.setHours(12);
            let holidayNameWrapper = div.cloneNode();
            holidayNameWrapper.classList.add('holidayNameWrapper');

            holidayNameWrapper.textContent = holiday.name;
            if (dayLookup[currentDay]) dayLookup[currentDay].querySelector('.dateContainer').append(holidayNameWrapper);

            // add holiday class to every day in the holiday timespan and additionaly the a name container to mondays
            while (currentDay <= holiday.endDate.setHours(12)) {
                if (!dayLookup[currentDay]) break;
                if (new Date(currentDay).getDay() == 1 && !dayLookup[currentDay].querySelector('.holidayNameWrapper')) {
                    dayLookup[currentDay].querySelector('.dateContainer').append(holidayNameWrapper.cloneNode(true));
                }

                dayLookup[currentDay].classList.add('holiday');
                currentDay += ONEDAY;
            }
        });
    }

    static openSpanForm(spanData = null) {
        const form = document.querySelector('#timeSpanForm');
        const editor = form.querySelector('.textEditor');
        const cancelButton = form.querySelector('#cancelSpanCreationButton');
        const deleteButton = form.querySelector('#deleteSelectedSpanButton');
        const isNewSpan = this.getNewSpan();

        form.querySelector('#cancelSpanCreationButton').removeAttribute('style');
        form.querySelector('#deleteSelectedSpanButton').removeAttribute('style');

        if (this.getEditorType() == 'Holiday Editor') {
            form.querySelector('.editorButtonContainer').classList.add('notDisplayed');
            editor.classList.add('notDisplayed');
            form.querySelector('#resizeTimeSpanFormButton').classList.add('hidden');
        }

        if (this.getEditorType() == 'Curriculum Editor') {
            form.querySelector('#resizeTimeSpanFormButton').classList.remove('hidden');
        }

        if (isNewSpan) deleteButton.style.display = 'none';
        if (!isNewSpan) cancelButton.style.display = 'none';
        if (spanData) {
            form.querySelector('input').value = spanData.name;
            editor.innerHTML = spanData.note;
        }
        if (editor.textContent.trim() == '') editor.innerHTML = '<p><br></p>';

        form.style.display = 'flex';
        this.setSpanEditActive();
        Editor.init(editor);
    }

    static resizeTimeSpanForm() {
        const buttonContainer = document.querySelector('#curriculumNoteEditorButtonContainer');
        const textEditor = document.querySelector('#curriculumSpanNoteEditor');
        const resizeButton = document.querySelector('#resizeTimeSpanFormButton');

        if (buttonContainer.classList.contains('notDisplayed')) {
            buttonContainer.classList.remove('notDisplayed');
            textEditor.classList.remove('notDisplayed');
            resizeButton.style.transform = '';
        } else {
            buttonContainer.classList.add('notDisplayed');
            textEditor.classList.add('notDisplayed');
            resizeButton.style.transform = 'rotate(180deg)';

        }
    }

    static closeSpanForm() {
        const form = document.querySelector('#timeSpanForm');
        const editor = form.querySelector('.textEditor');

        form.removeAttribute('style');
        form.querySelector('input').value = '';

        Editor.clearEditor(editor);

        this.setSpanEditInactive();
    }

    static createNewSpan(event) {
        const target = event.target;
        const allSpanIds = [];

        document.querySelectorAll('.day[data-spanid]').forEach(day => {
            if (!allSpanIds.includes(day.dataset.spanid)) allSpanIds.push(day.dataset.spanid);
        });

        const newSpanId = Math.max(0, ...allSpanIds) + 1;

        target.classList.add('selected');
        target.classList.add('start');
        target.classList.add('end');
        target.setAttribute('data-spanid', newSpanId);
        target.setAttribute('new', '');

        this.setAnchor(target);
        this.renderSpanContentContainer(newSpanId);

        return newSpanId;
    }

    static cancelSpanCreation(spanId) {
        const isNewSpan = this.getNewSpan();
        const allSpanElements = document.querySelectorAll(`.day[data-spanid="${spanId}"]`);

        allSpanElements.forEach(day => {
            if (day.querySelector('.spanContentContainer')) day.querySelector('.spanContentContainer').remove();
            day.classList.remove('selected');
            day.classList.remove('start');
            day.classList.remove('end');
            day.classList.remove('anchor');
            day.removeAttribute('data-spanid')
        });

        document.querySelector('#topicInput').value = '';

        if (isNewSpan) isNewSpan.removeAttribute('new');
    }

    /**@param spanData is the start and end date of the span, as well as its text content,  @param id is the id that is given to the span to identify it later. */
    static renderSpan(id, spanData) {
        const yearContainer = document.querySelector('#yearContainer');
        const allDays = yearContainer.querySelectorAll('.day:not(.hidden)');
        const dayLookup = {};
        const startDate = new Date(spanData.startDate);
        const endDate = new Date(spanData.endDate);
        const startDateTimestamp = startDate.setHours(12, 0, 0, 0);
        const endDateTimestamp = endDate.setHours(12, 0, 0, 0);

        allDays.forEach(day => {
            dayLookup[new Date(day.dataset.date).setHours(12, 0, 0, 0)] = day;
        })

        //first remove all spanId elements
        yearContainer.querySelectorAll(`.day[data-spanId="${id}"]`).forEach(day => {
            day.classList.remove('selected');
            day.classList.remove('start');
            day.classList.remove('end');
            day.removeAttribute('data-spanid');
        });

        //then add them newly based on the saved data
        if (dayLookup[startDateTimestamp]) {
            dayLookup[startDateTimestamp].classList.add('start');
        } else {
            allDays[0].classList.add('start');
        }

        if (dayLookup[endDateTimestamp]) {
            dayLookup[endDateTimestamp].classList.add('end');
        } else {
            allDays[allDays.length - 1].classList.add('end');
        }

        let dayIterator = startDate.setHours(12);

        while (dayIterator <= endDate.setHours(12)) {
            //necessary because of summer and normal time
            let normalizedIterator = new Date(dayIterator).setHours(12);
            if (normalizedIterator != dayIterator) dayIterator = normalizedIterator;

            if (dayLookup[normalizedIterator]) {
                dayLookup[normalizedIterator].classList.add('selected');
                dayLookup[normalizedIterator].setAttribute('data-spanid', id);
            }

            dayIterator += ONEDAY;
        }
    }

    static addHandlesToSpan(spanId) {
        const startElement = document.querySelector(`.day.start[data-spanid="${spanId}"]`);
        const endElement = document.querySelector(`.day.end[data-spanid="${spanId}"]`);

        const startHandleContainer = document.createElement('div');
        const handle = document.createElement('div');

        startHandleContainer.classList.add('handleContainer');
        handle.classList.add('handle');
        startHandleContainer.append(handle);

        const endHandleContainer = startHandleContainer.cloneNode(true);

        startHandleContainer.firstElementChild.classList.add('startHandle');
        endHandleContainer.firstElementChild.classList.add('endHandle');
        endHandleContainer.style.right = `${getComputedStyle(endElement).paddingRight}px`;

        if (startElement == endElement) {
            startElement.append(startHandleContainer);
            startElement.append(endHandleContainer);

            return;
        }

        startElement.append(startHandleContainer);
        endElement.append(endHandleContainer);
    }

    static removeAllHandles() {
        document.querySelectorAll('.handleContainer').forEach(container => container.remove());
    }

    static saveSpan() {
        const topicInput = document.querySelector('#topicInput');
        const firstSpanDay = document.querySelector('.day:has(.startHandle)');
        const lastSpanDay = document.querySelector('.day:has(.endHandle)');
        const spanId = firstSpanDay.dataset.spanid;
        const editor = document.querySelector('#curriculumSpanNoteEditor');
        const editorContent = Editor.serializeNodeContent(editor, true);
        let isNewSpan = this.getNewSpan();

        if (isNewSpan) {
            isNewSpan.removeAttribute('new');
        }

        return {
            id: spanId,
            name: topicInput.value,
            startDate: new Date(firstSpanDay.dataset.date),
            endDate: new Date(lastSpanDay.dataset.date),
            note: editorContent
        }
    }

    static modifySpanRange(event) {
        event.preventDefault();

        if (event.target.hasPointerCapture(event.pointerId))
            event.target.releasePointerCapture(event.pointerId);

        const activeHandle = event.target.querySelector('.handle');
        const spanId = activeHandle.closest('.day').dataset.spanid;
        let oldMouseX, currentMouseX, oldMouseY, currentMouseY;

        oldMouseX = event.x;
        oldMouseY = event.y;

        //set anchor to the other handles parent.
        if (activeHandle.classList.contains('startHandle')) {
            this.setAnchor(document.querySelector('.endHandle').closest('.day'));
        } else {
            this.setAnchor(document.querySelector('.startHandle').closest('.day'));
        }

        function moveActiveHandle(event) {
            event.preventDefault();


            let mouseOffsetX = oldMouseX - event.clientX;
            let mouseOffsetY = oldMouseY - event.clientY;
            oldMouseX = event.clientX;
            oldMouseY = event.clientY;

            activeHandle.style.top = `${activeHandle.offsetTop - mouseOffsetY}px`;
            activeHandle.style.left = `${activeHandle.offsetLeft - mouseOffsetX}px`;
        }

        function adjustSpanLength(event) {
            event.preventDefault();

            if (!event.target.classList.contains('day')) return;

            const focusElement = event.target;
            const anchorElement = document.querySelector('.anchor');
            let [startElement, endElement] = [focusElement, anchorElement];

            if (CurriculumView.comparePosition(anchorElement, focusElement) == "A before B") [startElement, endElement] = [anchorElement, focusElement];

            const allDays = Array.from(document.querySelectorAll('.day:not(.hidden)'));
            let startIndex = allDays.indexOf(startElement);
            let endIndex = allDays.indexOf(endElement);
            const anchorIndex = allDays.indexOf(anchorElement);

            const spanDays = [];

            //prevent the span from expanding into another span 
            let neighboringStart;
            let neighboringEnd;
            let neighboringStartIndex;
            let neighboringEndIndex;

            //find next neighboring start
            for (let i = anchorIndex + 1; i < allDays.length; i++) {
                if (allDays[i].classList.contains('start')) {
                    neighboringStart = allDays[i];
                    neighboringStartIndex = i;
                    break;
                }
            }

            //find next neighboring end
            for (let i = anchorIndex - 1; i > 0; i--) {
                if (allDays[i].classList.contains('end')) {
                    neighboringEnd = allDays[i];
                    neighboringEndIndex = i;
                    break;
                }
            }

            //if the spans start/end index expands into the neighbors, reset them
            if (endIndex >= neighboringStartIndex) endIndex = neighboringStartIndex - 1;
            if (startIndex <= neighboringEndIndex) startIndex = neighboringEndIndex + 1;

            //get all span days and style them
            for (let i = startIndex; i <= endIndex; i++) {
                spanDays.push(allDays[i]);
            }

            allDays.forEach(day => {
                if (day.dataset.spanid == spanId) {
                    day.classList.remove('selected');
                    day.classList.remove('start');
                    day.classList.remove('end');
                    day.removeAttribute('data-spanid');
                }
            });

            spanDays.forEach((day, index) => {
                day.classList.add('selected');
                day.setAttribute('data-spanid', spanId);

                if (index == 0) day.classList.add('start');
                if (index == spanDays.length - 1) day.classList.add('end');
            });

            CurriculumView.renderSpanContentContainer(spanId);

        }

        function endHandleMovement() {
            CurriculumView.removeAllHandles();
            CurriculumView.removeAnchorFromSpan(spanId);
            CurriculumView.addHandlesToSpan(spanId);

            document.removeEventListener('pointermove', moveActiveHandle);
            document.removeEventListener('pointerover', adjustSpanLength);
            document.removeEventListener('pointerup', endHandleMovement);
        }

        document.addEventListener('pointermove', moveActiveHandle);
        document.addEventListener('pointerover', adjustSpanLength);
        document.addEventListener('pointerup', endHandleMovement);
    }

    static setAnchor(element) {
        element.classList.add('anchor');
    }

    static removeAnchorFromSpan(spanId) {
        document.querySelectorAll(`*[data-spanid="${spanId}"]`).forEach(element => element.classList.remove('anchor'));
    }

    static disableTouchActionsOnDayElements() {
        document.querySelectorAll('.day').forEach(day => this.disableTouchActions(day));
    }

    static enableTouchActionsOnDayElements() {
        document.querySelectorAll('.day').forEach(day => this.enableTouchActions(day));
    }

    static renderSpanContentContainer(spanId, spanData = null) {
        const startElement = document.querySelector(`.day.start[data-spanid="${spanId}"]`);
        const endElement = document.querySelector(`.day.end[data-spanid="${spanId}"]`);
        const startWeekNumber = startElement.closest('.week').dataset.row;
        const endWeekNumber = endElement.closest('.week').dataset.row;

        let borderColor = 'var(--topMenuBackgound)'

        if (this.getEditorType() == 'Curriculum Editor') borderColor = this.#getColorOfSelectedCurriculum();

        let textContent;
        document.querySelectorAll(`.spanContentContainer[data-spanid="${spanId}"]`).forEach(container => {
            if (!textContent) textContent = container.textContent;
            container.remove()
        });

        const contentContainer = document.createElement('div');
        contentContainer.classList.add('spanContentContainer');
        contentContainer.setAttribute('data-spanid', spanId);

        let i = startWeekNumber;

        do {
            const weekElement = document.querySelector(`.week[data-row="${i}"]`);
            const currentContainer = contentContainer.cloneNode();

            let firstElement = weekElement.firstElementChild;
            let lastElement = weekElement.lastElementChild;

            //first and last element must not be hidden
            if (firstElement.classList.contains('hidden')) {
                while (firstElement.classList.contains('hidden')) {
                    firstElement = firstElement.nextElementSibling;
                }
            }
            if (lastElement.classList.contains('hidden')) {
                while (lastElement.classList.contains('hidden')) {
                    lastElement = lastElement.previousElementSibling;
                }
            }

            let offset = (parseFloat(getComputedStyle(startElement).paddingLeft) + parseFloat(getComputedStyle(startElement).borderLeftWidth));


            //set the styling depending on the week row
            if (startWeekNumber == endWeekNumber) offset *= 2;
            if (i != startWeekNumber && i != endWeekNumber) offset = 2;

            if (i == startWeekNumber) {
                firstElement = startElement;
                currentContainer.classList.add('start');
                if (spanData) currentContainer.textContent = spanData.name;
                if (textContent) currentContainer.textContent = textContent; //if the span is not a new one and edited, reinsert the old text
            }

            if (i == endWeekNumber) {
                lastElement = endElement;
                currentContainer.classList.add('end');
            }

            const leftRect = firstElement.getBoundingClientRect();
            const rightRect = lastElement.getBoundingClientRect();

            currentContainer.style.width = `${rightRect.right - leftRect.left - offset}px`;
            currentContainer.style.top = `${getComputedStyle(firstElement).paddingTop}`;
            if (borderColor) {
                currentContainer.style.borderColor = borderColor;
                currentContainer.style.backgroundColor = `color-mix(in srgb, ${borderColor} 10%, var(--fadedgrey) 90%)`;
            }

            //append the container
            firstElement.append(currentContainer);

            i++
        } while (i <= endWeekNumber)
    }

    /** If the screen size changes, content containers may have the wrong length. But a full rerender is not necessary or wanted. For example pulling up the android 
    software keyboard triggers an resize event. A full rerender would then remove the curriculum span that was selected beforehand for editing, resulting in the edit to fail.*/
    static resizeSpanContentContainers() {
        const allSpanContainers = document.querySelectorAll('.spanContentContainer');
        const spanContainerById = {};

        allSpanContainers.forEach(container => {
            const id = container.dataset.spanid
            spanContainerById[id] ? spanContainerById[id].push(container) : spanContainerById[id] = [container];
        })

        Object.keys(spanContainerById).forEach(id => {
            spanContainerById[id].forEach(spanContainer => {

                //container spans only one week (start and end in the same week)
                if (spanContainer.classList.contains('start') && spanContainer.classList.contains('end')) {
                    const startElement = document.querySelector(`.day.start[data-spanid="${id}"]`);
                    const endElement = document.querySelector(`.day.end[data-spanid="${id}"]`);

                    let offset = (parseFloat(getComputedStyle(startElement).paddingLeft) + parseFloat(getComputedStyle(startElement).borderLeftWidth));
                    const leftRect = startElement.getBoundingClientRect();
                    const rightRect = endElement.getBoundingClientRect();

                    spanContainer.style.width = `${rightRect.right - leftRect.left - offset * 2}px`;

                    return;
                }

                //container spans the whole week without start and end
                if (!spanContainer.classList.contains('start') && !spanContainer.classList.contains('end')) {
                    const startElement = spanContainer.closest('.day');
                    const endElement = document.querySelector('.day[data-weekdaynumber="0"]');

                    const leftRect = startElement.getBoundingClientRect();
                    const rightRect = endElement.getBoundingClientRect();

                    spanContainer.style.width = `${rightRect.right - leftRect.left}px`;

                    return;
                }

                //container is only start
                if (spanContainer.classList.contains('start')) {
                    const startElement = document.querySelector(`.day.start[data-spanid="${id}"]`);
                    const endElement = document.querySelector('.day[data-weekdaynumber="0"]');

                    let offset = (parseFloat(getComputedStyle(startElement).paddingLeft) + parseFloat(getComputedStyle(startElement).borderLeftWidth));
                    const leftRect = startElement.getBoundingClientRect();
                    const rightRect = endElement.getBoundingClientRect();

                    spanContainer.style.width = `${rightRect.right - leftRect.left - offset}px`;
                }

                //container is only end
                if (spanContainer.classList.contains('end')) {
                    const startElement = document.querySelector('.day[data-weekdaynumber="1"]');
                    const endElement = document.querySelector(`.day.end[data-spanid="${id}"]`);

                    let offset = (parseFloat(getComputedStyle(startElement).paddingLeft) + parseFloat(getComputedStyle(startElement).borderLeftWidth));
                    const leftRect = startElement.getBoundingClientRect();
                    const rightRect = endElement.getBoundingClientRect();

                    spanContainer.style.width = `${rightRect.right - leftRect.left - offset}px`;
                }
            });
        });
    }

    static setDisplayedCurriculumId(id) {
        document.querySelector('#curriculumContainer').dataset.curriculumid = id;
    }

    //show or enable elements
    static showCreateCurriculumButton() {
        document.querySelector('#createCurriculumButton').parentElement.classList.remove('notDisplayed');
    }
    static enableCreateCurriculumButton() {
        document.querySelector('#createCurriculumButton').disabled = false;
    }
    static showSaveCancelNewCurriculumButtonContainer() {
        document.querySelector('#saveCancelNewCurriculumButtonContainer').classList.remove('notDisplayed');
    }
    static enableSaveCurriculumButton() {
        document.querySelector('#saveNewCurriculumButton').disabled = false;
    }
    static showCurriculumSelectionContainer() {
        document.querySelector('#curriculumSelectionContainer').classList.remove('notDisplayed');
    }
    static showCurriculumCreationSelectContainer() {
        document.querySelector('#curriculumCreationSelectContainer').classList.remove('notDisplayed');
    }

    //hide or disable elements
    static hideCreateCurriculumButton() {
        document.querySelector('#createCurriculumButton').parentElement.classList.add('notDisplayed');
    }
    static disableCreateCurriculumButton() {
        document.querySelector('#createCurriculumButton').disabled = true;
    }
    static hideSaveCancelNewCurriculumButtonContainer() {
        document.querySelector('#saveCancelNewCurriculumButtonContainer').classList.add('notDisplayed');
    }
    static disableSaveCurriculumButton() {
        document.querySelector('#saveNewCurriculumButton').disabled = true;
    }
    static hideCurriculumSelectionContainer() {
        document.querySelector('#curriculumSelectionContainer').classList.add('notDisplayed');
    }
    static hideCurriculumCreationSelectContainer() {
        document.querySelector('#curriculumCreationSelectContainer').classList.add('notDisplayed');
    }
    static hideCloseHolidayEditorButton() {
        document.querySelector('#closeHolidayEditorButton').classList.add('notDisplayed');
    }

    //set span edit status active/inactive
    static setSpanEditActive() {
        document.querySelector('div[data-span_edit_active]').dataset.span_edit_active = 'true';
    }
    static setSpanEditInactive() {
        document.querySelector('div[data-span_edit_active]').dataset.span_edit_active = 'false';
    }

    //validation alerts
    static alertCurriculumAlreadyExists() {
        const alertRing = document.querySelector('#curriculumCreationSelectErrorDisplay');

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    //error messages
    static showCurriculumAlreadyExistsError() {
        const messageContainer = document.querySelector('#curriculumCreationSelectErrorDisplay');
        messageContainer.classList.remove('notDisplayed');
    }

    static hideCurriculumAlreadyExistsError() {
        const messageContainer = document.querySelector('#curriculumCreationSelectErrorDisplay');
        messageContainer.classList.add('notDisplayed');
    }

    //helper function
    static getPaddingPlusBorderWidth(element) {
        const properties = getComputedStyle(element);
        const paddingLeft = parseFloat(properties.paddingLeft);
        const paddingRight = parseFloat(properties.paddingRight);
        const borderLeft = parseFloat(properties.borderLeft);
        const borderRight = parseFloat(properties.borderRight);

        return paddingLeft + paddingRight + borderLeft + borderRight;
    }

    static comparePosition(elementA, elementB) {
        let position = elementA.compareDocumentPosition(elementB);
        if (position == Node.DOCUMENT_POSITION_PRECEDING) return 'A after B';
        if (position == Node.DOCUMENT_POSITION_FOLLOWING) return 'A before B';

        return 'same element';
    }

    static disableTouchActions(element) {
        element.classList.add('noTouchActions');
    }

    static enableTouchActions(element) {
        element.classList.remove('noTouchActions');
    }

    static getEditorType() {
        if (document.querySelector('#yearContainer').classList.contains('holidayEditor')) return 'Holiday Editor';
        if (document.querySelector('#yearContainer').classList.contains('curriculumEditor')) return 'Curriculum Editor';
    }

    static getSpanId(event) {
        return event.target.closest('.day').dataset.spanid;
    }

    static getActiveSpanId() {
        const activeSpan = document.querySelector('.day:has(.handleContainer)');
        let activeSpanId;

        if (activeSpan) activeSpanId = activeSpan.dataset.spanid;

        if (activeSpanId) return activeSpanId;

        return false
    }

    static getNewSpan() {
        const spanElementWithNewTag = document.querySelector('.day[new]');

        if (spanElementWithNewTag) return spanElementWithNewTag;

        return false;
    }

    static getDisplayedCurriculumId() {
        return document.querySelector('#curriculumContainer').dataset.curriculumid;
    }

    static getSelectedSubjectAndGrade() {
        const gradeSelect = document.querySelector('#curriculumGradeSelect');
        const subjectSelect = document.querySelector('#curriculumSubjectSelect');

        if (gradeSelect && subjectSelect) {
            return {
                subject: subjectSelect.value,
                grade: gradeSelect.value
            }
        }

        return false;
    }

    static #getColorOfSelectedCurriculum() {
        const curriculumContainer = document.querySelector('#curriculumContainer');
        let selectedCurriculum = curriculumContainer.querySelector('.curriculumSelectionItem.selected');

        //is there a plan in creation? get the color of the selected subject from the timetable/subjects view
        if (!selectedCurriculum) {
            const subjectSelect = document.querySelector('#curriculumSubjectSelect');
            const selectedSubject = subjectSelect.value;

            selectedCurriculum = document.querySelector(`.subjectListItem[data-subject="${selectedSubject}"]`)
        }

        // still nothing found? return a fallback color
        if (!selectedCurriculum) return 'var(--labelgrey)'

        const props = getComputedStyle(selectedCurriculum);

        return props.backgroundColor;
    }
}