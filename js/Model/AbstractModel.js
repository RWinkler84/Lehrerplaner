import { allSubjects } from "../index.js";
import { standardTimetable } from "../index.js";
import { timetableChanges } from "../index.js";
import Fn from '../inc/utils.js';

export default class AbstractModel {

    async makeAjaxQuery(controller, action, content = '') {
        let response;

        try {
            response = await fetch(`index.php?c=${controller}&a=${action}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(content)
                })
        }
        catch (error) {
            console.log('Uppsi...' + error);
        }

        return response.json();
    }

    static calculateAllLessonDates(lastTaskDate, className, subject) {

        let dateIterator = new Date().setHours(12, 0, 0, 0);
        let lastDate = Fn.getFirstAndLastDayOfWeek(lastTaskDate);
        let validTimetableDates = AbstractModel.getValidTimetableDates();
        let teachingWeekdays = [];
        let allLessonDates = [];

        //last date should at least be one week after the last task date, so that tasks can be pushed back on week, 
        //if a lesson is canceled         
        lastDate = lastDate.sunday.setHours(12, 0, 0, 0) + 86400000 * 7;

        //check on which weekdays a lesson is held
        standardTimetable.forEach(entry => {
            if (entry.class != className) return;
            if (entry.subject != subject) return;
            if (!validTimetableDates.includes(entry.validFrom)) return;

            teachingWeekdays.push({
                'weekday': entry.weekdayNumber,
                'timeslot': entry.timeslot,
                'validFrom': entry.validFrom,
                'validUntil': entry.validUntil
            });
        })

        console.log('validTimetableDates' + validTimetableDates);
        console.log('teachingWeekdays:');
        console.log(teachingWeekdays);
        console.log('lastDate ' + new Date(lastDate));

        //get all regular lesson dates till last date
        while (new Date(dateIterator).setHours(12, 0, 0, 0) <= lastDate) {

            let weekday = new Date(dateIterator).getDay();

            teachingWeekdays.forEach(teachingWeekday => {
                if (teachingWeekday.weekday == weekday) {
                    let data = {
                        'date': new Date(dateIterator),
                        'validFrom': teachingWeekday.validFrom,
                        'validUntil': teachingWeekday.validUntil,
                        'timeslot': teachingWeekday.timeslot,
                        'canceled': 'false'
                    };

                    allLessonDates.push(data);
                }
            })

            dateIterator += 86400000;
        }

        //merging with the timetable changes
        let today = new Date().setHours(12, 0, 0, 0);

        timetableChanges.forEach(entry => {
            if (entry.class != className) return;
            if (entry.subject != subject) return;
            if (new Date(entry.date).setHours(12, 0, 0, 0) < today) return;

            let data = {
                'date': new Date(entry.date),
                'timeslot': entry.timeslot,
                'canceled': entry.canceled
            }

            allLessonDates.push(data);
        })

        allLessonDates.sort(Fn.sortByDate);

        AbstractModel.#removeInvalidAndCanceledLessons(allLessonDates);

        console.log('alle Termine:')
        console.log(allLessonDates);

        return allLessonDates;
    }


    static #removeInvalidAndCanceledLessons(allLessonDates) {

        //filters out regular lesson dates, that have been marked as canceled
        allLessonDates.forEach(lessonDate => {

            if (lessonDate.canceled == true) {
                for (let i = 0; i < allLessonDates.length; i++) {

                    if (new Date(allLessonDates[i].date).setHours(12, 0, 0, 0) == new Date(lessonDate.date).setHours(12, 0, 0, 0) &&
                        allLessonDates[i].timeslot == lessonDate.timeslot) {

                        allLessonDates.splice(i, 1);
                    }
                }
            }
        })

        //filters out lessons belonging to timetables that are not yet valid or not valid anymore
        // not yet valid
        for (let i = 0; i < allLessonDates.length; i++) {

            if (new Date(allLessonDates[i].date).setHours(12, 0, 0, 0) < new Date(allLessonDates[i].validFrom).setHours(12, 0, 0, 0)) {
                allLessonDates.splice(i, 1);
            }
        }

        //not valid anymore
        for (let i = 0; i < allLessonDates.length; i++) {

            if (new Date(allLessonDates[i].date).setHours(12, 0, 0, 0) > new Date(allLessonDates[i].validUntil).setHours(12, 0, 0, 0)) {
                allLessonDates.splice(i, 1);
            }
        }
    }

    formatDate(dateToFormat) {
        let date = new Date(dateToFormat);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    static getAllSubjects() {
        return allSubjects;
    }

    static getValidTimetableDates() {
        let allValidDates = [];
        let validDates = [];
        let today = new Date().setHours(12, 0, 0, 0);

        standardTimetable.forEach(entry => {
            if (!allValidDates.includes(entry.validFrom)) allValidDates.push(entry.validFrom);
        })

        let i = allValidDates.length;

        do {
            i--;
            validDates.push(allValidDates[i]);
        } while (new Date(allValidDates[i]).setHours(12, 0, 0, 0) >= today);

        validDates.sort(Fn.sortByDate);

        return validDates;
    }
}