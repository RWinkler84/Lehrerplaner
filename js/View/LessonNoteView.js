import LessonNoteController from "../Controller/LessonNoteController.js";
import AbstractView from "./AbstractView.js";
import Fn from "../inc/utils.js";
import { ALLOWEDTAGS } from "../index.js";

export default class LessonNoteView extends AbstractView {
    static async renderLessonNotesModal(event) {
        const lesson = event.target.closest('.lesson');
        const className = lesson.dataset.class;
        const subject = lesson.dataset.subject;
        const date = lesson.closest('.weekday').dataset.date;
        const timeslot = lesson.closest('.timeslot').dataset.timeslot;
        const weekday = lesson.closest('.weekday').dataset.weekday_number;
        const lessonNotes = await LessonNoteController.getAllLessonNotesInTimeRange(date);

        let matchedNote;

        lessonNotes.forEach(note => {
            if (Fn.formatDate(note.date) != Fn.formatDate(date)) return;
            if (note.timeslot != timeslot) return;
            if (note.class != className) return;
            if (note.subject != subject) return;

            matchedNote = note;
        })

        const dialog = document.querySelector('#lessonNoteDialog');
        const editor = dialog.querySelector('#noteContentEditor');

        dialog.dataset.class = className;
        dialog.dataset.subject = subject;
        dialog.dataset.date = date;
        dialog.dataset.timeslot = timeslot;
        dialog.dataset.weekday = weekday;

        if (matchedNote) {

            dialog.dataset.noteid = matchedNote.id;
            dialog.dataset.created = matchedNote.created;
            editor.innerHTML = matchedNote.content;
        }

        if (!matchedNote) {
            const p = document.createElement('p');
            p.classList.add('placeholder');
            editor.append(p);
            editor.firstElementChild.innerHTML = 'Hier kannst du eine Notiz zur Stunde anlegen.'
        }

        dialog.showModal();
    }

    static getNoteDataFromForm() {
        const dialog = document.querySelector('#lessonNoteDialog');
        const editor = dialog.querySelector('#noteContentEditor');
        let content = '';

        //wrap text nodes with actual content in p elements
        editor.childNodes.forEach(node => {
            if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') {
                const p = document.createElement('p');
                p.textContent = node.textContent;
                node.replaceWith(p);
            }
        })

        content = this.serializeNodeContent(editor, true);

        console.log('string', content);

        return {
            id: dialog.dataset.noteid,
            class: dialog.dataset.class,
            subject: dialog.dataset.subject,
            date: dialog.dataset.date,
            weekday: dialog.dataset.weekday,
            timeslot: dialog.dataset.timeslot,
            created: dialog.dataset.created,
            content: content
        }
    }
    /**@param node Returns the elements inner structure as a string. If the parent element should not be included, ignoreParent must be set to true */
    static serializeNodeContent(node, ignoreParent = false) {
        if (node.nodeType == Node.TEXT_NODE && node.textContent.includes('\n')) return node.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
        if (node.nodeType == Node.TEXT_NODE) return node.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');


        let nodeText = '';

        if (node.childNodes) {
            node.childNodes.forEach((node) => {
                nodeText += LessonNoteView.serializeNodeContent(node);
            });
        }

        let tagName = node.tagName.toLowerCase();
        if (tagName == 'div') tagName = 'p';

        if (ignoreParent) return nodeText;
        if (!ALLOWEDTAGS.includes(tagName)) return `&lt;${tagName}&gt;${nodeText}&lt;/${tagName}&gt;`;
        if (tagName == 'br') return '<br>';

        return `<${tagName}>${nodeText}</${tagName}>`;
    }

    static closeLessonNotesDialog() {
        const dialog = document.querySelector('#lessonNoteDialog');

        dialog.dataset.noteid = '';
        dialog.dataset.class = '';
        dialog.dataset.subject = '';
        dialog.dataset.date = '';
        dialog.dataset.timeslot = '';
        dialog.dataset.weekday = '';
        dialog.dataset.created = '';

        dialog.close();
    }

    static removePlaceholderText() {
        const editor = document.querySelector('#noteContentEditor');

        if (editor.firstElementChild.classList.contains('placeholder')) {
            editor.firstElementChild.innerHTML = '<br>';
            editor.firstElementChild.classList.remove('placeholder');
        }
    }

    static normalizeInput() {
        const editor = document.querySelector('#noteContentEditor');

        editor.childNodes.forEach(node => {
            if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != '') {
                const selection = document.getSelection();
                const range = document.createRange();
                
                const p = document.createElement('p');
                p.textContent = node.textContent;
                node.replaceWith(p);

                range.setStart(p, p.textContent.length);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        })
    }
}