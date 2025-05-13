import Controller from "../Controller/LessonController.js";
import AbstractView from "./AbstractView.js";
import Fn from '../inc/utils.js'

export default class LessonView {

    static renderLesson() {
        console.log('hier');
        this.removeAllLessons()
        let monday = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
        let sunday = document.querySelector('.weekday[data-weekday_number="0"]').dataset.date;

        let regularLessons = Controller.getScheduledLessons();
        let lessonChanges = Controller.getTimetableChanges(monday, sunday);

        let timetableValidDates = [];
        let validDateOfTimetableDisplayed;
        let counter = 1;

        //get the correct timetable for the displayed week
        regularLessons.forEach(lesson => {
            if (!timetableValidDates.includes(lesson.validFrom)) timetableValidDates.push(lesson.validFrom);
        })

        validDateOfTimetableDisplayed = timetableValidDates[timetableValidDates.length - counter];

        //and count back until the validity date of the timetable is smaller than the currently displayed sunday
        while (new Date(validDateOfTimetableDisplayed).setHours(12, 0, 0, 0) > new Date(sunday).setHours(12, 0, 0, 0)) {
            counter += 1;
            validDateOfTimetableDisplayed = timetableValidDates[timetableValidDates.length - counter];
        }

        //now render the lessons with the correct validity date
        regularLessons.forEach((lesson) => {

            if (lesson.validFrom != validDateOfTimetableDisplayed) return;

            let timeslot = LessonView.#getTimeslotOfLesson(lesson);
            let lessonDate = timeslot.closest('.weekday').dataset.date;
            let lessonOptionsHTML = `
                        <div class="lessonOption"><button data-update_lesson>bearbeiten</button></div>
                        <div class="lessonOption"><button data-add_new_task>neue Aufgabe</button></div>
                        <div class="lessonOption"><button data-lesson_canceled>fällt aus</button></div>
            `;

            //deactive the lesson options, when the weekday it is rendered on already passed
            if (timeslot.closest('.weekday').classList.contains('passed')) {
                lessonOptionsHTML = `
                    <div class="lessonOption lessonPastMessage"><button>Stunde hat bereits stattgefunden.</button></div>
                    <div class="lessonOption lessonPastMessage responsive"><button>Stunde hat bereits statt-gefunden.</button></div>
                `;
            }

            //is the lesson a appointement, use change the undefined cssColorClass to appointement
            if (lesson.subject == 'Termin') lesson.cssColorClass = 'appointement';

            timeslot.innerHTML = `
                <div class="lesson ${lesson.cssColorClass}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}" data-date="${lessonDate}">
                    <div class="lessonHasTaskIndicator"></div>
                    <div class="lessonContentContainer" style="width: 100%;">
                        <div class="spacerBlock"></div>
                        <div class="lessonClassSubjectField">${lesson.class} ${lesson.subject}</div>
                        <div class="lessonMenuWrapper">
                            <div style="display: flex; justify-content: left; align-items: center; width: 1.5rem;">
                                <button class="lessonOptionsButton">&#x2630;</button>
                            </div>
                        </div>
                    </div>
                    <div style="display: none;" class="${lesson.cssColorClass} light lessonOptionsWrapper">
                        ${lessonOptionsHTML}
                    </div>   
                </div>`;
        })

        //reflect timetable changes
        lessonChanges.forEach((lesson) => {

            let timeslot = LessonView.#getTimeslotOfLesson(lesson);

            //setting a bunch of css classes, determining the look of the lesson and lesson menu depending on its status
            let canceled = '';
            let optionsColorClass = 'light';
            let lessonOptionsHTML = `
                    <div class="lessonOption"><button data-update_lesson>bearbeiten</button></div>
                    <div class="lessonOption"><button data-add_new_task>neue Aufgabe</button></div>
                    <div class="lessonOption"><button data-lesson_canceled>fällt aus</button></div>
            `;

            if (lesson.canceled == 'true') {
                canceled = 'canceled';
                optionsColorClass = ''
                lessonOptionsHTML = `
                    <div class="lessonOption"><button data-lesson_uncanceled>findet statt</button></div>
                `;
            }
            //deactive the lesson options, when the weekday it is rendered on already passed
            if (timeslot.closest('.weekday').classList.contains('passed')) {
                lessonOptionsHTML = `
                        <div class="lessonOption lessonPastMessage"><button>Stunde hat bereits stattgefunden.</button></div>
                        <div class="lessonOption lessonPastMessage responsive"><button>Stunde hat bereits statt-gefunden.</button></div>
                `;
            }

            //is the lesson a appointement, use change the undefined cssColorClass to appointement
            if (lesson.subject == 'Termin') lesson.cssColorClass = 'appointement';

            timeslot.innerHTML = `
                <div class="lesson ${lesson.cssColorClass} ${canceled}" data-id="${lesson.id}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}" data-date="${lesson.date}">
                    <div class="lessonHasTaskIndicator"></div>
                    <div class="lessonContentContainer" style="width: 100%;">
                        <div class="spacerBlock"></div>
                        <div class="lessonClassSubjectField">${lesson.class} ${lesson.subject}</div>
                        <div class="lessonMenuWrapper">
                            <div style="display: flex; justify-content: left; align-items: center; width: 1.5rem;">
                                <button class="lessonOptionsButton">&#x2630;</button>
                            </div>
                        </div>
                    </div>
                    <div style="display: none;" class="${lesson.cssColorClass} ${optionsColorClass} lessonOptionsWrapper ${canceled}">
                        ${lessonOptionsHTML}
                    </div>    
                </div>`;
        })

        this.showLessonHasTaskIndicator();

        document.querySelectorAll('.lesson').forEach((lesson) => {
            lesson.addEventListener('mouseenter', AbstractView.highlightTask);
            lesson.addEventListener('mouseleave', AbstractView.removeTaskHighlight);

            lesson.querySelector('.lessonOptionsButton').addEventListener('click', LessonView.showLessonOptions);
            lesson.addEventListener('mouseleave', LessonView.hideLessonsOptions);

            lesson.parentElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
            lesson.parentElement.removeEventListener('click', LessonView.createLessonForm);
        });
    }

    static renderNewLesson(lesson) {
        let timeslot = LessonView.#getTimeslotOfLesson(lesson);

        //is the lesson a appointement, use change the undefined cssColorClass to appointement
        if (lesson.subject == 'Termin') lesson.cssColorClass = 'appointement';

        timeslot.innerHTML = `
                <div class="lesson ${lesson.cssColorClass}" data-id="${lesson.id}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}" data-date="${lesson.date}">
                    <div class="lessonHasTaskIndicator"></div>
                    <div class="lessonContentContainer" style="width: 100%;">
                        <div class="spacerBlock"></div>
                        <div class="lessonClassSubjectField">${lesson.class} ${lesson.subject}</div>
                        <div class="lessonMenuWrapper">
                            <div style="display: flex; justify-content: left; align-items: center; width: 1.5rem;">
                                <button class="lessonOptionsButton">&#x2630;</button>
                            </div>
                        </div>
                    </div>
                    <div style="display: none;" class="${lesson.cssColorClass} light lessonOptionsWrapper">
                        <div class="lessonOption"><button data-update_lesson>bearbeiten</button></div>
                        <div class="lessonOption"><button data-add_new_task>neue Aufgabe</button></div>
                        <div class="lessonOption"><button data-lesson_canceled>fällt aus</button></div>
                    </div>    
                </div>`;

        this.showLessonHasTaskIndicator();

        timeslot.querySelector('.lessonOptionsButton').addEventListener('click', LessonView.showLessonOptions);
        timeslot.querySelector('.lesson').addEventListener('mouseleave', LessonView.hideLessonsOptions);
        timeslot.querySelector('.lesson').addEventListener('mouseenter', AbstractView.highlightTask);
        timeslot.querySelector('.lesson').addEventListener('mouseleave', AbstractView.removeTaskHighlight);
    }

    static showLessonHasTaskIndicator() {
        let taskContainer = document.querySelector('#taskContainer')
        let allLessons = document.querySelectorAll('.lesson');

        allLessons.forEach(lesson => {
            taskContainer.querySelectorAll('tr[data-date]').forEach((taskRow) => {

                if (new Date(taskRow.dataset.date).setHours(12, 0, 0, 0) != new Date(lesson.dataset.date).setHours(12, 0, 0, 0)) return;
                if (taskRow.querySelector('td[data-class]').dataset.class != lesson.dataset.class) return;
                if (taskRow.querySelector('td[data-subject').dataset.subject != lesson.dataset.subject) return;
                if (taskRow.dataset.timeslot != lesson.closest('.timeslot').dataset.timeslot) return;

                lesson.querySelector('.lessonHasTaskIndicator').style.backgroundColor = 'var(--contentContainerBackground)';
            });
        });
    }

    static createLessonForm(event, oldLessonData = undefined) {

        let timeslotElement = event.target.closest('.timeslot');

        if (timeslotElement.closest('.weekday').classList.contains('passed')) return;

        let timeslotProps = timeslotElement.getBoundingClientRect()
        let timetableProps = document.querySelector('.weekOverview').getBoundingClientRect();
        let subjectSelectHTML = AbstractView.getSubjectSelectHTML()

        let lessonFormHTML = `
            <form id="lessonForm">
                <div class="lessonForm">
                    <div class="alertRing"><input type="text" name="class" id="class" placeholder="Klasse" style="width: 4rem;"></div>
                    <div class="alertRing">${subjectSelectHTML}</div>
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

        timeslotElement.querySelector('#lessonForm').addEventListener('submit', LessonView.saveNewLesson);

        timeslotElement.querySelector('.discardNewLessonButton').addEventListener('click', (event) => LessonView.removeLessonForm(event));
        timeslotElement.querySelector('.lessonForm').addEventListener('mouseenter', AbstractView.removeAddLessonButton);

        //timeslot event handlers
        timeslotElement.removeEventListener('click', LessonView.createLessonForm);
        timeslotElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
    }

    static createUpdateLessonForm(event, oldLessonData) {
        let timeslotElement = event.target.closest('.timeslot');

        let timeslotProps = timeslotElement.getBoundingClientRect()
        let timetableProps = document.querySelector('.weekOverview').getBoundingClientRect();
        let subjectSelectHTML = AbstractView.getSubjectSelectHTML()

        let lessonFormHTML = `
            <form id="lessonForm">
                <div class="lessonForm">
                    <div class="alertRing"><input type="text" name="class" id="class" placeholder="Klasse" style="width: 4rem;" value="${oldLessonData.class}"></div>
                    <div class="alertRing">${subjectSelectHTML}</div>
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
        timeslotElement.querySelector('#lessonForm').addEventListener('submit', (event) => {
            LessonView.saveLessonUpdate(event, oldLessonData)
        });

        timeslotElement.querySelector('.discardNewLessonButton').addEventListener('click', (event) => LessonView.removeLessonForm(event, true));
        timeslotElement.querySelector('.lessonForm').addEventListener('mouseenter', AbstractView.removeAddLessonButton);

        //timeslot event handlers
        // timeslotElement.removeEventListener('click', LessonView.createLessonForm);
        // timeslotElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
    }

    static saveNewLesson(event) {
        event.preventDefault();

        let timeslotElement = event.target.closest('.timeslot');

        let lessonData = {
            'date': timeslotElement.closest('.weekday').dataset.date,
            'timeslot': timeslotElement.dataset.timeslot,
            'class': timeslotElement.querySelector('#class').value.toLowerCase(),
            'subject': timeslotElement.querySelector('#subject').value,
            'type': 'sub',
            'canceled': 'false'
        }

        Controller.saveNewLesson(lessonData);
    }

    /* The lesson update function doesn't really update the lesson, but stores a new on end sets the old one canceled.
   Both is necessary to ensure, tasks are correctly assigned and shown in the right order. */
    static prepareLessonUpdate(event) {

        let lessonElement = event.target.closest('.lesson');
        let oldLessonData;

        oldLessonData = {
            'date': lessonElement.dataset.date,
            'timeslot': lessonElement.dataset.timeslot,
            'class': lessonElement.dataset.class,
            'subject': lessonElement.dataset.subject,
            'type': 'sub',
            'canceled': 'true'
        }

        LessonView.createUpdateLessonForm(event, oldLessonData);
    }

    static saveLessonUpdate(event, oldLessonData) {
        event.preventDefault();

        let timeslotElement = event.target.closest('.timeslot');

        let newLessonData = {
            'date': timeslotElement.closest('.weekday').dataset.date,
            'timeslot': timeslotElement.dataset.timeslot,
            'class': timeslotElement.querySelector('#class').value.toLowerCase(),
            'subject': timeslotElement.querySelector('#subject').value,
            'type': 'sub',
            'canceled': 'false'
        }

        Controller.updateLesson(newLessonData, oldLessonData);

        // LessonView.removeLessonForm(event);
    }

    static setLessonCanceled(event) {

        let lessonElement = event.target.closest('.lesson');
        let optionsWrapper = lessonElement.querySelector('.lessonOptionsWrapper');
        let lessonData = lessonElement.dataset.id == undefined ? LessonView.#getLessonDataFromElement(event) : Controller.getLessonById(lessonElement.dataset.id);
        lessonData.canceled = 'true';

        let lessonId = Controller.setLessonCanceled(lessonData);

        lessonElement.classList.add('canceled');
        lessonElement.dataset.id = lessonId;
        optionsWrapper.classList.add('canceled');
        optionsWrapper.classList.remove('light');

        // change the menu options
        optionsWrapper.style.display = 'none';
        optionsWrapper.innerHTML = '<div class="lessonOption"><button data-lesson_uncanceled>findet statt</button></div>'
        optionsWrapper.querySelector('button[data-lesson_uncanceled]').addEventListener('click', LessonView.setLessonNotCanceled);
    }

    static setLessonNotCanceled(event) {
        let lessonElement = event.target.closest('.lesson');
        let optionsWrapper = lessonElement.querySelector('.lessonOptionsWrapper');
        let lessonData = LessonView.#getLessonDataFromElement(event);

        Controller.setLessonNotCanceled(lessonData);

        lessonElement.dataset.id = lessonData.id;
        lessonElement.classList.remove('canceled');
        optionsWrapper.classList.remove('canceled');
        optionsWrapper.classList.add('light');

        // change the menu options
        optionsWrapper.style.display = 'none';
        optionsWrapper.innerHTML = `
            <div class="lessonOption"><button data-update_lesson>bearbeiten</button></div>
            <div class="lessonOption"><button data-add_new_task>neue Aufgabe</button></div>
            <div class="lessonOption"><button data-lesson_canceled>fällt aus</button></div>
        `;

        optionsWrapper.querySelector('button[data-update_lesson]').addEventListener('click', LessonView.createLessonForm);
        optionsWrapper.querySelector('button[data-add_new_task]').addEventListener('click', Controller.createNewTask);
        optionsWrapper.querySelector('button[data-lesson_canceled]').addEventListener('click', LessonView.setLessonCanceled);
    }

    static removeLessonForm(event, discardedLesson = false) {
        event.stopPropagation();

        let timeslotElement = event.target.closest('.timeslot');
        let createLessonForm = event.target.closest('#lessonForm');

        createLessonForm.remove();


        if (discardedLesson) {
            LessonView.renderLesson();
            return;
        }

        timeslotElement.addEventListener('click', LessonView.createLessonForm);
        timeslotElement.addEventListener('mouseenter', AbstractView.showAddLessonButton);
    }

    static showLessonOptions(event) {
        let optionsWrapper = event.target.closest('.lesson').querySelector('.lessonOptionsWrapper');

        if (optionsWrapper.style.display == 'none') {
            optionsWrapper.style.display = 'block';

            let weekContainerProperties = document.querySelector('.weekOverview').getBoundingClientRect();
            let optionsWrapperProperties = optionsWrapper.getBoundingClientRect();
            let verticalOffset = (optionsWrapperProperties.height + 20) * -1;

            if (optionsWrapperProperties.bottom > weekContainerProperties.bottom) {
                optionsWrapper.style.translate = `0 ${verticalOffset}px`;
            }

            if (optionsWrapper.querySelector('button[data-update_lesson]')) optionsWrapper.querySelector('button[data-update_lesson]').addEventListener('click', LessonView.prepareLessonUpdate);
            if (optionsWrapper.querySelector('button[data-add_new_task]')) optionsWrapper.querySelector('button[data-add_new_task]').addEventListener('click', Controller.createNewTask);
            if (optionsWrapper.querySelector('button[data-lesson_canceled]')) optionsWrapper.querySelector('button[data-lesson_canceled]').addEventListener('click', LessonView.setLessonCanceled);
            if (optionsWrapper.querySelector('button[data-lesson_uncanceled]')) optionsWrapper.querySelector('button[data-lesson_uncanceled]').addEventListener('click', LessonView.setLessonNotCanceled);

        } else {
            LessonView.hideLessonsOptions(event);
        }
    }

    static hideLessonsOptions(event) {
        event.target.closest('.lesson').querySelector('.lessonOptionsWrapper').style.display = 'none';
    }

    static removeAllLessons(weekTable = undefined) {
        if (!weekTable) weekTable = document.querySelector('#weekOverviewContainer');


        weekTable.querySelectorAll('.lesson').forEach((lesson) => {

            lesson.closest('.timeslot').addEventListener('mouseenter', AbstractView.showAddLessonButton);
            lesson.closest('.timeslot').addEventListener('click', LessonView.createLessonForm);

            lesson.remove();
        });
    }

    static #getTimeslotOfLesson(lesson) {

        let allWeekdays = document.querySelectorAll('.weekday');
        let weekday;
        let timeslot;

        if (!lesson.date) {
            allWeekdays.forEach((day) => { if (day.dataset.weekday_number == lesson.weekday) weekday = day });
            weekday.querySelectorAll('.timeslot').forEach((slot) => { if (slot.dataset.timeslot == lesson.timeslot) timeslot = slot });

            return timeslot;
        }

        allWeekdays.forEach((day) => {
            let dateOfWeekday = new Date(day.dataset.date).setHours(0, 0, 0, 0)
            let dateOfLesson = new Date(lesson.date).setHours(0, 0, 0, 0);

            if (dateOfWeekday == dateOfLesson) weekday = day;
        });

        weekday.querySelectorAll('.timeslot').forEach((slot) => { if (slot.dataset.timeslot == lesson.timeslot) timeslot = slot; });

        return timeslot;
    }

    static #getLessonDataFromElement(event) {
        let lessonElement = event.target.closest('.lesson');
        let isSubstitute = 'normal';

        if (lessonElement.dataset.id) {
            let lessonData = Controller.getLessonById(lessonElement.dataset.id);
            isSubstitute = lessonData.type;

            return lessonData;
        }

        return {
            'class': lessonElement.dataset.class,
            'subject': lessonElement.dataset.subject,
            'date': lessonElement.closest('.weekday').dataset.date,
            'weekday': lessonElement.closest('.weekday').dataset.weekday_number,
            'timeslot': lessonElement.closest('.timeslot').dataset.timeslot,
            'type': isSubstitute
        }
    }

    // input validation

    static alertSubjectSelect() {
        let alertRing = document.querySelector('#subject').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertClassInput() {
        let alertRing = document.querySelector('#class').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}