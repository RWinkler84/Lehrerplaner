import { allSubjects } from "../index.js";
import { standardTimetable } from "../index.js";
import { ONEDAY } from "../index.js";
import AbstractModel from "./AbstractModel.js";
import Fn from "../inc/utils.js"
import AbstractController from "../Controller/AbstractController.js";

export default class Settings extends AbstractModel {

    constructor() {
        super();
    }

    saveSubject(subject) {
        subject.id = Fn.generateId(allSubjects);

        allSubjects.push(subject);

        this.makeAjaxQuery('settings', 'saveSubject', subject);
    }

    deleteSubject(id) {

        for (let i = 0; i < allSubjects.length; i++) {
            if (allSubjects[i].id == id) {
                allSubjects.splice(i, 1);

                this.makeAjaxQuery('settings', 'deleteSubject', { 'id': id });

                return;
            }
        }
    }

    saveNewTimetable(lessons) {
        lessons = this.setValidUntilDates(lessons);

        lessons.forEach(entry => standardTimetable.push(entry));

        standardTimetable.sort((a, b) => {
            return new Date(a.validFrom).setHours(12, 0, 0, 0) - new Date(b.validFrom).setHours(12, 0, 0, 0);
        });

        this.makeAjaxQuery('settings', 'saveTimetable', lessons);
    }

    saveTimetableChanges(validFrom, lessons) {

        standardTimetable.forEach(entry => {
            if (entry.validFrom == validFrom) {
                standardTimetable.splice(standardTimetable.indexOf(entry));
            }
        })

        lessons.forEach(entry => standardTimetable.push(entry));

        this.makeAjaxQuery('settings', 'saveTimetableChanges', lessons);
    }

    // sets the valid until date on the old timetable and checks, if the new one is an
    // intermediate timetable, that also needs a validUntil date
    setValidUntilDates(lessons) {

        let previousTimetableValidFromDate;
        let allValidDates = AbstractModel.getAllValidDates();
        let prevTimetableValidUntil = new Date(lessons[0].validFrom).setHours(12, 0, 0, 0) - ONEDAY;
        prevTimetableValidUntil = this.formatDate(prevTimetableValidUntil);

        //intermediate timetable
        allValidDates.forEach(entry => {
            let date = new Date(entry).setHours(12, 0, 0, 0);

            if (date > new Date(lessons[0].validFrom).setHours(12, 0, 0, 0)) {
                let validUntilDate = date - ONEDAY;
                validUntilDate = this.formatDate(validUntilDate);

                lessons.forEach(lesson => lesson.validUntil = validUntilDate);
            }
        });

        //give the validUntil date to all lessons on in the allLessons array that have the latest validFrom date
        let i = allValidDates.length;

        do {
            i--
            previousTimetableValidFromDate = allValidDates[i];
        } while (new Date(allValidDates[i]).setHours(12, 0, 0, 0) > new Date(lessons[0].validFrom).setHours(12, 0, 0, 0))

        standardTimetable.forEach(entry => {
            if (entry.validFrom == previousTimetableValidFromDate) entry.validUntil = prevTimetableValidUntil;
        })

        this.makeAjaxQuery('settings', 'updateValidUntil', {
            'dateOfAffectedLessons': previousTimetableValidFromDate,
            'validUntil': prevTimetableValidUntil
        })

        return lessons;
    }
}