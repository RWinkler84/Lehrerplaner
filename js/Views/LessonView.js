import LessonController from "../Controllers/LessonController.js";
import Controller from "../Controllers/LessonController.js";
import Fn from '../inc/utils.js'
import AbstractView from "./AbstractView.js";

export default class LessonView {

    static renderLesson() {
        let monday = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
        let sunday = document.querySelector('.weekday[data-weekday_number="0"]').dataset.date;

        let regularLessons = Controller.getScheduledLessons();
        let lessonChanges = Controller.getTimetableChanges(monday, sunday);

        regularLessons.forEach((lesson) => {
            let timeslot = LessonView.#getTimeslotOfLesson(lesson);
            timeslot.innerHTML = `<div class="lesson ${lesson.cssColorClass}" data-taskid="">${lesson.class} ${lesson.subject}</div>`;

        })

        //reflect timetable changes
        lessonChanges.forEach((lesson) => {

            let timeslot = LessonView.#getTimeslotOfLesson(lesson);

            if (lesson.status == 'sub') {
                timeslot.innerHTML = `<div class="lesson ${lesson.cssColorClass}" data-taskid="">${lesson.class} ${lesson.subject}</div>`;
            }

            if (lesson.status == 'canceled') {
                timeslot.firstElementChild.classList.add('canceled');
            }
        })

        document.querySelectorAll('.lesson').forEach((lesson) => {
            lesson.addEventListener('mouseover', AbstractView.highlightTask);
            lesson.addEventListener('mouseout', AbstractView.removeTaskHighlight);
            lesson.addEventListener('mouseenter', LessonView.showLessonOptionsButton);
            lesson.addEventListener('mouseleave', LessonView.removeLessonOptionsButton);
            lesson.parentElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);
            lesson.parentElement.removeEventListener('click', LessonView.createLessonForm);
        });
    }

    static renderNewLesson(lesson) {
        let timeslot = LessonView.#getTimeslotOfLesson(lesson);

        timeslot.innerHTML = `<div class="lesson ${lesson.cssColorClass}" data-taskid="">${lesson.class} ${lesson.subject}</div>`;

        lesson.addEventListener('mouseover', LessonView.showLessonOptionsButton);
        lesson.addEventListener('mouseout', LessonView.removeLessonOptionsButton);
    }

    static createLessonForm(event) {

        let timeslotElement = event.target.closest('.timeslot');

        let timeslotProps = timeslotElement.getBoundingClientRect()
        let timetableProps = document.querySelector('#weekOverview').getBoundingClientRect();

        let lessonFormHTML = `
            <form id="lessonForm">
                <div class="lessonForm">
                    <input type="text" name="class" id="class" placeholder="Klasse" style="width: 4rem;" required>
                    <select name="subject" id="subject" required>
                        <option value="">-</option>
                        <option value="Deu">Deu</option>
                        <option value="Gesch">Gesch</option>
                        <option value="MNT">MNT</option>
                    </select>
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

        timeslotElement.querySelector('#lessonForm').addEventListener('submit', LessonView.saveNewLesson);
        timeslotElement.querySelector('.discardNewLessonButton').addEventListener('click', (event) => LessonView.removeLessonForm(event, true));
        timeslotElement.querySelector('.lessonForm').addEventListener('mouseenter', AbstractView.removeAddLessonButton);

        timeslotElement.removeEventListener('click', LessonView.createLessonForm);
        timeslotElement.removeEventListener('mouseenter', AbstractView.showAddLessonButton);

        // timeslotElement.firstElementChild.addEventListener('mouseover', highlightTask);
        // timeslotElement.firstElementChild.addEventListener('mouseout', removeTaskHighlight);
    }

    static saveNewLesson(event) {
        event.preventDefault();

        let timeslotElement = event.target.closest('.timeslot');

        let lessonData = {
            'date': timeslotElement.closest('.weekday').dataset.date,
            'timeslot': timeslotElement.dataset.timeslot,
            'class': timeslotElement.querySelector('#class').value,
            'subject': timeslotElement.querySelector('#subject').value
        }

        Controller.saveNewLesson(lessonData);

        LessonView.removeLessonForm(event);
    }

    static removeLessonForm(event, discardedLesson = false) {
        event.stopPropagation();

        let timeslotElement = event.target.closest('.timeslot');
        let createLessonForm = event.target.closest('#lessonForm');

        createLessonForm.remove();

        if (discardedLesson) {
            timeslotElement.addEventListener('click', LessonView.createLessonForm);
            timeslotElement.addEventListener('mouseenter', AbstractView.showAddLessonButton);
        }
    }

    static showLessonOptionsButton(event){

        let lessonElement = event.target;

        if (lessonElement.querySelector('.lessonOptionsButton')) return;

        let buttonContainer = lessonElement.innerHTML;
        lessonElement.innerHTML += `
            <div class="lessonOptionsWrapper">
                <button class="lessonOptionsButton">&#x2630;</button>
                <div class="lessonOptionWrapper"></div>
            </div>
        `;

        let button = lessonElement.querySelector('.lessonOptionsButton');
        
        // button.parentElement.parentElement.classList.add('lessonOptionsButtonContainer');
        button.addEventListener('click', LessonView.showLessonOptions);
    }

    static removeLessonOptionsButton(){
        document.querySelectorAll('.lessonOptionsWrapper').forEach(container => container.remove());
    }

    static showLessonOptions(event) {
        let optionsWrapper = event.target.closest('.lesson').querySelector('.lessonOptionWrapper');
        optionsWrapper.innerHTML = `
            <div class="lessonOption"><button>neue Aufgabe</button></div>
            <div class="lessonOption"><button>fällt aus</button></div>
            `
        
    }


    static removeAllLessons(element) {
        element.querySelectorAll('.lesson').forEach((lesson) => {
            lesson.parentElement.remove();
        })
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
            let dateOfWeekday = new Date(day.dataset.date)
            let dateOfLesson = new Date(lesson.date).setHours(0, 0, 0, 0);

            if (dateOfWeekday.getTime() == dateOfLesson) weekday = day;
        });

        weekday.querySelectorAll('.timeslot').forEach((slot) => { if (slot.dataset.timeslot == lesson.timeslot) timeslot = slot; });

        return timeslot;
    }
}