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

        lessons.forEach(entry => {
            entry.id = Fn.generateId(standardTimetable);
            standardTimetable.push(entry);
        });

        console.log(lessons);

        standardTimetable.sort((a, b) => {
            return new Date(a.validFrom).setHours(12, 0, 0, 0) - new Date(b.validFrom).setHours(12, 0, 0, 0);
        });

        this.makeAjaxQuery('settings', 'saveTimetable', lessons);
    }

    saveTimetableChanges(validFrom, lessons) {
        let timetableHasValidUntil = false;
        let validUntilDate;

        lessons.forEach(lesson => {
            if (lesson.validUntil != undefined) {
                timetableHasValidUntil = true;
                validUntilDate = lesson.validUntil;
            }
            if (!lesson.id) lesson.id = Fn.generateId(standardTimetable);
        })

        // if a lesson is added to a timetable with a validUntil date, this date is missing on the new lesson and needs to be added
        if (timetableHasValidUntil){
            lessons.forEach(lesson => lesson.validUntil = validUntilDate);
        }
        
        standardTimetable.forEach(entry => {
            if (entry.validFrom == validFrom) {
                standardTimetable.splice(standardTimetable.indexOf(entry));
            }
        })

        console.log(lessons);

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
        
        if (allValidDates.length == 0) return lessons;

        //intermediate timetable
        allValidDates.forEach(entry => {
            let date = new Date(entry).setHours(12, 0, 0, 0);

            if (date > new Date(lessons[0].validFrom).setHours(12, 0, 0, 0)) {
                let validUntilDate = date - ONEDAY;
                validUntilDate = this.formatDate(validUntilDate);

                lessons.forEach(lesson => lesson.validUntil = validUntilDate);
            }
        });

        //give the validUntil date to all lessons of the timetable that where valid right before the new timetable 
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

    async logout(){
        let result = await this.makeAjaxQuery('user', 'logout');
        
        if (result.status == 'success') {
            location.reload();
        }
    }
}