import LessonNoteController from "../Controller/LessonNoteController.js";
import AbstractView from "./AbstractView.js";
import Fn from "../inc/utils.js";

export default class LessonNoteView extends AbstractView {
    static async renderLessonNotesModal(event) {
        const lesson = event.target.closest('.lesson');
        const className = lesson.dataset.class;
        const subject = lesson.dataset.subject;
        const date = lesson.closest('.weekday').dataset.date;
        const timeslot = lesson.closest('.timeslot').dataset.timeslot;
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
        const noteContentContainer = dialog.querySelector('#noteContentContainer');
        const noteContent = dialog.querySelector('#noteContent');
        const editorContainer = dialog.querySelector('#noteEditorContainer');
        const textarea = dialog.querySelector('#noteContentEditor');

        if (matchedNote) {
            dialog.dataset.noteid = matchedNote.id;
            noteContent.textContent = matchedNote.content;
            textarea.value = matchedNote.content;
            
            editorContainer.style.display = 'none';
            noteContentContainer.removeAttribute('style');

        }

        if (!matchedNote) {
            noteContentContainer.style.display = 'none';
            editorContainer.removeAttribute('style');
            textarea.value = '';
        }

        dialog.showModal();
    }

    static closeLessonNotesModal() {
        document.querySelector('#lessonNoteDialog').close();
    }
}