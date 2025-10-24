import AbstractController from "./AbstractController.js";
import LessonNote from "../Model/LessonNote.js";

export default class LessonNoteController extends AbstractController {
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
        let note = this.#createNoteObjectFromData(noteData);

        return await note.save();
    }

    static async updateLessonNote(noteData) {
        return await LessonNote.updateLessonNote(noteData); 
    }

    static #createNoteObjectFromData(noteData) {
        let note = new LessonNote;

        note.id = noteData.id;
        note.date = noteData.date;
        note.weekday = noteData.weekday;
        note.timeslot = noteData.timeslot;
        note.class = noteData.class;
        note.subject = noteData.subject;
        note.content = noteData.content;

        return note;
    }
}