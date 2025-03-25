import { allSubjects } from "../index.js";
import { standardTimetable } from "../index.js";
import { timetableChanges } from "../index.js";
import Fn from '../inc/utils.js';

export default class AbstractModel {

    static calculateAllLessonDates(lastTaskDate, className, subject) {

        let today = new Date().setHours(0, 0, 0, 0);
        let lastDate = Fn.getFirstAndLastDayOfWeek(lastTaskDate);
        let teachingWeekdays = [];
        let allLessonDates = [];

        //last date should at least be one week after the last task date, so that tasks can be pushed back on week, 
        //if a lesson is canceled         
        lastDate = lastDate.sunday.setHours(0, 0, 0, 0) + 86400000 * 7;

        //check on which weekdays a lesson is held
        standardTimetable.forEach(entry => {

            if (entry.class != className) return;
            if (entry.subject != subject) return;

            teachingWeekdays.push({ 'weekday': entry.weekdayNumber, 'timeslot': entry.timeslot });
        })

        //get all regular lesson dates till last date
        while (new Date(today).setHours(0, 0, 0, 0) <= lastDate) {
            let weekday = new Date(today).getDay();

            teachingWeekdays.forEach(teachingWeekday => {
                if (teachingWeekday.weekday == weekday) {
                    let data = {
                        'date': new Date(today),
                        'timeslot': teachingWeekday.timeslot,
                        'status': 'normal'
                    };

                    allLessonDates.push(data);
                }
            })

            today += 86400000;
        }

        //merging with the timetable changes
        today = new Date().setHours(0, 0, 0, 0);

        timetableChanges.forEach(entry => {
            if (entry.class != className) return;
            if (entry.subject != subject) return;
            if (new Date(entry.date).setHours(0, 0, 0, 0) < today) return;

            // if (entry.status == 'canceled') {
            //     allLessonDates = AbstractModel.#removeDateOfCanceledLesson(entry, allLessonDates);
            //     return;
            // };

            let data = {
                'date': new Date(entry.date),
                'timeslot': entry.timeslot,
                'status': 'normal'
            }

            if (entry.status == 'canceled') data.status = 'canceled';


            allLessonDates.push(data);
        })

        allLessonDates.sort(Fn.sortByDate);

        AbstractModel.#removeCanceledLessons(allLessonDates);

        console.log(allLessonDates);

        return allLessonDates;
    }


    static #removeCanceledLessons(allLessonDates) {
        allLessonDates.forEach(lessonDate => {

            if (lessonDate.status == 'canceled') {
                for (let i = 0; i < allLessonDates.length; i++) {

                    if (new Date(allLessonDates[i].date).setHours(0, 0, 0, 0) == new Date (lessonDate.date).setHours(0, 0, 0, 0) &&
                        allLessonDates[i].timeslot == lessonDate.timeslot) {

                        allLessonDates.splice(i, 1);
                    }
                }
            }
        })
    }

    // static #removeDateOfCanceledLesson(canceledLesson, allLessonDates) {

    //     for (let i = 0; i < allLessonDates.length; i++) {

    //         if (allLessonDates[i].timeslot != canceledLesson.timeslot) return;
    //         if (allLessonDates[i].date.setHours(0,0,0,0) == new Date(canceledLesson.date).setHours(0,0,0,0))
    //         {
    //             allLessonDates.splice(i,1);
    //         }
    //     }

    //     return allLessonDates;
    // }
}