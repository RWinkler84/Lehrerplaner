import { allSubjects, timetableChanges, ONEDAY } from "../index.js";
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

    async checkDataState() {
        console.log('checking Data');

        let allSubjectsRemote = await this.makeAjaxQuery('abstract', 'getSubjects');
        let standardTimetableRemote = await this.makeAjaxQuery('abstract', 'getTimetable');
        let timetableChangesRemote = await this.makeAjaxQuery('abstract', 'getTimetableChanges');
        let allTasksRemote = await this.makeAjaxQuery('abstract', 'getAllTasks');

        //subjects
        let subjectsToSave = [];
        let subjectsToDelete = [];
        let subjectsToUpdate = [];

        if (allSubjectsRemote.length < allSubjects.length) {
            subjectsToSave = this.#findDataToSave(allSubjects, allSubjectsRemote);
        } else if (allSubjectsRemote.length > allSubjects.length) {
            subjectsToDelete = this.#findDataToDelete(allSubjectsRemote, allSubjects);
        } else {
            subjectsToUpdate = this.#findDataToUpdate(allSubjects, allSubjectsRemote);
        }

        console.log('subjectsToSave');
        console.log(subjectsToSave);
        console.log('subjectsToUpdate');
        console.log(subjectsToUpdate);
        console.log('subjectsToDelete');
        console.log(subjectsToDelete);


        /*
        check by id
            -> if id exists, check if the content is equal
                -> if not, push the date to an update array
            -> if doesn't exist, push the date to an create array
        send the create and update array to the backend, if they are not empty

        do for every dataset
        */

    }

    #findDataToSave(biggerDataset, smallerDataset) {
        let dataToSave = [];

        biggerDataset.forEach(datasetA => {
            let match = false;

            smallerDataset.every(datasetB => {
                if (datasetA.id == datasetB.id) {
                    match = true;
                    return false;
                }
                return true;
            });

            if (!match) dataToSave.push(datasetA);
        });

        return dataToSave;
    }

    #findDataToDelete(biggerDataset, smallerDataset) {
        let dataToDelete = [];

        biggerDataset.forEach(datasetA => {
            let match = false;

            smallerDataset.every(datasetB => {
                if (datasetA.id == datasetB.id) {
                    match = true;
                    return false;
                }
                return true;
            });

            if (!match) dataToDelete.push(datasetA);
        });

        return dataToDelete;
    }

    #findDataToUpdate(localDataset, remoteDataset) {
        let dataToUpdate = [];

        for (let i = 0; i < localDataset.length; i++) {
            let needsUpdate = false;

            for (let key in localDataset[i]) {
                localDataset[i][key] != remoteDataset[i][key] ? needsUpdate = true : '';
            }

            if (needsUpdate) dataToUpdate.push(localDataset);
        }

        return dataToUpdate;
    }

}