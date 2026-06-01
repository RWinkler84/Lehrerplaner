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
    }

    static clickHandler(event) {
        const target = event.target;

        switch (target.id) {
            case 'closeDayNoteButton':
            DayNoteController.closeDayNote(); 
        }
    }
}