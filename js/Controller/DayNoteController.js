import DayNote from '../Model/DayNote.js';
import View from '../View/DayNoteView.js';
import Fn from '../inc/utils.js';

export default class DayNoteController {
    static async renderDayNoteIcons() {
        const week = Fn.getDatesOfCurrentlyDisplayedWeek();
        const dayNotes = await DayNote.getAllDayNotesInTimeSpan(week.monday, week.sunday);

        View.renderDayNoteIcons(dayNotes);
    }

    static async openDayNote(event) {
        const id = event.target.dataset.note_id;
        const weekdayElement = event.target.closest('.weekday');

        if (id) {
            const noteData = await DayNote.getById(id);

            View.openDayNote(weekdayElement, noteData);

            return;
        }

        View.openDayNote(weekdayElement);
    }

    static closeDayNote() {
        View.closeDayNote();
        View.toggleSaveDayNoteButton();
    }

    static toggleSaveDayNoteButton(event) {
        if (event.target.id != 'dayNoteContentEditor') return;
        View.toggleSaveDayNoteButton(true);
    }

    static async saveDayNote() {
        const noteData = View.getNoteDataFromForm();

        if (noteData.id && document.querySelector('#dayNoteContentEditor').textContent.trim() == '') {
            this.deleteDayNote(noteData.id);
            return;
        }

        if (noteData.id) {
            this.updateDayNote(noteData);
            return;
        }

        const note = DayNote.writeDataToInstance(noteData);

        await note.save();

        View.toggleSaveDayNoteButton(false);
        View.updateDayNoteDialog(note);
        View.showDayNoteSavedMessage();
        this.renderDayNoteIcons();
    }

    static async updateDayNote(noteData) {
        let note = await DayNote.getById(noteData.id);

        note = DayNote.writeDataToInstance(noteData, note);

        await note.update();

        View.toggleSaveDayNoteButton(false);
        View.showDayNoteSavedMessage();
        this.renderDayNoteIcons();
    }

    static async deleteDayNote(id) {
        let note = await DayNote.getById(id);

        await note.delete();

        View.removeIdFromDialog();
        View.toggleSaveDayNoteButton(false);
        View.showDayNoteSavedMessage();
        this.renderDayNoteIcons();
    }

    static clickHandler(event) {
        const target = event.target;

        switch (target.id) {
            case 'closeDayNoteButton':
                DayNoteController.closeDayNote();
                break;

            case 'saveDayNoteButton':
                DayNoteController.saveDayNote();
                break;
        }
    }
}