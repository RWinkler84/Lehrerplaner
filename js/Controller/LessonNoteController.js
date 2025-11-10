import LessonNote from "../Model/LessonNote.js";
import LessonNoteView from "../View/LessonNoteView.js";

export default class LessonNoteController {
    static renderLessonNote(event) {
        LessonNoteView.renderLessonNotesModal(event);
    }

    static async getAllLessonNotes() {
        return await LessonNote.getAllLessonNotes();
    }

    static async getAllLessonNotesInTimeRange(startDate, endDate) {
        return await LessonNote.getAllNotesInTimeRange(startDate, endDate);
    }

    static async getLessonNoteById(id) {
        return await LessonNote.getById(id);
    }

    static async saveLessonNote() {
        let noteData = LessonNoteView.getNoteDataFromForm();

        if (noteData.id) {
            LessonNoteController.updateLessonNote(noteData);
            return;
        }

        let note = LessonNote.writeDataToInstance(noteData);
        console.log(note)

        note.save();
    }

    static async updateLessonNote(noteData) {
        let note = await LessonNote.getById(noteData.id);

        note = LessonNote.writeDataToInstance(noteData, note);
        console.log(note);

        note.update();
    }

    static async deleteLessonNote(id) {
        let note = await LessonNote.getById(id);

        note.delete();
    }

    static normalizeInput() {
        LessonNoteView.normalizeInput();
    }

    static updateButtonStatus() {
        LessonNoteView.updateButtonStatus();
    }

    static handleClickEvents(event) {
        const clickedElement = event.target;

        switch (clickedElement.id) {
            case 'noteContentEditor':
                LessonNoteView.removePlaceholderText();
                break;
            case 'closeLessonNotesButton':
                LessonNoteView.closeLessonNotesDialog();
                break;
            case 'saveLessonNotesButton':
                LessonNoteController.saveLessonNote();
                break;

            // editor styling buttons
            case 'boldButton':
                LessonNoteView.toggleBoldText(event);
                break;
            case 'unorderedListButton':
                LessonNoteView.toggleList('ul');
                break;
            case 'orderedListButton':
                LessonNoteView.toggleList('ol');
                break;
        }

        switch (true) {
            case clickedElement.classList.contains('placeholder'):
                LessonNoteView.removePlaceholderText();
                break;
            case clickedElement.classList.contains('ulIcon'):
                LessonNoteView.toggleList('ul');
                break;
            case clickedElement.classList.contains('olIcon'):
                LessonNoteView.toggleList('ol');
                break;


        }
    }

    static handleKeyDown(event) {
        const key = event.code;

        switch (key) {
        }
    }
}