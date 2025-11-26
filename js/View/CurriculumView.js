import AbstractView from "./AbstractView.js";

export default class CurriculumView extends AbstractView {
    static renderEmptyCalendar() {
        const yearContainer = document.querySelector('#yearContainer');
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

        let today = new Date();
        let monthIterator = 0;
        let rowCounter = 0;
        let dateIterator = new Date(`${today.getFullYear()}-01-01`).setHours(12, 0, 0, 0);
        let oneday = 86400000;

        let blankMonth = document.createElement('div');
        let blankWeek = document.createElement('div');

        blankMonth.classList.add('month');
        blankMonth.innerHTML = `
                <div class="monthName">Januar</div>
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

            if (currentDay.getMonth() != monthIterator) {
                currentMonth.appendChild(currentWeek);
                currentWeek = blankWeek.cloneNode(true);
                rowCounter++;

                yearContainer.appendChild(currentMonth);
                currentMonth = blankMonth.cloneNode(true);
                currentMonth.querySelector('.monthName').textContent = monthNames[currentDay.getMonth()];
                monthIterator++;
            }

            if (currentDay.getDay() == 1 && currentWeek.querySelector('.dateContainer')) {
                currentMonth.appendChild(currentWeek);

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

            if (currentDay.getDate() == 31 && currentDay.getMonth() == 11) {
                isYearCompleted = true;
                currentMonth.appendChild(currentWeek);
                yearContainer.appendChild(currentMonth);
            }

            currentWeek.dataset.row = rowCounter;
            dateIterator += oneday;
        } while (!isYearCompleted);

        yearContainer.querySelectorAll('.day').forEach(day => {
            if (day.children.length == 0) day.classList.add('hidden');
        });
    }



    static activateSpanEditing() {
        document.querySelector('div[data-span_edit_active]').dataset.span_edit_active = 'true';
        document.querySelector('#addTimespanForm').style.display = 'block';
    }

    static deactivateSpanEditing() {
        document.querySelector('div[data-span_edit_active]').dataset.span_edit_active = 'false';
        document.querySelector('#addTimespanForm').removeAttribute('style');
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
        this.drawSpanContentContainer(newSpanId);

        return newSpanId;
    }

    static cancelSpanCreation() {
        const spanElement = document.querySelector('.day:has(.handleContainer)');
        const isNewSpan = this.getNewSpan();

        const spanId = spanElement.dataset.spanid
        const allSpanElements = document.querySelectorAll(`.day[data-spanid="${spanId}"]`);

        allSpanElements.forEach(day => {
            day.classList.remove('selected');
            // day.classList.remove('active');
            day.classList.remove('start');
            day.classList.remove('end');
            day.classList.remove('anchor');
            day.removeAttribute('data-spanid')
        });

        document.querySelector('#topicInput').value = '';

        if (this.isNewSpan) {
            this.isNewSpan.removeAttribute('new');

            return;
        }

        this.drawSpan(spanId);
    }

    static drawSpan(spanId) {
        console.log('i will get the span data by its id and redraw it the way it was saved. But this is not ready yet');
        //first remove all spanId elements
        //then add them newly based on the saved data
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

            CurriculumView.drawSpanContentContainer(spanId);

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

    static drawSpanContentContainer(spanId) {
        const startElement = document.querySelector(`.day.start[data-spanid="${spanId}"]`);
        const endElement = document.querySelector(`.day.end[data-spanid="${spanId}"]`);
        const startWeekNumber = startElement.closest('.week').dataset.row;
        const endWeekNumber = endElement.closest('.week').dataset.row;
        const startElementRect = startElement.getBoundingClientRect();
        const endElementRect = endElement.getBoundingClientRect();
        const elementStyle = getComputedStyle(startElement);

        document.querySelectorAll(`.spanContentContainer[data-spanid="${spanId}"]`).forEach(container => container.remove());

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
            firstElement.append(currentContainer);

            i++
        } while (i <= endWeekNumber)
    }

    static getPaddingPlusBorderWidth(element) {
        const properties = getComputedStyle(element);
        const paddingLeft = parseFloat(properties.paddingLeft);
        const paddingRight = parseFloat(properties.paddingRight);
        const borderLeft = parseFloat(properties.borderLeft);
        const borderRight = parseFloat(properties.borderRight);

        return paddingLeft + paddingRight + borderLeft + borderRight;
    }

    //helper function
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
}