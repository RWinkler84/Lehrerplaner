import { allSubjects, timetableChanges, ONEDAY, allTasksArray, unsyncedDeletedSubjects } from "../index.js";
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
            return { 'status': 'failed' };
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

            dateIterator += ONEDAY;
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

    markUnsynced(id, hostDataset) {
        hostDataset.forEach(entry => {
            if (entry.id != id) return;
            entry.synced = false;
            entry.lastEdited = new Date();
        })
    }

    async checkDataState() {
        console.log('checking Data');
        console.log('timetable:');
        console.log(standardTimetable);
        console.log('timetablechanges:');
        console.log(timetableChanges);
        console.log('subjects:');
        console.log(allSubjects);
        console.log('tasks:');
        console.log(allTasksArray);
        console.log('to delete')
        console.log(unsyncedDeletedSubjects);

        let dataToSync = {
            'subjects': [],
            'timetable': [],
            'timetableChanges': [],
            'tasks': []
        };
        let result;

        allSubjects.forEach(entry => {
            if (entry.synced == false) dataToSync['subjects'].push(entry);
        });

        standardTimetable.forEach(entry => {
            if (entry.synced == false) dataToSync['timetable'].push(entry);
        });

        timetableChanges.forEach(entry => {
            if (entry.synced == false) dataToSync['timetableChanges'].push(entry);
        });

        allTasksArray.forEach(entry => {
            if (entry.synced == false) dataToSync['tasks'].push(entry);
        });


        // first delete, what needs to be deleted 
        if (unsyncedDeletedSubjects.length > 0) {
            result = await this.makeAjaxQuery('settings', 'deleteSubject', unsyncedDeletedSubjects);

            result.forEach(entry => {
                if (entry.status == 'success') {
                    unsyncedDeletedSubjects.forEach(subject => {
                        if (subject.id == entry.id) unsyncedDeletedSubjects.splice(unsyncedDeletedSubjects.indexOf(subject), 1);
                    });
                }
            });
        }

        //if the deletion worked, go on to sync the rest
        if (unsyncedDeletedSubjects.length == 0) {
            result = await this.makeAjaxQuery('abstract', 'syncDatabase', dataToSync);


        }


        console.log('dataToSync');
        console.log(dataToSync);

        // then send the rest, that needs to be saved or updated
    }
}