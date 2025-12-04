import { ONEDAY } from "../index.js";
import AbstractView from "./AbstractView.js";
import Controller from '../Controller/CurriculumController.js';

export default class CurriculumView extends AbstractView {
    static renderEmptyCalendar(startDate = null, endDate = null) {
        const yearContainer = document.querySelector('#yearContainer');
        const editorNameSpan = document.querySelector('#editorNameSpan');

        if (startDate && startDate instanceof Date == false) startDate = new Date(startDate);
        if (endDate && endDate instanceof Date == false) endDate = new Date(endDate);

        while (yearContainer.firstElementChild) {
            yearContainer.firstElementChild.remove();
        }

        editorNameSpan.textContent = 'Stoffverteilungsplan';

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
                    yearContainer.appendChild(currentMonth);
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
                            <div class="dayDate">${currentDay.getDate()}.</div>
                        </div>
                    `;
            });

            if (currentDay.setHours(12) == endDate) {
                isYearCompleted = true;
                currentMonth.appendChild(currentWeek);
                yearContainer.appendChild(currentMonth);
            }

            currentWeek.dataset.row = rowCounter;
            dateIterator += ONEDAY;
        } while (!isYearCompleted);


        //hide empty day containers
        yearContainer.querySelectorAll('.day').forEach(day => {
            if (day.children.length == 0) day.classList.add('hidden');
        });

        document.querySelector('#dayNameContainer').removeAttribute('style');
    }

    static openHolidayEditor(schoolYear) {
        const yearContainer = document.querySelector('#yearContainer');

        schoolYear.holidays.forEach((holiday, id) => {
            this.renderSpan(id, holiday);
            this.renderSpanContentContainer(id, holiday);
        });

        yearContainer.classList.remove('curriculumEditor');
        yearContainer.classList.add('holidayEditor');

        document.querySelector('#closeHolidayEditorButton').classList.remove('notDisplayed');
        document.querySelector('#editorNameSpan').textContent = `Ferien und freie Tage ${schoolYear.name}`;
    }

    static closeHolidayEditor() {
        document.querySelector('#closeHolidayEditorButton').classList.add('notDisplayed');
    }

    static renderSchoolYearCurriculumEditor(schoolYear) {
        const yearContainer = document.querySelector('#yearContainer');
        const allDays = yearContainer.querySelectorAll('.day');

        yearContainer.classList.remove('holidayEditor');
        yearContainer.classList.add('curriculumEditor');

        document.querySelector('#editorNameSpan').textContent = `Stoffverteilungsplan ${schoolYear.name}`;
        this.markHolidays(schoolYear, allDays);
        // get the curriculum from the database and render every single span...this is not going to be fun

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
            dayLookup[currentDay].querySelector('.dateContainer').append(holidayNameWrapper);

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

    static activateSpanEditing(spanData) {
        const form = document.querySelector('#addTimespanForm');

        form.style.display = 'flex';
        if (spanData) form.querySelector('input').value = spanData.name;

        document.querySelector('div[data-span_edit_active]').dataset.span_edit_active = 'true';
    }

    static deactivateSpanEditing() {
        const form = document.querySelector('#addTimespanForm');

        form.removeAttribute('style');
        form.querySelector('input').value = '';

        document.querySelector('div[data-span_edit_active]').dataset.span_edit_active = 'false';
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
        const firstSpanDay = document.querySelector('.day:has(.handleContainer)');
        const spanId = firstSpanDay.dataset.spanid;
        const allSpanElements = document.querySelectorAll(`.day[data-spanid="${spanId}"]`);
        let isNewSpan = this.getNewSpan()

        if (isNewSpan) {
            isNewSpan.removeAttribute('new');
        }

        firstSpanDay.querySelector('.spanContentContainer').textContent = topicInput.value;

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

        let textContent;
        document.querySelectorAll(`.spanContentContainer[data-spanid="${spanId}"]`).forEach(container => {
            textContent = container.textContent;
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
            }

            if (i == endWeekNumber) {
                lastElement = endElement;
                currentContainer.classList.add('end');
            }

            const leftRect = firstElement.getBoundingClientRect();
            const rightRect = lastElement.getBoundingClientRect();

            currentContainer.style.width = `${rightRect.right - leftRect.left - offset}px`;
            currentContainer.style.top = `${getComputedStyle(firstElement).paddingTop}`;

            //append the container
            if (textContent) currentContainer.textContent = textContent; //if the span is not a new one and edited, reinsert the old text
            if (spanData) currentContainer.textContent = spanData.name;
            firstElement.append(currentContainer);

            i++
        } while (i <= endWeekNumber)
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
}