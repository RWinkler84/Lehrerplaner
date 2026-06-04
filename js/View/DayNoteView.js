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
            dialog.dataset.created = noteData.created;
            editor.innerHTML = noteData.content;
        } else {
            const p = document.createElement('p');
            p.append(document.createElement('br'));

            dialog.dataset.note_id = '';
            editor.append(p);
        }

        noteDateSpan.textContent = Fn.formatDate(weekdayElement.dataset.date);
        dialog.dataset.note_date = weekdayElement.dataset.date;
        Editor.init(editor);

        dialog.showModal();
    }

    static closeDayNote() {

        const dialog = document.querySelector('#dayNoteDialog');
        const editor = dialog.querySelector('.textEditor');

        dialog.close();
        while (editor.childNodes.length != 0) editor.childNodes[0].remove();
    }


    static getNoteDataFromForm() {
        const dialog = document.querySelector('#dayNoteDialog');
        const editor = dialog.querySelector('.textEditor');

        return {
            id: dialog.dataset.note_id,
            date: dialog.dataset.note_date,
            content: Editor.getContent(editor),
            created: dialog.dataset.created
        }
    }

    static toggleSaveDayNoteButton(activate = false) {
        if (activate) {
            document.querySelector('#saveDayNoteButton').removeAttribute('disabled');
            return;
        }

        document.querySelector('#saveDayNoteButton').setAttribute('disabled', '');
    }

    static updateDayNoteDialog(note) {
        const dialog = document.querySelector('#dayNoteDialog');

        dialog.dataset.note_id = note.id;
        dialog.dataset.created = note.created;
    }

    static removeIdFromDialog() {
        document.querySelector('#dayNoteDialog').dataset.note_id = '';
    }
    
    static showDayNoteSavedMessage() {
        const message = document.querySelector('#dayNoteSavedMessage');
        message.classList.add('active');
        setTimeout(() => {
            message.classList.remove('active');
        }, 2000);
    }
}