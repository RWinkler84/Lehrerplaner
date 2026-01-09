import AbstractView from "./AbstractView.js";
import Fn from '../inc/utils.js';
import Editor from '../inc/editor.js';

export default class LessonNoteView extends AbstractView {

    /////////////////////////////////
    // handle rendering and saving //
    /////////////////////////////////

    static async renderLessonNotesModal(note, lessonData) {

        const dialog = document.querySelector('#lessonNoteDialog');
        const headlineInfo = dialog.querySelector('#lessonNoteInfo');
        const editor = dialog.querySelector('#noteContentEditor');
        const saveButton = dialog.querySelector('#saveLessonNotesButton');
        const fixedDateCheckbox = dialog.querySelector('#noteFixedDateCheckbox');

        const lessonDate = Fn.formatDate(lessonData.date);

        headlineInfo.textContent = `${lessonData.className}/${lessonData.subject} am ${lessonDate}`;

        dialog.dataset.class = lessonData.className;
        dialog.dataset.subject = lessonData.subject;
        dialog.dataset.date = lessonData.date;
        dialog.dataset.timeslot = lessonData.timeslot;
        dialog.dataset.weekday = lessonData.weekday;

        if (note) {
            dialog.dataset.noteid = note.id;
            dialog.dataset.created = note.created;
            editor.innerHTML = note.content;
            saveButton.setAttribute('disabled', '');
            fixedDateCheckbox.checked = false;
            if (note.fixedDate) fixedDateCheckbox.checked = true;
        }

        if (!note) {
            dialog.dataset.noteid = '';
            fixedDateCheckbox.checked = false;
            saveButton.removeAttribute('disabled');

            const p = document.createElement('p');
            p.classList.add('placeholder');
            editor.append(p);
            editor.firstElementChild.innerHTML = 'Hier kannst du eine Notiz zur Stunde anlegen.'
        }

        dialog.showModal();
    }

    static toggleSaveLessonNoteButton(activate = false) {
        if (activate) {
            document.querySelector('#saveLessonNotesButton').removeAttribute('disabled');
            return;
        }

        document.querySelector('#saveLessonNotesButton').setAttribute('disabled', '');
    }

    static showLessonNoteSavedMessage() {
        const message = document.querySelector('#noteSavedMessage');
        message.classList.add('active');
        setTimeout(() => {
            message.classList.remove('active');
        }, 2000);
    }

    static updateLessonNoteDialog(note) {
        document.querySelector('#lessonNoteDialog').dataset.noteid = note.id;
        document.querySelector('#lessonNoteDialog').dataset.created = note.created;
    }

    static removeIdAndCreatedFromLessonNoteDialog() {
        document.querySelector('#lessonNoteDialog').dataset.noteid = '';
        document.querySelector('#lessonNoteDialog').dataset.created = '';
    }

    static getNoteDataFromForm() {
        const dialog = document.querySelector('#lessonNoteDialog');
        const editor = dialog.querySelector('#noteContentEditor');
        let content = '';

        content = Editor.serializeNodeContent(editor, true);

        return {
            id: dialog.dataset.noteid,
            class: dialog.dataset.class,
            subject: dialog.dataset.subject,
            date: dialog.dataset.date,
            weekday: dialog.dataset.weekday,
            timeslot: dialog.dataset.timeslot,
            created: dialog.dataset.created,
            content: content,
            fixedDate: dialog.querySelector('#noteFixedDateCheckbox').checked
        }
    }

    static closeLessonNotesDialog() {
        const dialog = document.querySelector('#lessonNoteDialog');
        const editor = dialog.querySelector('#noteContentEditor');

        dialog.dataset.noteid = '';
        dialog.dataset.class = '';
        dialog.dataset.subject = '';
        dialog.dataset.date = '';
        dialog.dataset.timeslot = '';
        dialog.dataset.weekday = '';
        dialog.dataset.created = '';

        while (editor.childNodes.length != 0) { editor.childNodes[0].remove(); }

        dialog.close();
    }

    static removePlaceholderText() {
        const editor = document.querySelector('#noteContentEditor');

        if (editor.firstElementChild.classList.contains('placeholder')) {
            editor.firstElementChild.innerHTML = '<br>';
            editor.firstElementChild.classList.remove('placeholder');
        }
    }
}