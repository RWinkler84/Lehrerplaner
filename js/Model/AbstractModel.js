import { ONEDAY } from "../index.js";
import Fn from '../inc/utils.js';
import AbstractController from "../Controller/AbstractController.js";

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

            if (!response.ok) {
                AbstractController.setSyncIndicatorStatus('unsynced');
                return { status: 'failed', message: response.statusText };
            }
        }
        catch (error) {
            AbstractController.setSyncIndicatorStatus('unsynced');
            return {
                status: 'failed',
                error: 'no server response',
                message: 'Scheinbar gibt es gerade ein technisches Problem. Versuche es bitte später noch einmal.'
            };
        }

        let result;

        try {
            result = await response.json();
        }
        catch (error) {
            AbstractController.setSyncIndicatorStatus('unsynced');
            return { status: 'failed', message: error.message };
        }

        console.log(result);
        if (result.status == 'failed' && result.error == 'User not logged in') {
            await AbstractController.toggleTemperaryOfflineUsage(false);
            AbstractController.openLoginDialog();
            AbstractController.setSyncIndicatorStatus('unsynced');
        } else if (result.status == 'failed') {
            AbstractController.setSyncIndicatorStatus('unsynced');
        } else {
            AbstractController.setSyncIndicatorStatus('synced');
        }

        return result;
    }

    async readFromLocalDB(store, id) {
        id = Number(id);

        let db = await this.openIndexedDB();
        let transaction = db.transaction(store, 'readwrite');
        let objectStore = transaction.objectStore(store);
        let request = objectStore.get(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
            }

            request.onerror = () => {
                reject(request.error);
            }
        });
    }

    async readAllFromLocalDB(store) {
        let db = await this.openIndexedDB();
        let transaction = db.transaction(store, 'readwrite');
        let objectStore = transaction.objectStore(store);
        let request = objectStore.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
            }

            request.onerror = () => {
                reject(request.error);
            }
        });
    }

    async writeToLocalDB(store, dataToStore) {
        let db = await this.openIndexedDB();

        if (dataToStore.length > 1) {
            dataToStore.forEach((entry) => {
                entry.id = Number(entry.id);
                let transaction = db.transaction(store, 'readwrite').objectStore(store).add();
                transaction.onsuccess = () => {
                    console.log('stored', entry)
                    this.markLocalDBUpdated()
                }
            });

            return;
        }

        dataToStore.id = Number(dataToStore.id);
        let transaction = db.transaction(store, 'readwrite').objectStore(store).add(dataToStore,);

        transaction.onsuccess = () => {
            this.markLocalDBUpdated(store);
        }
        transaction.onerror = () => {
            console.error('storing failed', transaction.error)
        }
    }

    async updateOnLocalDB(store, dataToStore) {
        let promises;
        let db = await this.openIndexedDB();

        if (Array.isArray(dataToStore)) {
            promises = dataToStore.map((entry) => {
                entry.id = Number(entry.id);

                return new Promise(resolve => {
                    let transaction = db.transaction(store, 'readwrite').objectStore(store).put(entry);
                    transaction.onsuccess = () => {
                        console.log('stored', entry);
                        this.markLocalDBUpdated();
                        resolve();
                    }
                })
            });

            return Promise.all(promises)
        }

        dataToStore.id = Number(dataToStore.id);
        let transaction = db.transaction(store, 'readwrite').objectStore(store).put(dataToStore);

        return new Promise(resolve => {
            transaction.onsuccess = () => {
                console.log('updated', dataToStore)
                this.markLocalDBUpdated(store)
                resolve();
            }
        })
    }

    async deleteFromLocalDB(store, id) {
        id = Number(id);

        let db = await this.openIndexedDB();
        let transaction = db.transaction(store, 'readwrite').objectStore(store).delete(id);

        transaction.onsuccess = () => {
            console.log('deleted')
            this.markLocalDBUpdated(store)
        };
    }

    async clearObjectStore(store) {
        let db = await this.openIndexedDB();
        let transaction = db.transaction(store, 'readwrite').objectStore(store).clear();

        return new Promise((resolve, reject) => {
            transaction.onsuccess = () => { resolve({ status: 'success' }) };
            transaction.onerror = () => { reject({ status: 'failed' }) };
        });
    }

    async openIndexedDB() {
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.open('eduplanio', 2);

            request.onupgradeneeded = (event) => {
                let db = request.result;

                switch (event.oldVersion) {
                    case 0:
                        db.createObjectStore('timetable', { keyPath: 'id' });
                        db.createObjectStore('timetableChanges', { keyPath: 'id' });
                        db.createObjectStore('tasks', { keyPath: 'id' });
                        db.createObjectStore('subjects', { keyPath: 'id' });
                        db.createObjectStore('settings', { keyPath: 'id' });
                        db.createObjectStore('unsyncedTasks', { keyPath: 'id' });
                        db.createObjectStore('unsyncedSubjects', { keyPath: 'id' });
                        db.createObjectStore('unsyncedTimetableChanges', { keyPath: 'id' });
                        db.createObjectStore('unsyncedTimetables', { keyPath: 'id' });
                        db.createObjectStore('unsyncedDeletedSubjects', { keyPath: 'id' });
                        db.createObjectStore('unsyncedDeletedTasks', { keyPath: 'id' });
                        db.createObjectStore('unsyncedDeletedTimetableChanges', { keyPath: 'id' });
                        break;
                }
            }

            request.onversionchange = () => {
                db.close();
                alert('Eine neue Version von Eduplanio ist verfügbar. Bitte lade die Seite neu.');
            }

            request.onblocked = () => {
                alert('Eduplanio konnte ein notwendiges Update nicht durchführen. Schließe bitte alle anderen Browser-Tabs, in denen Eduplanio geöffnet ist, und lade anschließend die Seite neu.')
            }

            request.onerror = () => {
                reject('Database could not be opened' + request.error);
            }

            request.onsuccess = () => {
                resolve(request.result);
            }
        })
    }

    async markLocalDBUpdated(store, date = null) {
        if (date == null) date = new Date();
        let db = await this.openIndexedDB();

        let dataToStore = {
            id: 0,
            lastUpdated: {
            }
        }

        let timestamps = await this.readFromLocalDB('settings', 0);

        if (timestamps) {
            timestamps.lastUpdated.subjects ?
                dataToStore.lastUpdated.subjects = timestamps.lastUpdated.subjects :
                dataToStore.lastUpdated.subjects = timestamps.lastUpdated.subjects = 0;
            timestamps.lastUpdated.timetable ?
                dataToStore.lastUpdated.timetable = timestamps.lastUpdated.timetable :
                dataToStore.lastUpdated.timetable = timestamps.lastUpdated.timetable = 0;
            timestamps.lastUpdated.timetableChanges ?
                dataToStore.lastUpdated.timetableChanges = timestamps.lastUpdated.timetableChanges :
                dataToStore.lastUpdated.timetableChanges = timestamps.lastUpdated.timetableChanges = 0;
            timestamps.lastUpdated.tasks ?
                dataToStore.lastUpdated.tasks = timestamps.lastUpdated.tasks :
                dataToStore.lastUpdated.tasks = timestamps.lastUpdated.tasks = 0;
        }

        switch (store) {
            case 'subjects':
                dataToStore.lastUpdated.subjects = this.formatDateTime(date);
                break;
            case 'timetable':
                dataToStore.lastUpdated.timetable = this.formatDateTime(date);
                break;
            case 'timetableChanges':
                dataToStore.lastUpdated.timetableChanges = this.formatDateTime(date);
                break;
            case 'tasks':
                dataToStore.lastUpdated.tasks = this.formatDateTime(date);
                break;
        }
        console.log(dataToStore);

        db.transaction('settings', 'readwrite').objectStore('settings').put(dataToStore)
    }

    static async calculateAllLessonDates(className, subject, endDate, timetable, lessonChanges) {

        let dateIterator = new Date().setHours(12, 0, 0, 0);
        let validTimetableDates = await AbstractModel.getCurrentlyAndFutureValidTimetableDates();
        let teachingWeekdays = [];
        let allLessonDates = [];

        //check on which weekdays a lesson is held
        timetable.forEach(entry => {
            if (entry.class != className) return;
            if (entry.subject != subject) return;
            if (!validTimetableDates.includes(entry.validFrom)) return;

            teachingWeekdays.push({
                'weekday': entry.weekday,
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

        allLessonDates = Fn.sortByDateAndTimeslot(allLessonDates);

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
            //check whether all lesson dates must be removed or if one is still valid 
            //(last entry for a given date and timeslot is not canceled)
            let lessonDateToKeep = this.checkForLessonToKeep(lessonToRemove, allLessonDates);

            for (let i = allLessonDates.length - 1; i >= 0; i--) {
                if (new Date(allLessonDates[i].date).setHours(12, 0, 0, 0) == new Date(lessonToRemove.date).setHours(12, 0, 0, 0) &&
                    allLessonDates[i].timeslot == lessonToRemove.timeslot
                ) {
                    //spare the last entry, if it is set and equal to the current entry in allLessonDates
                    if (lessonDateToKeep != allLessonDates[i])
                        allLessonDates.splice(i, 1);
                }
            }
        });

        // //filters out lessons belonging to timetables that are not yet valid or not valid anymore
        for (let i = allLessonDates.length - 1; i >= 0; i--) {
            let lessonDate = new Date(allLessonDates[i].date).setHours(12, 0, 0, 0);
            let validFromDate = allLessonDates[i].validFrom ? new Date(allLessonDates[i].validFrom).setHours(12, 0, 0, 0) : undefined;
            let validUntilDate = allLessonDates[i].validUntil ? new Date(allLessonDates[i].validUntil).setHours(12, 0, 0, 0) : undefined;

            if (
                (!isNaN(validFromDate) && lessonDate < validFromDate) ||//is not valid yet
                (!isNaN(validUntilDate) && lessonDate > validUntilDate) || //not valid anymore
                (allLessonDates[i].type == 'normal' && allLessonDates[i].canceled == 'false' && allLessonDates[i].source == 'timetableChanges') //duplicate
            ) {
                allLessonDates.splice(i, 1);
            }
        }

    }

    //In some situations lessons can have multiple entries in allLessonDates, being canceled and reactiveted later on
    //Canceled lessons need to be removed, but with reactivated once, the latest entry needs to be kept as it holds the final 
    //cancelation state
    //if a date must be kept, the function returns the lesson, else it returns false
    static checkForLessonToKeep(lessonToRemove, allLessonDates) {
        let lessonEntries = [];

        allLessonDates.forEach(lesson => {
            if (new Date(lesson.date).setHours(12, 0, 0, 0) != new Date(lessonToRemove.date).setHours(12, 0, 0, 0)) return;
            if (lesson.timeslot != lessonToRemove.timeslot) return;

            lessonEntries.push(lesson);
        })

        if (lessonEntries.length != 0 && lessonEntries[lessonEntries.length - 1].canceled == 'false') return lessonEntries[lessonEntries.length - 1];

        return false;
    }

    formatDate(date) {
        let dateObject = new Date(date);
        let dateString = dateObject.getFullYear() + '-' + (dateObject.getMonth() + 1).toString().padStart(2, '0') + '-' + dateObject.getDate().toString().padStart(2, '0');

        return dateString;
    }

    formatDateTime(date) {
        let dateObject = new Date(date);
        let dateString = dateObject.getFullYear() + '-' + (dateObject.getMonth() + 1).toString().padStart(2, '0') + '-' + dateObject.getDate().toString().padStart(2, '0');
        let timeString = dateObject.getHours().toString().padStart(2, '0') + ':' + dateObject.getMinutes().toString().padStart(2, '0') + ':' + dateObject.getSeconds().toString().padStart(2, '0');
        console.log(timeString);
        return `${dateString} ${timeString}`;
    }

    static async getAllValidDates() {
        let standardTimetable = await AbstractController.getAllRegularLessons();
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
    static async getCurrentlyAndFutureValidTimetableDates() {
        let allValidDates = await AbstractModel.getAllValidDates();
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

    async syncData() {

        let localSettings = await this.readFromLocalDB('settings', 0);
        let localTimestamps = localSettings == undefined ? false : localSettings.lastUpdated;
        let remoteTimestamps = await this.makeAjaxQuery('abstract', 'getDbUpdateTimestamps');
        let dataToSync = {};
        let tablesToUpdate = {
            subjects: false,
            timetable: false,
            timetableChanges: false,
            tasks: false
        };

        if (remoteTimestamps.status == 'failed') return;

        if (!localTimestamps) {
            await this.updateLocalWithRemoteData({subjects: true, timetable: true, timetableChanges: true, tasks: true});
        }

        //send date with differing timestamps
        if (remoteTimestamps[0].subjects != localTimestamps.subjects) {
            dataToSync['subjects'] = await this.readAllFromLocalDB('unsyncedSubjects');
            dataToSync['deletedSubjects'] = await this.readAllFromLocalDB('unsyncedDeletedSubjects');
            tablesToUpdate.subjects = true;
        }

        if (remoteTimestamps[0].timetable != localTimestamps.timetable) {
            dataToSync['timetable'] = await this.readAllFromLocalDB('unsyncedTimetables');
            tablesToUpdate.timetable = true;
        }

        if (remoteTimestamps[0].timetableChanges != localTimestamps.timetableChanges) {
            dataToSync['timetableChanges'] = await this.readAllFromLocalDB('unsyncedTimetableChanges');
            dataToSync['deletedTimetableChanges'] = await this.readAllFromLocalDB('unsyncedDeletedTimetableChanges');
            tablesToUpdate.timetableChanges = true;
        }

        if (remoteTimestamps[0].tasks != localTimestamps.tasks) {
            dataToSync['tasks'] = await this.readAllFromLocalDB('unsyncedTasks');
            dataToSync['deletedTasks'] = await this.readAllFromLocalDB('unsyncedDeletedTasks');
            tablesToUpdate.tasks = true;
        }

        let result = await this.makeAjaxQuery('abstract', 'syncDatabase', dataToSync);

        //check the results and clear data that has been synced
        if (result.subjects.status && result.subjects.status == 'success') {
            this.clearObjectStore('unsyncedSubjects');
            this.clearObjectStore('unsyncedDeletedSubjects');
        }

        if (result.timetable.status && result.timetable.status == 'success') {
            this.clearObjectStore('unsyncedTimetables');
        }

        if (result.timetableChanges.status && result.timetableChanges.status == 'success') {
            this.clearObjectStore('unsyncedTimetableChanges');
            this.clearObjectStore('unsyncedDeletedTimetableChanges');
        }

        if (result.tasks.status && result.tasks.status == 'success') {
            this.clearObjectStore('unsyncedTasks');
            this.clearObjectStore('unsyncedDeletedTasks');
        }

        this.updateLocalWithRemoteData(tablesToUpdate);
    }

    async updateLocalWithRemoteData(tablesToUpdate) {
        let remoteTimestamps = await this.makeAjaxQuery('abstract', 'getDbUpdateTimestamps');
        
        if (tablesToUpdate.subjects) {
            let subjects = await this.makeAjaxQuery('abstract', 'getSubjects');
            await this.writeRemoteToLocalDB('subjects', subjects, remoteTimestamps[0].subjects);
        }

        if (tablesToUpdate.timetable) {
            let timetable = await this.makeAjaxQuery('abstract', 'getTimetable');
            await this.writeRemoteToLocalDB('timetable', timetable, remoteTimestamps[0].timetable);
        }

        if (tablesToUpdate.timetableChanges) {
            let timetableChanges = await this.makeAjaxQuery('abstract', 'getTimetableChanges');
            await this.writeRemoteToLocalDB('timetableChanges', timetableChanges, remoteTimestamps[0].timetableChanges);
        }

        if (tablesToUpdate.tasks) {
            let tasks = await this.makeAjaxQuery('abstract', 'getAllTasks');
            await this.writeRemoteToLocalDB('tasks', tasks, remoteTimestamps[0].tasks);
        }

        AbstractController.renderDataChanges();
    }

    async writeRemoteToLocalDB(objectStore, dataToStore, newLocalTimestamp) {
        let result = await this.clearObjectStore(objectStore);

        if (result.status == 'success' && !dataToStore.status) {
            await this.updateOnLocalDB(objectStore, dataToStore);
            this.markLocalDBUpdated(objectStore, newLocalTimestamp);
        }
    }
}