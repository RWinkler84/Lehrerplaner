import { allSubjects, timetableChanges } from "../index.js";
import { standardTimetable } from "../index.js";
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

    static calculateAllLessonDates(className, subject, endDate, timetable = standardTimetable, lessonChanges = timetableChanges) {

        let dateIterator = new Date().setHours(12, 0, 0, 0);
        let validTimetableDates = AbstractModel.getCurrentlyAndFutureValidTimetableDates();
        let teachingWeekdays = [];
        let allLessonDates = [];

        //check on which weekdays a lesson is held
        timetable.forEach(entry => {
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

        //get all regular lesson dates till last date
        while (new Date(dateIterator).setHours(12, 0, 0, 0) <= endDate) {

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

        lessonChanges.forEach(entry => {
            if (entry.class != className) return;
            if (entry.subject != subject) return;
            if (new Date(entry.date).setHours(12, 0, 0, 0) < today) return;

            let data = {
                'date': new Date(entry.date),
                'timeslot': entry.timeslot,
                'canceled': entry.canceled,
                'type': entry.type,
                'source': 'timetableChanges'
            }

            allLessonDates.push(data);
        })

        allLessonDates.sort(Fn.sortByDate);

        AbstractModel.#removeInvalidAndCanceledLessons(allLessonDates);

        return allLessonDates;

    }

    static calculatePotentialLessonDates(timetableValidDate, lastTaskDate, className, subject) {
        let dateIterator = new Date().setHours(12, 0, 0, 0);
        let lastDate = Fn.getFirstAndLastDayOfWeek(lastTaskDate);
        let teachingWeekdays = [];
        let allLessonDates = [];

        //last calculated date should at least be a month after the last task date, so that tasks can be pushed back enough, 
        //if a lesson is canceled or the timetable and lessons per subject count changes        
        lastDate = lastDate.sunday.setHours(12, 0, 0, 0) + 86400000 * 30;

        //check on which weekdays a lesson is held
        standardTimetable.forEach(entry => {
            if (entry.validFrom != timetableValidDate) return;
            if (entry.class != className) return;
            if (entry.subject != subject) return;

            teachingWeekdays.push({
                'weekday': entry.weekdayNumber,
                'timeslot': entry.timeslot,
                'validFrom': entry.validFrom,
                'validUntil': entry.validUntil
            });
        })

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
                'canceled': entry.canceled,
                'type': entry.type,
                'source': 'timetableChanges'
            }

            allLessonDates.push(data);
        })

        allLessonDates.sort(Fn.sortByDate);

        //filter out canceled lessons
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

        //filter out duplicates
        allLessonDates.forEach(lesson => {
            if (lesson.type == 'normal' && lesson.canceled == 'false' && lesson.source == 'timetableChanges') {
                allLessonDates.splice(allLessonDates.indexOf(lesson), 1);
            }
        })

        return allLessonDates;
    }

    static #removeInvalidAndCanceledLessons(allLessonDates) {
        let entriesToFilterOut = [];

        //filters out regular lesson dates, that have been marked as canceled
        allLessonDates.forEach(lessonDate => {

            if (lessonDate.canceled == 'true') entriesToFilterOut.push(lessonDate);
        });

        entriesToFilterOut.forEach(lessonToRemove => {
            for (let i = allLessonDates.length - 1; i >= 0; i--) {

                if (new Date(allLessonDates[i].date).setHours(12, 0, 0, 0) == new Date(lessonToRemove.date).setHours(12, 0, 0, 0)
                    && allLessonDates[i].timeslot == lessonToRemove.timeslot
                ) {
                    allLessonDates.splice(i, 1);
                }
            }
        });

        //filters out lessons belonging to timetables that are not yet valid or not valid anymore

        // not yet valid
        for (let i = allLessonDates.length - 1; i >= 0; i--) {
            if (new Date(allLessonDates[i].date).setHours(12, 0, 0, 0) < new Date(allLessonDates[i].validFrom).setHours(12, 0, 0, 0)) {
                allLessonDates.splice(i, 1);
            }
        }

        //not valid anymore
        for (let i = allLessonDates.length - 1; i >= 0; i--) {
            if (new Date(allLessonDates[i].date).setHours(12, 0, 0, 0) > new Date(allLessonDates[i].validUntil).setHours(12, 0, 0, 0)
                && allLessonDates[i].validUntil != undefined
            ) {
                allLessonDates.splice(i, 1);
            }
        }

        //filters out duplicates
        allLessonDates.forEach(lesson => {
            if (lesson.type == 'normal' && lesson.canceled == 'false' && lesson.source == 'timetableChanges') {
                allLessonDates.splice(allLessonDates.indexOf(lesson), 1);
            }
        })
    }

    formatDate(date) {
        let dateObject = new Date(date);
        let timeString = dateObject.getFullYear() + '-' + (dateObject.getMonth() + 1).toString().padStart(2, '0') + '-' + dateObject.getDate().toString().padStart(2, '0');

        return timeString;
    }

    static getAllSubjects() {
        return allSubjects;
    }

    static getAllValidDates() {
        let allValidDates = [];

        standardTimetable.forEach(entry => {
            if (!allValidDates.includes(entry.validFrom)) allValidDates.push(entry.validFrom);
        })

        return allValidDates;
    }

    static getLessonsCountPerWeekPerSubjectAndClass(timetable) {
        let filtered = [];

        timetable.forEach(lesson => {
            if (!filtered[lesson.validFrom]) filtered[lesson.validFrom] = {};
            if (!filtered[lesson.validFrom][lesson.class]) filtered[lesson.validFrom][lesson.class] = {};
            if (!filtered[lesson.validFrom][lesson.class][lesson.subject]) {
                filtered[lesson.validFrom][lesson.class][lesson.subject] = 1;
            } else {
                filtered[lesson.validFrom][lesson.class][lesson.subject]++;
            }
        });

        return filtered;
    }

    // this function returns only valid timetable dates that are valid right now or will be
    // valid in the future
    static getCurrentlyAndFutureValidTimetableDates() {
        let allValidDates = AbstractModel.getAllValidDates();
        let validDates = [];
        let today = new Date().setHours(12, 0, 0, 0);

        let i = allValidDates.length;

        do {
            i--;
            validDates.push(allValidDates[i]);
        } while (new Date(allValidDates[i]).setHours(12, 0, 0, 0) >= today);

        validDates.sort(Fn.sortByDate);

        return validDates;
    }
}