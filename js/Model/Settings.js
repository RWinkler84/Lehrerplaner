import { ONEDAY } from "../index.js";
import AbstractModel from "./AbstractModel.js";
import Fn from "../inc/utils.js"
import SettingsController from "../Controller/SettingsController.js";

export default class Settings extends AbstractModel {
    constructor() {
        super();
    }

    async saveSubject(subject) {
        let allSubjects = await this.getAllSubjects();
        subject.id = Fn.generateId(allSubjects);
        subject.lastEdited = this.formatDateTime(new Date());

        this.writeToLocalDB('subjects', subject);

        let result = await this.makeAjaxQuery('settings', 'saveSubject', subject);

        if (result.status == 'failed') {
            this.writeToLocalDB('unsyncedSubjects', subject);
        }
    }

    async deleteSubject(id) {
        let deletedSubject = await this.readFromLocalDB('subjects', id);

        this.deleteFromLocalDB('subjects', id);

        let result = await this.makeAjaxQuery('settings', 'deleteSubjects', [{ 'id': id }]);

        if (result.status == 'failed') {
            deletedSubject.lastEdited = this.formatDateTime(new Date());
            this.writeToLocalDB('unsyncedDeletedSubjects', deletedSubject);
        }

        return;
    }

    async saveNewTimetable(lessons) {
        let standardTimetable = await SettingsController.getAllRegularLessons();
        lessons = await this.setValidUntilDates(lessons, standardTimetable);

        lessons.forEach(entry => {
            entry.id = Fn.generateId(standardTimetable);
            entry.lastEdited = this.formatDateTime(new Date());
            standardTimetable.push(entry);

            this.writeToLocalDB('timetable', entry);
        });

        let result = await this.makeAjaxQuery('settings', 'saveTimetable', lessons);

        if (result.status == 'failed') {
            lessons.forEach(entry => {
                this.writeToLocalDB('unsyncedTimetables', entry);
            });
        }
    }

    async saveTimetableUpdates(validFrom, lessons) {
        let standardTimetable = await SettingsController.getAllRegularLessons();
        let timetableHasValidUntil = false;
        let validUntilDate;
        let deletedLessons = [];

        //remove the old timetable
        for (let i = standardTimetable.length - 1; i >= 0; i--) {
            if (standardTimetable[i].validFrom == validFrom) {
                await this.deleteFromLocalDB('timetable', standardTimetable[i].id)
                deletedLessons.push((standardTimetable.splice(i, 1))[0]);
            }
        }

        lessons.forEach(lesson => {
            if (lesson.validUntil === 'null' || lesson.validUntil === 'undefined') lesson.validUntil = null;

            if (lesson.validUntil) {
                timetableHasValidUntil = true;
                validUntilDate = lesson.validUntil;
            }

            if (!lesson.id) lesson.id = Fn.generateId(standardTimetable);

            // if a lesson is added to a timetable with a validUntil date, this date is missing on the new lesson and needs to be added
            if (timetableHasValidUntil) lesson.validUntil = validUntilDate;
            lesson.lastEdited = this.formatDateTime(new Date());

            standardTimetable.push(lesson);
            this.writeToLocalDB('timetable', lesson);
        })

        let result = await this.makeAjaxQuery('settings', 'saveTimetableUpdates', lessons);

        if (result.status == 'failed') {
            lessons.forEach(entry => {
                this.updateOnLocalDB('unsyncedTimetables', entry);
            });
            deletedLessons.forEach(entry => {
                this.writeToLocalDB('unsyncedDeletedTimetableLessons', entry.serialize());
            })
        }
    }

    // sets the valid until date on the old timetable and checks, if the new one is an
    // intermediate timetable, that also needs a validUntil date
    async setValidUntilDates(lessons, standardTimetable) {

        let previousTimetableValidFromDate;
        let allValidDates = await AbstractModel.getAllValidDates();
        let prevTimetableValidUntil = new Date(lessons[0].validFrom).setHours(12, 0, 0, 0) - ONEDAY;
        prevTimetableValidUntil = this.formatDate(prevTimetableValidUntil);

        if (allValidDates.length == 0) return lessons;

        //give the validUntil date to all lessons of the timetable that where valid right before the new timetable 
        let i = allValidDates.length;

        do {
            i--
            previousTimetableValidFromDate = allValidDates[i];
        } while (new Date(allValidDates[i]).setHours(12, 0, 0, 0) > new Date(lessons[0].validFrom).setHours(12, 0, 0, 0))

        standardTimetable.forEach(entry => {
            if (entry.validFrom == previousTimetableValidFromDate) {
                entry.validUntil = prevTimetableValidUntil;
                entry.lastEdited = this.formatDateTime(new Date());
                this.updateOnLocalDB('timetable', entry.serialize());
            }
        })


        let result = await this.makeAjaxQuery('settings', 'updateValidUntil', {
            'dateOfAffectedLessons': previousTimetableValidFromDate,
            'validUntil': prevTimetableValidUntil,
            'lastEdited': this.formatDateTime(new Date())
        });

        if (result.status == 'failed') {
            standardTimetable.forEach(entry => {
                if (entry.validFrom != previousTimetableValidFromDate) return;
                this.writeToLocalDB('unsyncedTimetables', entry.serialize());
            })
        }

        //intermediate timetable
        allValidDates.forEach(entry => {
            let date = new Date(entry).setHours(12, 0, 0, 0);

            if (date > new Date(lessons[0].validFrom).setHours(12, 0, 0, 0)) {
                let validUntilDate = date - ONEDAY;
                validUntilDate = this.formatDate(validUntilDate);

                lessons.forEach(lesson => lesson.validUntil = validUntilDate);
            }
        });

        //validUntil can be an 'null'-string which causes problems
        lessons.forEach(lesson => {
            if (lesson.validUntil === 'null') {
                lesson.validUntil = null;
            }
        });

        return lessons;
    }

    async logout() {
        let result = await this.makeAjaxQuery('user', 'logout');

        if (result.status == 'success') {
            document.cookie = `lprm=; expires=Thu, 01 Jan 1970 00:00:00 UTC;}`;
            location.reload();
        }
    }

    async deleteAccount() {
        let result = await this.makeAjaxQuery('user', 'deleteAccount');

        return result;
    }

    async getAllSubjects() {
        return await this.readAllFromLocalDB('subjects');
    }
}