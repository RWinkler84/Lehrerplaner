import Controller from "../Controller/LessonController.js";
import AbstractView from "./AbstractView.js";
import Fn from '../inc/utils.js'
import Editor from "../inc/editor.js";

export default class LessonView {

    static async renderLesson() {
        this.removeAllLessons()

        let monday = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
        let sunday = document.querySelector('.weekday[data-weekday_number="0"]').dataset.date;

        let regularLessons = await Controller.getRegularLessonsForCurrentWeek(monday, sunday);
        let lessonChanges = await Controller.getTimetableChanges(monday, sunday);
        let allSubjects = await Controller.getAllSubjects();

        //now render the lessons with the correct validity date
        regularLessons.forEach(lesson => {

            let timeslot = LessonView.#getTimeslotOfLesson(lesson);
            let lessonDate = timeslot.closest('.weekday').dataset.date;
            let lessonOptionsHTML = `
                        <div class="lessonOption"><button data-update_lesson>bearbeiten</button></div>
                        <div class="lessonOption"><button data-add_new_task>neue Aufgabe</button></div>
                        <div class="lessonOption"><button data-add_note>Notiz</button></div>
                        <div class="lessonOption"><button data-lesson_canceled>fällt aus</button></div>
            `;

            lesson.cssColorClass = Fn.getCssColorClass(lesson, allSubjects);

            //deactive the lesson options, when the weekday it is rendered on already passed
            if (timeslot.closest('.weekday').classList.contains('passed')) {
                lessonOptionsHTML = `
                        <div class="lessonOption"><button data-add_note>Notiz</button></div>
                `;
            }

            //is the lesson a appointement, use change the undefined cssColorClass to appointement
            if (lesson.subject == 'Termin') lesson.cssColorClass = 'appointement';

            timeslot.innerHTML = `
                <div class="lesson ${lesson.cssColorClass}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}" data-date="${lessonDate}" data-created="${lesson.created}">
                    <div class="lessonContentContainer" style="width: 100%;">
                        <div class="flex column spaceBetween lessonIndicatorContainer" style="width: 1rem; height: 100%;">
                            <div class="lessonHasTaskIndicator"></div>
                            <div class="lessonNoteIndicator"><div class="noteIcon lessonNoteIcon"></div></div>
                        </div>
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
                    <div class="lessonOption"><button data-add_note>Notiz</button></div>
                    <div class="lessonOption"><button data-lesson_canceled>fällt aus</button></div>
            `;

            lesson.cssColorClass = Fn.getCssColorClass(lesson, allSubjects);

            if (lesson.canceled == 'true') {
                canceled = 'canceled';
                optionsColorClass = ''
                lessonOptionsHTML = `
                    <div class="lessonOption"><button data-add_note>Notiz</button></div>
                    <div class="lessonOption"><button data-lesson_uncanceled>findet statt</button></div>
                `;
            }
            //deactive the lesson options, when the weekday it is rendered on already passed
            if (timeslot.closest('.weekday').classList.contains('passed')) {
                lessonOptionsHTML = `
                    <div class="lessonOption"><button data-add_note>Notiz</button></div>
                `;
            }

            //is the lesson a appointement, use change the undefined cssColorClass to appointement
            if (lesson.subject == 'Termin') lesson.cssColorClass = 'appointement';

            timeslot.innerHTML = `
                <div class="lesson ${lesson.cssColorClass} ${canceled}" data-id="${lesson.id}" data-class="${lesson.class}" data-subject="${lesson.subject}" data-timeslot="${lesson.timeslot}" data-date="${lesson.date}" data-created="${lesson.created}">
                    <div class="lessonContentContainer" style="width: 100%;">
                        <div class="flex column spaceBetween lessonIndicatorContainer" style="width: 1rem; height: 100%;">
                            <div class="lessonHasTaskIndicator"></div>
                            <div class="lessonNoteIndicator"><div class="noteIcon lessonNoteIcon"></div></div>
                        </div>
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
        this.showLessonHasNoteIndicator();

        document.querySelectorAll('.lesson').forEach((lesson) => {
            lesson.addEventListener('mouseenter', AbstractView.highlightTask);
            lesson.addEventListener('mouseleave', AbstractView.removeTaskHighlight);

            lesson.querySelector('.lessonOptionsButton').addEventListener('click', LessonView.showLessonOptions);
            lesson.addEventListener('mouseleave', LessonView.hideLessonsOptions);

            lesson.parentElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
            lesson.parentElement.removeEventListener('click', LessonView.createLessonForm);
        });
    }

    static async showLessonHasTaskIndicator() {
        let monday = document.querySelector('div[data-weekday_number="1"]').dataset.date;
        let sunday = document.querySelector('div[data-weekday_number="0"]').dataset.date;
        let tasks = await Controller.getAllTasksInTimespan(monday, sunday);
        let allLessons = document.querySelectorAll('.lesson');

        allLessons.forEach(lesson => {
            tasks.forEach((task) => {

                if (new Date(task.date).setHours(12, 0, 0, 0) != new Date(lesson.dataset.date).setHours(12, 0, 0, 0)) return;
                if (task.class != lesson.dataset.class) return;
                if (task.subject != lesson.dataset.subject) return;
                if (task.timeslot != lesson.closest('.timeslot').dataset.timeslot) return;

                lesson.querySelector('.lessonHasTaskIndicator').style.visibility = 'visible';
            });
        });
    }

    static async showLessonHasNoteIndicator() {
        let monday = document.querySelector('div[data-weekday_number="1"]').dataset.date;
        let sunday = document.querySelector('div[data-weekday_number="0"]').dataset.date;
        let lessonNotes = await Controller.getAllLessonNotesInTimespan(monday, sunday);
        let allLessons = document.querySelectorAll('.lesson');

        let fixedDateLessonNotes = [];

        allLessons.forEach(lesson => {
            lessonNotes.forEach((note) => {
                if (note.fixedDate && !fixedDateLessonNotes.includes(note)) fixedDateLessonNotes.push(note);
                if (new Date(note.date).setHours(12, 0, 0, 0) != new Date(lesson.dataset.date).setHours(12, 0, 0, 0)) return;
                if (note.class != lesson.dataset.class) return;
                if (note.subject != lesson.dataset.subject) return;
                if (note.timeslot != lesson.closest('.timeslot').dataset.timeslot) return;

                const lessonNoteIndicator = lesson.querySelector('.lessonNoteIndicator')
                lessonNoteIndicator.style.visibility = 'visible';
                lessonNoteIndicator.setAttribute('data-noteid', note.id);
            });
        });

        //fixedDateLessonNotes are fixed to a date, but not a timeslot. So if the schedule for that day changes they must show up 
        //on the subject and class, even the lesson doesn't take place the same time, the note was originally asigned to. Therefore check
        //whether the timeslot class and subject still align and if not, display the note on a lesson, where class and subject are equal
        if (fixedDateLessonNotes.length != 0) {
            fixedDateLessonNotes.forEach(note => {
                const day = document.querySelector(`.weekday[data-date="${new Date(new Date(note.date).setHours(12))}"]`);
                const allLessonsOnDay = Array.from(day.querySelectorAll('.lesson'));

                let matchingLesson = allLessonsOnDay.find(lesson => {
                    return lesson.dataset.timeslot == note.timeslot && lesson.dataset.class == note.class && lesson.dataset.subject == note.subject;
                });

                if (!matchingLesson) {
                    let alternateLesson = allLessonsOnDay.find(lesson => { return lesson.dataset.class == note.class && lesson.dataset.subject == note.subject });

                    if (alternateLesson) {
                        const lessonNoteIndicator = alternateLesson.querySelector('.lessonNoteIndicator')
                        lessonNoteIndicator.style.visibility = 'visible';
                        lessonNoteIndicator.setAttribute('data-noteid', note.id);
                    }
                }

            });
        }

    }

    static async createLessonForm(event, oldLessonData = undefined) {

        let timeslotElement = event.target.closest('.timeslot');

        if (timeslotElement.closest('.weekday').classList.contains('passed')) return;

        let timeslotProps = timeslotElement.getBoundingClientRect()
        let timetableProps = document.querySelector('.weekOverview').getBoundingClientRect();
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
        let lessonFormProps = lessonForm.getBoundingClientRect();
        let offset;
        let saveMargin = 5;

        //center the form on the timeslot 
        offset = (lessonFormProps.width - timeslotProps.width) / 2;
        lessonForm.style.transform = `translateX(-${offset}px)`;

        //get new coordinates and check
        lessonFormProps = lessonForm.getBoundingClientRect();

        //if it extends the right side
        if (lessonFormProps.right > timetableProps.right) {
            lessonForm.removeAttribute('style');
            offset = lessonFormProps.width - timeslotProps.width + saveMargin;
            lessonForm.style.transform = `translateX(-${offset}px)`;
        }

        //the left
        if (lessonFormProps.left < timetableProps.left || lessonForm.closest('.weekday').dataset.weekday_number == '1') {
            lessonForm.removeAttribute('style');
        }

        //or it extends the bottom
        if (lessonFormProps.bottom > timetableProps.bottom) {
            offset = lessonFormProps.bottom - timetableProps.bottom + saveMargin;
            lessonForm.style.transform += `translateY(-${offset}px)`;
        }

        //form button event handlers

        timeslotElement.querySelector('#lessonForm').addEventListener('submit', LessonView.saveNewLesson);

        timeslotElement.querySelector('.discardNewLessonButton').addEventListener('click', (event) => LessonView.removeLessonForm(event));
        timeslotElement.querySelector('.lessonForm').addEventListener('mouseenter', AbstractView.removeAddLessonButton);

        //timeslot event handlers
        timeslotElement.removeEventListener('click', LessonView.createLessonForm);
        timeslotElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
    }

    static async createUpdateLessonForm(event, oldLessonData) {
        let timeslotElement = event.target.closest('.timeslot');

        let timeslotProps = timeslotElement.getBoundingClientRect()
        let timetableProps = document.querySelector('.weekOverview').getBoundingClientRect();
        let subjectSelectHTML = await AbstractView.getSubjectSelectHTML()

        let lessonFormHTML = `
            <form id="lessonForm">
                <div class="lessonForm">
                    <div class="alertRing"><input type="text" name="class" id="class" placeholder="Klasse" style="width: 4rem;" value="${oldLessonData.class}"></div>
                    <div class="alertRing">${subjectSelectHTML}</div>
                    <button type="submit" class="saveNewLessonButton confirmationButton" style="margin-right: 0px"><span class="icon checkIcon"></span></button>
                    <button class="discardNewLessonButton cancelButton"><span class="icon crossIcon"></span></button>
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
    }

    static saveNewLesson(event) {
        event.preventDefault();

        let timeslotElement = event.target.closest('.timeslot');

        let lessonData = {
            'date': timeslotElement.closest('.weekday').dataset.date,
            'timeslot': timeslotElement.dataset.timeslot,
            'weekday': timeslotElement.closest('.weekday').dataset.weekday_number,
            'class': Fn.formatClassName(timeslotElement.querySelector('#class').value),
            'subject': timeslotElement.querySelector('#subject').value,
            'type': 'sub',
            'canceled': 'false'
        }

        Controller.saveNewLesson(lessonData);
    }

    /** The lesson update function doesn't really update the lesson, but stores a new on end sets the old one canceled.
   Both is necessary to ensure, tasks are correctly assigned and shown in the right order. */
    static prepareLessonUpdate(event) {

        let lessonElement = event.target.closest('.lesson');
        let oldLessonData;

        oldLessonData = {
            'id': lessonElement.dataset.id,
            'date': lessonElement.dataset.date,
            'weekday': lessonElement.closest('.weekday').dataset.weekday_number,
            'timeslot': lessonElement.dataset.timeslot,
            'class': lessonElement.dataset.class,
            'subject': lessonElement.dataset.subject,
            'type': lessonElement.dataset.id == undefined ? 'normal' : 'sub',
            'canceled': 'true',
            'created': lessonElement.dataset.created
        }

        if (oldLessonData.subject == 'Termin') oldLessonData.type = 'appointement';

        LessonView.createUpdateLessonForm(event, oldLessonData);
    }

    static saveLessonUpdate(event, oldLessonData) {
        event.preventDefault();

        let timeslotElement = event.target.closest('.timeslot');

        let newLessonData = {
            'date': timeslotElement.closest('.weekday').dataset.date,
            'timeslot': timeslotElement.dataset.timeslot,
            'weekday': timeslotElement.closest('.weekday').dataset.weekday_number,
            'class': Fn.formatClassName(timeslotElement.querySelector('#class').value),
            'subject': timeslotElement.querySelector('#subject').value,
            'type': 'sub',
            'canceled': 'false'
        }

        Controller.updateLesson(newLessonData, oldLessonData);
    }

    static async setLessonCanceled(event) {

        let lessonElement = event.target.closest('.lesson');
        let optionsWrapper = lessonElement.querySelector('.lessonOptionsWrapper');
        let lessonData = lessonElement.dataset.id == undefined ? await LessonView.#getLessonDataFromElement(event) : await Controller.getLessonById(lessonElement.dataset.id);

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

    static async setLessonNotCanceled(event) {
        let lessonElement = event.target.closest('.lesson');
        let optionsWrapper = lessonElement.querySelector('.lessonOptionsWrapper');
        let lessonData = await LessonView.#getLessonDataFromElement(event);

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
            if (optionsWrapper.querySelector('button[data-add_note]')) optionsWrapper.querySelector('button[data-add_note]').addEventListener('click', Controller.renderLessonNote);

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

    static getLessonDataFromElement(event) {
        const lesson = event.target.closest('.lesson');

        return {
            className: lesson.dataset.class,
            subject: lesson.dataset.subject,
            date: lesson.closest('.weekday').dataset.date,
            timeslot: lesson.closest('.timeslot').dataset.timeslot,
            weekday: lesson.closest('.weekday').dataset.weekday_number,
            created: lesson.dataset.created
        }
    }

    static getLessonNoteIdFromLessonElement(event) {
        return event.target.closest('.lesson').querySelector('.lessonNoteIndicator').dataset.noteid;
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

    static async #getLessonDataFromElement(event) {
        let lessonElement = event.target.closest('.lesson');
        let isSubstitute = 'normal';

        if (lessonElement.dataset.id) {
            let lessonData = await Controller.getLessonById(lessonElement.dataset.id);
            isSubstitute = lessonData.type;

            return lessonData;
        }

        return {
            'class': lessonElement.dataset.class,
            'subject': lessonElement.dataset.subject,
            'date': lessonElement.closest('.weekday').dataset.date,
            'weekday': lessonElement.closest('.weekday').dataset.weekday_number,
            'timeslot': lessonElement.closest('.timeslot').dataset.timeslot,
            'type': isSubstitute,
            'created': lessonElement.dataset.created
        }
    }

    static getCurrentlyDisplayedWeekDates() {
        const weekOverview = document.querySelector('#weekOverviewContainer');
        return {
            monday: weekOverview.querySelector('.weekday[data-weekday_number="1"]').dataset.date,
            tuesday: weekOverview.querySelector('.weekday[data-weekday_number="2"]').dataset.date,
            wednesday: weekOverview.querySelector('.weekday[data-weekday_number="3"]').dataset.date,
            thursday: weekOverview.querySelector('.weekday[data-weekday_number="4"]').dataset.date,
            friday: weekOverview.querySelector('.weekday[data-weekday_number="5"]').dataset.date,
            saturday: weekOverview.querySelector('.weekday[data-weekday_number="6"]').dataset.date,
            sunday: weekOverview.querySelector('.weekday[data-weekday_number="0"]').dataset.date,
        }
    }
    //////////////////////////
    // week curriculum view //
    //////////////////////////
    static renderCurriculaSelection(curriculaSelection) {
        const container = document.querySelector('#weekCurriculaSelectionDisplay');

        if (!curriculaSelection) {
            curriculaSelection = document.createElement('div');
            curriculaSelection.textContent = 'Für diesen Zeitraum hast du noch keine Stoffverteilungspläne angelegt.';
        }

        while (container.firstChild) container.firstChild.remove();

        container.append(curriculaSelection);
    }

    static renderCurriculumSpans(spans, colorCssClass, curriclumId, schoolYearId) {
        const body = document.querySelector('body');
        const timetableContainer = document.querySelector('#timetableContainer');
        const weekCurriculaDisplay = document.querySelector('#weekCurriculaDisplay');
        const weekdays = Array.from(weekCurriculaDisplay.querySelectorAll('.curriculaDisplayWeekday'));

        const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const offset = parseFloat(getComputedStyle(timetableContainer).paddingLeft) + parseFloat(getComputedStyle(body).marginLeft);
        const padding = remSize * 0.2;

        const blankDiv = document.createElement('div');
        const spanContainer = blankDiv.cloneNode();

        spanContainer.classList.add('curriculumSpanContainer');

        spans.forEach(span => {
            const currentContainer = blankDiv.cloneNode();
            let startDayElement = weekdays.find(weekday => { return new Date(weekday.dataset.date).setHours(12, 0, 0, 0) == new Date(span.startDate).setHours(12, 0, 0, 0) });
            let endDayElement = weekdays.find(weekday => { return new Date(weekday.dataset.date).setHours(12, 0, 0, 0) == new Date(span.endDate).setHours(12, 0, 0, 0) });

            currentContainer.dataset.spanid = span.id;
            currentContainer.dataset.curriculumid = curriclumId;
            currentContainer.dataset.schoolyearid = schoolYearId;

            currentContainer.classList.add('spanItem');

            if (startDayElement) currentContainer.classList.add('start');
            if (endDayElement) currentContainer.classList.add('end');

            //positioning
            // if the start or end of the span lies outside of the displayed week, the start/end must be set to monday/sunday
            if (!startDayElement) {
                startDayElement = weekdays[0];
            }
            if (!endDayElement) {
                endDayElement = weekdays[6];
            }

            const scrolledContainer = document.querySelector('#weekOverviewContainer');
            const startElementProps = startDayElement.getBoundingClientRect();
            const endElementProps = endDayElement.getBoundingClientRect();

            currentContainer.style.left = `${startElementProps.left + scrolledContainer.scrollLeft - offset + padding}px`;
            currentContainer.style.width = `${endElementProps.right - startElementProps.left - padding * 2}px`;

            //color 
            const colorPeeker = document.querySelector(`.${colorCssClass}`);
            let backgroundColor;

            if (colorPeeker) {
                backgroundColor = getComputedStyle(colorPeeker).backgroundColor;
            } else {
                backgroundColor = 'var(--topMenuBackgound)';
            }

            currentContainer.style.borderColor = backgroundColor;
            currentContainer.style.backgroundColor = `color-mix(in srgb, ${backgroundColor} 10%, var(--fadedgrey) 90%)`;

            // topic / span name
            const spanItemContent = blankDiv.cloneNode();
            const spanName = blankDiv.cloneNode();
            spanItemContent.classList.add('spanItemContent');
            spanName.classList.add('spanName');
            
            spanName.textContent = span.name;

            // span note
            let noteIcon;
            if (span.note.trim() != '') {
                noteIcon = blankDiv.cloneNode();
                noteIcon.classList.add('curriculaSpanNoteIcon');
                noteIcon.classList.add('noteIcon');
            }

            if (noteIcon) spanItemContent.append(noteIcon)

            spanItemContent.append(spanName);
            currentContainer.append(spanItemContent);
            spanContainer.append(currentContainer);
        });

        if (spanContainer.childElementCount != 0) weekdays[0].append(spanContainer);
    }

    static removeAllCurriculumSpans(element = null) {
        if (!element) element = document.querySelector('.curriculaDisplayWeekday[data-weekday_number="1"]') // all spanContainer are appended to monday

        element.querySelectorAll('.curriculumSpanContainer').forEach(item => item.remove());
    }

    static toggleCurriculumSelectionItem(event) {
        const item = event.target;

        if (item.classList.contains('selected')) {
            item.classList.remove('selected');
        } else {
            item.classList.add('selected');
        }
    }

    static resizeCurriculaSection() {
        const curriculaSelection = document.querySelector('#weekCurriculaSelectionContainer');
        const curriculaSelectionDisplay = document.querySelector('#weekCurriculaSelectionDisplay');
        const curriculaDisplay = document.querySelector('#weekCurriculaDisplay');
        const resizeButton = document.querySelector('#resizeCurriculumSectionButton');

        if (curriculaDisplay.classList.contains('notDisplayed')) {
            curriculaSelection.classList.remove('notDisplayed');
            curriculaSelectionDisplay.classList.remove('notDisplayed');
            curriculaDisplay.classList.remove('notDisplayed');

            resizeButton.style.transform = 'rotate(180deg)';
        } else {
            curriculaSelection.classList.add('notDisplayed');
            curriculaDisplay.classList.add('notDisplayed');

            resizeButton.style.transform = '';
        }
    }

    static resizeCurriculaSelection() {
        const curriculaSelection = document.querySelector('#weekCurriculaSelectionDisplay');
        const resizeButton = document.querySelector('#resizeCurriculumSelectionButton');

        if (curriculaSelection.classList.contains('notDisplayed')) {
            curriculaSelection.classList.remove('notDisplayed');
            resizeButton.style.transform = '';
        } else {
            curriculaSelection.classList.add('notDisplayed');
            resizeButton.style.transform = 'rotate(180deg)';
        }
    }

    static getSelectedCurriculaIds() {
        const ids = [];

        document.querySelectorAll('.curriculumSelectionItem.mainView.selected').forEach(item => ids.push(Number(item.dataset.curriculumid)));

        return ids;
    }

    static openCurriculumSpanDialog(span, curriculum, schoolYear) {
        const dialog = document.querySelector('#curriculumNoteDialog');
        const titleInput = dialog.querySelector('#spanTitle');
        const noteInput = dialog.querySelector('#curriculumNoteContentEditor');

        dialog.dataset.spanid = span.id;
        dialog.dataset.schoolyearid = schoolYear.id;
        dialog.dataset.curriclumid = curriculum.id;

        titleInput.textContent = span.name;
        noteInput.innerHTML = span.note;

        Editor.init(noteInput);
        dialog.showModal();
    }

    static closeCurriculumSpanDialog() {
        const dialog = document.querySelector('#curriculumNoteDialog');
        const titleLabel = dialog.querySelector('#spanTitle');
        const noteInput = dialog.querySelector('#curriculumNoteContentEditor');

        dialog.dataset.spanid = '';
        dialog.dataset.schoolyearid = '';
        dialog.dataset.curriclumId = '';

        titleLabel.textContent = '';
        while (noteInput.firstElementChild) noteInput.firstElementChild.remove();

        dialog.close();
    }

    static getCurriculumSpanNoteDataFromForm() {
        const dialog = document.querySelector('#curriculumNoteDialog');
        const noteInput = dialog.querySelector('#curriculumNoteContentEditor');

        return {
            curriclumId: dialog.dataset.curriclumid,
            schoolYearId: dialog.dataset.schoolyearid,
            spanId: dialog.dataset.spanid,
            spanNote: Editor.getContent(noteInput)
        }
    }

    static toggleSaveCurriculumSpanNoteButton(activate = false) {
        if (activate) {
            document.querySelector('#saveCurriculumNotesButton').removeAttribute('disabled');
            return;
        }

        document.querySelector('#saveCurriculumNotesButton').setAttribute('disabled', '');
    }

    static showCurriculumNoteSavedMessage() {
        const message = document.querySelector('#curriculumNoteSavedMessage');
        message.classList.add('active');
        setTimeout(() => {
            message.classList.remove('active');
        }, 2000);
    }

    static getClickedCurriculumSpanData(clickedElement) {
        if (clickedElement.classList.contains('spanItem')) {
            return {
                spanId: clickedElement.dataset.spanid,
                curriculumId: clickedElement.dataset.curriculumid,
                schoolYearId: clickedElement.dataset.schoolyearid
            };
        }

        return {
            spanId: clickedElement.closest('.spanItem').dataset.spanid,
            curriculumId: clickedElement.closest('.spanItem').dataset.curriculumid,
            schoolYearId: clickedElement.closest('.spanItem').dataset.schoolyearid
        };
    }

    static hasLessonNoteIndicator(element) {
        const noteIndicator = element.querySelector('.lessonNoteIndicator');

        if (noteIndicator && getComputedStyle(noteIndicator).visibility != 'hidden') return true;

        return false
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