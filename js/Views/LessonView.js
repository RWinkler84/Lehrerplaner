import Controller from "../Controllers/LessonController.js";

export default class LessonView {

    static renderLesson() {
        let monday = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
        let sunday = document.querySelector('.weekday[data-weekday_number="0"]').dataset.date;

        let regularLessons = Controller.getScheduledLessons();
        let lessonChanges = Controller.getTimetableChanges(monday, sunday);

        regularLessons.forEach((lesson) => {
            let timeslot = this.#getTimeslotOfLesson(lesson);
            timeslot.innerHTML = `<div class="lesson ${lesson.cssColorClass}" data-taskid="">${lesson.class} ${lesson.subject}</div>`;

        })

        //reflect timetable changes
        lessonChanges.forEach((lesson) => {

            let timeslot = this.#getTimeslotOfLesson(lesson);

            if (lesson.status == 'sub') {
                timeslot.innerHTML = `<div class="lesson ${lesson.cssColorClass}" data-taskid="">${lesson.class} ${lesson.subject}</div>`;
            }

            if (lesson.status == 'canceled') {
                timeslot.firstElementChild.classList.add('canceled');
            }
        })

    }

    static #getTimeslotOfLesson(lesson) {

        let allWeekdays = document.querySelectorAll('.weekday');
        let weekday;
        let timeslot;

        if (!lesson.date) {
            allWeekdays.forEach((day) => { if (day.dataset.weekday_number == lesson.weekday) weekday = day });
            weekday.querySelectorAll('.timeslot').forEach((slot) => { if (slot.dataset.timeslot == lesson.timeslot) timeslot = slot });

            return timeslot;
        }

        allWeekdays.forEach((day) => {
            let dateOfWeekday = new Date(day.dataset.date)
            let dateOfLesson = new Date(lesson.date).setHours(0, 0, 0, 0);

            if (dateOfWeekday.getTime() == dateOfLesson) weekday = day;
        });

        weekday.querySelectorAll('.timeslot').forEach((slot) => { if (slot.dataset.timeslot == lesson.timeslot) timeslot = slot; });

        return timeslot;
    }

    static removeAllLessons(element) {
        element.querySelectorAll('.lesson').forEach((lesson) => {
            lesson.remove();
        })
    }


}