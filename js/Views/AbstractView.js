import { allSubjects } from "../index.js";

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
}