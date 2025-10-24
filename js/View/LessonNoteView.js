import LessonNoteController from "../Controller/LessonNoteController.js";
import AbstractView from "./AbstractView.js";
import Fn from "../inc/utils.js"; 

export default class LessonNoteView extends AbstractView {
    static async renderLessonNotesModal(event) {
        const lesson = event.target.closest('.lesson');
        const className = lesson.dataset.class;
        const subject = lesson.dataset.subject;
        const date = lesson.closest('.weekday').dataset.date;
        const timeslot = lesson.closest('.timeslot').dataset.timeslot;
        const lessonNotes = await LessonNoteController.getAllLessonNotesInTimeRange(date);

        let matchedNote;

        lessonNotes.forEach(note => {
            if (Fn.formatDate(note.date) != Fn.formatDate(date)) return;
            if (note.timeslot != timeslot) return;
            if (note.class != className) return;
            if (note.subject != subject) return;

            matchedNote = note;
        })

        

        console.log(date)
        console.log(timeslot)
        console.log(lessonNotes)
        

    }
}