

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

    static openDayNote(noteData) {
        
    }
}