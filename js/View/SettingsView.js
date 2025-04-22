import { allSubjects } from "../index.js";

export default class SettingsView {

    static renderSelectableLessonColors() {
        let allColorsArray = [
            'subjectColorOne',
            'subjectColorTwo',
            'subjectColorThree',
            'subjectColorFour',
            'subjectColorFive',
            ];

        let selectionContainer = document.querySelector('#settingsColourSelection');
        let selectableColorsHTML = '';

        allSubjects.forEach(entry => {
            let i = allColorsArray.indexOf(entry.colorCssClass);
            allColorsArray.splice(i,1);
        })
        
        allColorsArray.forEach(color => {
            selectableColorsHTML += `<div class="colorSelectionBox ${color}" data-colorClass="${color}"></div>`;
        })

        selectionContainer.innerHTML = selectableColorsHTML;

        SettingsView.#makeColorsSelectable(selectionContainer);
    }

    static #makeColorsSelectable(selectionContainer){
        selectionContainer.querySelectorAll('.colorSelectionBox').forEach(element => {
            element.addEventListener('click', SettingsView.markColorSelected)
        });

    }

    static markColorSelected(event){
        document.querySelectorAll('.colorSelectionBox').forEach(element => element.classList.remove('selected'));
        event.target.classList.add('selected')
    }

    static renderExistingSubjects(){
        let subjectsContainer = document.querySelector('#existingSubjectsContainer');
        let subjectsHTML = '';

        allSubjects.forEach(entry => {
            console.log(entry);
            subjectsHTML += `
                <div class="settingsSubjectListItem ${entry.colorCssClass}">${entry.subject}</div>
            `;
        });

        subjectsContainer.innerHTML = subjectsHTML;
    }
}