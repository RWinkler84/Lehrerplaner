import { ONEDAY } from "../index.js";
import AbstractModel from "./AbstractModel.js";
import Fn from "../inc/utils.js"
import SettingsController from "../Controller/SettingsController.js";
import TimetableController from "../Controller/TimetableController.js";

export default class Settings extends AbstractModel {
    constructor() {
        super();
    }

    async saveSubject(subject) {
        let allSubjects = await this.getAllSubjects();
        subject.id = Fn.generateId(allSubjects);
        subject.lastEdited = this.formatDateTime(new Date());
        subject.created = subject.lastEdited;

        this.writeToLocalDB('subjects', subject);

        let result = await this.makeAjaxQuery('settings', 'saveSubject', subject);

        if (result.status == 'failed') {
            this.updateOnLocalDB('unsyncedSubjects', subject);
        }
    }

    async deleteSubject(id) {
        let deletedSubject = await this.readFromLocalDB('subjects', id);

        this.deleteFromLocalDB('subjects', id);
        this.deleteFromLocalDB('unsyncedSubjects', id);

        let result = await this.makeAjaxQuery('settings', 'deleteSubjects', [{ 'id': id, 'created': deletedSubject.created, 'lastEdited': deletedSubject.lastEdited }]);

        if (result.status == 'failed') {
            deletedSubject.lastEdited = this.formatDateTime(new Date());
            this.updateOnLocalDB('unsyncedDeletedSubjects', deletedSubject);
        }

        return;
    }

    async saveNewTimetable(lessons) {
        let standardTimetable = await SettingsController.getAllRegularLessons();
        lessons = await this.setValidUntilDates(lessons, standardTimetable);

        lessons.forEach(entry => {
            entry.id = Fn.generateId(standardTimetable);
            entry.lastEdited = this.formatDateTime(new Date());
            entry.created = entry.lastEdited;

            standardTimetable.push(entry);

            this.writeToLocalDB('timetable', entry);
        });

        let result = await this.makeAjaxQuery('settings', 'saveTimetable', lessons);

        if (result.status == 'failed') {
            lessons.forEach(entry => {
                this.updateOnLocalDB('unsyncedTimetables', entry);
            });
        }
    }

    async saveTimetableUpdates(validFrom, lessons) {
        let standardTimetable = await SettingsController.getAllRegularLessons();
        let timetableHasValidUntil = false;
        let validUntilDate;
        let timetableCreationDate;

        //remove the old timetable
        for (let i = standardTimetable.length - 1; i >= 0; i--) {
            if (standardTimetable[i].validFrom == validFrom) {
                await this.deleteFromLocalDB('timetable', standardTimetable[i].id)
                standardTimetable.splice(i, 1);
            }
        }

        lessons.forEach(lesson => {
            if (lesson.validUntil === 'null' || lesson.validUntil === 'undefined') lesson.validUntil = null;
            if (lesson.created) timetableCreationDate = lesson.created;

            if (lesson.validUntil) {
                timetableHasValidUntil = true;
                validUntilDate = lesson.validUntil;
            }

            if (!lesson.id) lesson.id = Fn.generateId(standardTimetable);

            lesson.lastEdited = this.formatDateTime(new Date());

            standardTimetable.push(lesson);
        })

        //some lessons may not have a validUntil or creation date, which needs to match the other lessons of the timetable
        lessons.forEach(lesson => {
            // if a lesson is added to a timetable with a validUntil date, this date is missing on the new lesson and needs to be added
            if (timetableHasValidUntil) lesson.validUntil = validUntilDate;
            if (!lesson.created) lesson.created = timetableCreationDate;

            this.writeToLocalDB('timetable', lesson);
        })

        let result = await this.makeAjaxQuery('settings', 'saveTimetableUpdates', lessons);

        if (result.status == 'failed') {
            //check, if the timetable was already stored in unsyncedTimetables, if so, remove it
            let unsyncedTimetables = await this.readAllFromLocalDB('unsyncedTimetables');
            let unsyncedTimetablesGrouped = [];
            let lessonsValidFrom = [];

            if (unsyncedTimetables.length > 0) {
                unsyncedTimetables.forEach(unsyncedLesson => {
                    if (!unsyncedTimetablesGrouped[unsyncedLesson.validFrom]) {
                        unsyncedTimetablesGrouped[unsyncedLesson.validFrom] = []
                    }

                    unsyncedTimetablesGrouped[unsyncedLesson.validFrom].push(unsyncedLesson);
                });

                lessons.forEach(lesson => {
                    if (!lessonsValidFrom.includes(lesson.validFrom)) lessonsValidFrom.push(lesson.validFrom);
                });

                lessonsValidFrom.forEach(entry => {
                    if (unsyncedTimetablesGrouped[entry]) {
                        unsyncedTimetablesGrouped[entry].forEach(lesson => this.deleteFromLocalDB('unsyncedTimetables', lesson.id));
                    }
                });
            }
            //and now save each lesson as unsynced
            lessons.forEach(entry => {
                this.updateOnLocalDB('unsyncedTimetables', entry);
            });
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
                this.updateOnLocalDB('unsyncedTimetables', entry.serialize());
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
        let userInfo = await this.getLocalUserInfo();

        document.cookie = `lprm=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;

        if (result.status == 'success') {
            if (userInfo.logoutPending) {
                delete userInfo.logoutPending;
                await this.updateOnLocalDB('settings', userInfo);
            }

            location.reload();
            return;
        }

        if (userInfo.logoutPending) {
            setTimeout(() => { (new Settings).logout() }, 30000);

            return;
        }

        alert(
            `Du scheinst gerade offline zu sein und kannst deshalb nicht vom Server ausgeloggt werden. Der Logout wird nachgeholt, sobald der Server wieder erreichbar ist.
            
            Solltest du Eduplanio Plus-Nutzer sein, werden nicht synchronisierte Änderungen erst synchronisiert, nachdem du dich auf diesem Gerät wieder eingeloggt hast.
            `);
        userInfo.logoutPending = true;

        await this.updateOnLocalDB('settings', userInfo);

        setTimeout(() => { (new Settings).logout() }, 30000);
    }

    async checkForPendingLogout() {
        let userInfo = await this.getLocalUserInfo();

        if (userInfo.logoutPending) {
            this.logout()

            return;
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