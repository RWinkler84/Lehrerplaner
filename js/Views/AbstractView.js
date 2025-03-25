import { allSubjects } from "../index.js";
import Fn from '../inc/utils.js';

export default class AbstractView {

    static getSubjectSelectHTML(event = undefined) {
        //make an fetch-query to get all subject the teacher is teaching and create an select with those as options
        //for now it is static and stored in the global const allSubjects
        let optionsHTML = '<option value="">-</option>';

        allSubjects.forEach((entry) => {
            optionsHTML += `<option value="${entry.subject}">${entry.subject}</option>`;
        });

        return `<select class="lessonSelect" id="subject" required>${optionsHTML}</select>`;
    }

    static showAddLessonButton(event) {

        let timeslot = event.target.dataset.timeslot;
        let date = event.target.parentElement.dataset.date;

        AbstractView.removeAddLessonButton();

        if (Fn.hasLesson(event.target)) return;
        if (event.target.closest('.weekday').classList.contains('passed')) return;

        event.target.innerHTML = `<div class="addLessonButtonWrapper" data-timeslot="${timeslot}" data-date="${date}"><div class="addLessonButton">+</div></div>`;

    }

    static removeAddLessonButton() {

        document.querySelectorAll('.timeslot').forEach((timeslot) => {
            if (timeslot.querySelector('.addLessonButtonWrapper')) {
                timeslot.querySelector('.addLessonButtonWrapper').remove();
            }
        });
    }

    static highlightTask(event) {

        let taskContainer = document.querySelector('#taskContainer')

        taskContainer.querySelectorAll('tr[data-date]').forEach((taskRow) => {

            if (new Date(taskRow.dataset.date).setHours(12, 0, 0, 0) != new Date(event.target.dataset.date).setHours(12, 0, 0, 0)) return;
            if (taskRow.querySelector('td[data-class]').dataset.class != event.target.dataset.class) return;
            if (taskRow.querySelector('td[data-subject').dataset.subject != event.target.dataset.subject) return;

            taskRow.style.backgroundColor = 'var(--lightergrey)';
            taskRow.nextElementSibling.style.backgroundColor = 'var(--lightergrey)';
            taskRow.nextElementSibling.nextElementSibling.style.backgroundColor = 'var(--lightergrey)';
        });

        AbstractView.removeAddLessonButton();
    }

    static removeTaskHighlight(event) {

        let taskContainer = document.querySelector('#taskContainer')

        taskContainer.querySelectorAll('tr[data-date]').forEach((taskRow) => {
            if (new Date(taskRow.dataset.date).setHours(12, 0, 0, 0) != new Date(event.target.dataset.date).setHours(12, 0, 0, 0)) return;
            if (taskRow.querySelector('td[data-class]').dataset.class != event.target.dataset.class) return;
            if (taskRow.querySelector('td[data-subject').dataset.subject != event.target.dataset.subject) return;

            taskRow.removeAttribute('style');

            if (taskRow.nextElementSibling.hasAttribute('data-new')) return;
            taskRow.nextElementSibling.style.backgroundColor = 'var(--contentContainerBackground)';
            taskRow.nextElementSibling.nextElementSibling.style.backgroundColor = 'var(--contentContainerBackground)';

        });
    }
    static greyOutPassedDays() {
        document.querySelectorAll('.weekday').forEach(weekday => {
            console.log(weekday);
            weekday.classList.remove('passed');
            if (new Date(weekday.dataset.date).setHours(12, 0, 0, 0) < new Date().setHours(12, 0, 0, 0)) weekday.classList.add('passed');
        })
    }

    static setDateOnWeekdayLabel() {
        document.querySelectorAll('.weekday').forEach(weekday => {
            let dateOfWeekday = new Date(weekday.dataset.date).setHours(12, 0, 0, 0);
            weekday.querySelector('.smallDate').innerText = Fn.formatDate(dateOfWeekday);
        })
    }

    static toogleIsCurrentWeekDot() {
        let today = new Date();
        let mondayOfDisplayedWeek = document.querySelector('.weekday[data-weekday_number="1"').dataset.date;
        let sundayOfDisplayedWeek = document.querySelector('.weekday[data-weekday_number="0"').dataset.date;

        if (Fn.isDateInWeek(today, mondayOfDisplayedWeek, sundayOfDisplayedWeek)) {
            document.querySelector('#isCurrentWeekDot').style.display = "block";
            return;
        }

        document.querySelector('#isCurrentWeekDot').style.display = "none";
    }
}