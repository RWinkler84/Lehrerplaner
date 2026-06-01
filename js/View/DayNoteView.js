import Fn from '../inc/utils.js';
import Editor from '../inc/editor.js';

export default class DayNoteView {

    static renderDayNoteIcons(dayNotes) {
        const allWeekdays = document.querySelectorAll('.weekday');
        const allDayNoteIndicators = document.querySelectorAll('.dayNoteIndicator');

        allDayNoteIndicators.forEach(indicator => {
            indicator.removeAttribute('style');
            indicator.dataset.note_id = '';
        })

        dayNotes.forEach(note => {
            const noteDateTimestamp = note.date.setHours(12, 0, 0, 0);
            allWeekdays.forEach(dayElement => {
                if (new Date(dayElement.dataset.date).setHours(12, 0, 0, 0) == noteDateTimestamp) {
                    const dayNoteIndicator = dayElement.querySelector('.dayNoteIndicator');

                    dayNoteIndicator.style.backgroundColor = 'var(--bodyBackground)';
                    dayNoteIndicator.dataset.note_id = note.id;
                }
            });
        })
    }

    static openDayNote(weekdayElement, noteData = null) {
        const dialog = document.querySelector('#dayNoteDialog');
        const noteDateSpan = dialog.querySelector('#dayNoteDateSpan');
        const editor = dialog.querySelector('.textEditor');

        if (noteData) {
            dialog.dataset.note_id = noteData.id;
            editor.innerHTML = noteData.content;
        } else {
            const p = document.createElement('p');
            p.append(document.createElement('br'));

            dialog.dataset.note_id = '';
            editor.append(p);
        }

        noteDateSpan.textContent = Fn.formatDate(weekdayElement.dataset.date);
        Editor.init(editor);

        dialog.showModal();
    }

    static closeDayNote() {

        const dialog = document.querySelector('#dayNoteDialog');
        const editor = dialog.querySelector('.textEditor');

        dialog.close();
        while (editor.childNodes.length != 0) editor.childNodes[0].remove();
    }
}