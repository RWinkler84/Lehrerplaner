import { allSubjects } from "../index.js";
import Controller from "../Controller/SettingsController.js";

export default class SettingsView {

    static renderSelectableLessonColors() {
        let allColorsArray = [
            'subjectColorOne',
            'subjectColorTwo',
            'subjectColorThree',
            'subjectColorFour',
            'subjectColorFive',
        ];

        let selectionContainer = document.querySelector('#colourSelection');
        let selectableColorsHTML = '';

        allSubjects.forEach(entry => {
            let i = allColorsArray.indexOf(entry.colorCssClass);
            allColorsArray.splice(i, 1);
        })

        allColorsArray.forEach(color => {
            selectableColorsHTML += `<div class="colorSelectionBox ${color}" data-colorClass="${color}"></div>`;
        })

        selectionContainer.innerHTML = selectableColorsHTML;

        SettingsView.#makeColorsSelectable(selectionContainer);
    }

    static #makeColorsSelectable(selectionContainer) {
        selectionContainer.querySelectorAll('.colorSelectionBox').forEach(element => {
            element.addEventListener('click', SettingsView.markColorSelected)
        });

    }

    static markColorSelected(event) {
        document.querySelectorAll('.colorSelectionBox').forEach(element => element.classList.remove('selected'));
        event.target.classList.add('selected')
    }

    static renderExistingSubjects() {
        let subjectsContainer = document.querySelector('#subjectsListContainer');
        let subjectsHTML = '';

        allSubjects.forEach(entry => {
            subjectsHTML += `
                <div class="subjectListItem ${entry.colorCssClass} flex spaceBetween" data-id="${entry.id}">
                ${entry.subject}
                <button class="deleteSubjectButton" style="width: 1.5rem">&#215;</button>
                </div>
            `;
        });

        subjectsContainer.innerHTML = subjectsHTML;

        subjectsContainer.querySelectorAll('.deleteSubjectButton').forEach(element => element.addEventListener('click', SettingsView.deleteSubject));

    }

    static deleteSubject(event) {
        let subjectId = event.target.closest('.subjectListItem').dataset.id;

        Controller.deleteSubject(subjectId);
    }

    static saveSubject() {

        let colorCssClass = document.querySelector('.colorSelectionBox.selected')
            ? document.querySelector('.colorSelectionBox.selected').dataset.colorclass
            : undefined;

        let subject = {
            'name': document.querySelector('#subjectName').value,
            'colorCssClass': colorCssClass
        };

        Controller.saveSubject(subject);
    }

    //validation functions
    static alertColorSelection() {
        let colorSelection = document.querySelector('#colourSelection');

        colorSelection.classList.add('validationError');
        setTimeout(() => {
            colorSelection.classList.remove('validationError');
        }, 300);
    }

    static alertSubjectNameInput() {
        let subjectNameInput = document.querySelector('#subjectName');

        subjectNameInput.parentElement.classList.add('validationError');
        setTimeout(() => {
            subjectNameInput.parentElement.classList.remove('validationError');
        }, 300);
    }

}