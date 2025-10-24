import LessonNote from "../Model/LessonNote.js";
import LessonNoteView from "../View/LessonNoteView.js";
import AbstractController from "./AbstractController.js";

export default class LessonNoteController {
    static renderLessonNote(event) {
        console.log('da')
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

    static async saveLessonNote(noteData) {
        let note = LessonNote.writeDataToInstance(noteData);

        return await note.save();
    }

    static async updateLessonNote(noteData) {
        let note = await LessonNote.getById(noteData.id);

        note = LessonNote.writeDataToInstance(note, noteData);

        note.update();
    }

    static async deleteLessonNote(id) {
        let note = await LessonNote.getById(id);

        note.delete();
    }
}