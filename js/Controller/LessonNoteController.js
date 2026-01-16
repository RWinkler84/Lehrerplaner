import Editor from "../inc/editor.js";
import LessonNote from "../Model/LessonNote.js";
import LessonNoteView from "../View/LessonNoteView.js";
import LessonController from "./LessonController.js";

export default class LessonNoteController {
    static async renderLessonNote(event) {
        let lessonData = LessonController.getLessonDataFromElement(event);
        let noteId = LessonController.getLessonNoteIdFromLessonElement(event);
        let note;

        if (noteId) note = await this.getLessonNoteById(noteId);
        
        await LessonNoteView.renderLessonNotesModal(note, lessonData);
        if (note) Editor.init(document.querySelector('#noteContentEditor'));
    }

    static async getAllLessonNotes() {
        return await LessonNote.getAllLessonNotes();
    }

    static async getAllLessonNotesInTimeRange(startDate, endDate) {
        return await LessonNote.getAllNotesInTimeRange(startDate, endDate);
    }

    static async getLessonNoteForLesson(date, timeslot, className, subject) {
        return await LessonNote.getLessonNoteForLesson(date, timeslot, className, subject);
    }

    static async getLessonNoteById(id) {
        return await LessonNote.getById(id);
    }

    static async saveLessonNote() {
        let noteData = LessonNoteView.getNoteDataFromForm();

        if (noteData.content.trim() == '<p><br></p>' && noteData.id) {
            LessonNoteController.deleteLessonNote(noteData.id);
            LessonNoteView.removeIdAndCreatedFromLessonNoteDialog();
            return;
        } 
        
        if (noteData.id) {
            LessonNoteController.updateLessonNote(noteData);
            return;
        }

        let note = LessonNote.writeDataToInstance(noteData);

        await note.save();
        LessonNoteView.updateLessonNoteDialog(note);
        LessonNoteView.toggleSaveLessonNoteButton(false);
        LessonNoteView.showLessonNoteSavedMessage()
        LessonController.renderLesson();
    }

    static async updateLessonNote(noteData) {
        let note = await LessonNote.getById(noteData.id);

        note = LessonNote.writeDataToInstance(noteData, note);

        note.update();
        LessonNoteView.toggleSaveLessonNoteButton(false);
        LessonNoteView.showLessonNoteSavedMessage()
    }

    static async deleteLessonNote(id) {
        let note = await LessonNote.getById(id);

        note.delete();
        LessonController.renderLesson();
    }

    static async reorderLessonNotes(oldTimetable, oldTimetableChanges) {
        await LessonNote.reorderLessonNotes(oldTimetable, oldTimetableChanges);
    }

    static async getAllRegularLessons() {
        return await LessonController.getAllRegularLessons();
    }

    static async getAllTimetableChanges() {
        return await LessonController.getAllTimetableChanges();
    }

    static toggleSaveLessonNoteButton(event) {
        if (event.target.id != 'noteContentEditor') return;
        LessonNoteView.toggleSaveLessonNoteButton(true);
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
        }

        switch (true) {
            case clickedElement.classList.contains('placeholder'):
                LessonNoteView.removePlaceholderText();
                break;
        }
    }
}