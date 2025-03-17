import { allSubjects } from "../index.js";
import Fn from '../inc/utils.js';

export default class AbstractView {

    static getSubjectSelectHTML(event = undefined) {
        //make an fetch-query to get all subject the teacher is teaching and create an select with those as options
        //for now it is static and stored in the global const allSubjects
        let previouslySelected;
        let optionsHTML;
        let selected = '';

        //was something pre-selected or is it for a new Task form?
        //if something was preselected, set the corresponding option to selected
        if (event) previouslySelected = event.target.closest('tr').querySelector('td[data-subject]').dataset.subject;

        previouslySelected == '-'
            ? optionsHTML = '<option value="-" selected>-</option>'
            : optionsHTML = '<option value="-">-</option>';


        allSubjects.forEach((entry) => {
            entry.subject == previouslySelected ? selected = 'selected' : selected = '';

            optionsHTML += `<option value="${entry.subject}" ${selected}>${entry.subject}</option>`;
        });

        return `<select class="lessonSelect">${optionsHTML}</select>`;
    }

    static showAddLessonButton(event) {

        let timeslot = event.target.dataset.timeslot;
        let date = event.target.parentElement.dataset.date;

        AbstractView.removeAddLessonButton();

        if (Fn.hasLesson(event.target)) return;

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

        let item = event.target;

        document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
            if (taskRow.dataset.taskid === item.dataset.taskid) {
                taskRow.style.backgroundColor = 'var(--lightergrey)';
            }
        });

        AbstractView.removeAddLessonButton();
    }

    static removeTaskHighlight(event) {
        let item = event.target;

        document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
            if (taskRow.dataset.taskid === item.dataset.taskid) {
                taskRow.removeAttribute('style');
            }
        });
    }
}