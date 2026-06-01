import DayNote from '../Model/DayNote.js';
import View from '../View/DayNoteView.js';
import Fn from '../inc/utils.js';

export default class DayNoteController {
    static renderDayNoteIcons() {
        const week = Fn.getDatesOfCurrentlyDisplayedWeek();
        const dayNotes = DayNote.getAllDayNotesInTimeSpan(week.monday, week.sunday);

        View.renderDayNoteIcons(dayNotes);
    }

    static openDayNote(event) {
        const id = event.target.dataset.note_id;
        if (id) {
            const noteData = DayNote.getDayNoteById(id);
        
            View.openDayNote(noteData);
        }
    }

    static clickHandler(event) {

    }
}