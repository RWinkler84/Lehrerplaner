import { ONEDAY, unsyncedDeletedSubjects, unsyncedDeletedTasks, unsyncedDeletedTimetableChanges } from "../index.js";
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
        }
        catch (error) {
            return { 'status': 'failed' };
        }

        let result = await response.json();

        if (result.status == 'failed' && result.message == 'User not logged in!') AbstractController.openLoginDialog();

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
            this.markLocalDBUpdated()
        }
        transaction.onerror = () => {
            console.error('storing failed', transaction.error)
        }
    }

    async updateOnLocalDB(store, dataToStore) {
        let db = await this.openIndexedDB();

        if (dataToStore.length > 1) {
            dataToStore.forEach((entry) => {
                entry.id = Number(entry.id);
                let transaction = db.transaction(store, 'readwrite').objectStore(store).put(entry);
                transaction.onsuccess = () => {
                    console.log('stored', entry)
                    this.markLocalDBUpdated()
                }
            });

            return;
        }

        dataToStore.id = Number(dataToStore.id);
        let transaction = db.transaction(store, 'readwrite').objectStore(store).put(dataToStore);

        transaction.onsuccess = () => {
            console.log('updated', dataToStore)
            this.markLocalDBUpdated()
        }
    }

    async deleteFromLocalDB(store, id) {
        id = Number(id);

        let db = await this.openIndexedDB();
        let transaction = db.transaction(store, 'readwrite').objectStore(store).delete(id);

        transaction.onsuccess = () => {
            console.log('deleted')
            this.markLocalDBUpdated()
        };
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
                        db.createObjectStore('unsyncedDeletedTimetableLessons', { keyPath: 'id' });
                        break;
                }
            }

            request.onerror = () => {
                reject('Database could not be opened' + request.error);
            }

            request.onsuccess = () => {
                resolve(request.result);
            }
        })
    }

    async syncDataOnStart() {

        let localSettings = await this.readAllFromLocalDB('settings');
        let subjects = await this.makeAjaxQuery('abstract', 'getSubjects');
        let timetable = await this.makeAjaxQuery('abstract', 'getTimetable')
        let timetableChanges = await this.makeAjaxQuery('abstract', 'getTimetableChanges');
        let tasks = await this.makeAjaxQuery('abstract', 'getAllTasks');
        let lastLocalUpdateTimestamp;

        if (
            subjects.status == 'failed' ||
            timetable.status == 'failed' ||
            timetableChanges.status == 'failed' ||
            tasks.status == 'failed'
        ) {
            return;
        }

        localSettings.forEach(entry => {
            if (!entry.lastUpdated) return;
            lastLocalUpdateTimestamp = entry.lastUpdated;
        })

        if (!lastLocalUpdateTimestamp) {
            await this.writeRemoteToLocalDB(subjects, timetable, timetableChanges, tasks);
            return;
        }

        if (lastLocalUpdateTimestamp) {
            let localOutdated = false;

            subjects.forEach(entry => {
                if (new Date(entry.lastEdited).getTime() > new Date(lastLocalUpdateTimestamp).getTime()) localOutdated = true;
            })

            timetable.forEach(entry => {
                if (new Date(entry.lastEdited).getTime() > new Date(lastLocalUpdateTimestamp).getTime()) localOutdated = true;
            })

            timetableChanges.forEach(entry => {
                if (new Date(entry.lastEdited).getTime() > new Date(lastLocalUpdateTimestamp).getTime()) localOutdated = true;
            })

            tasks.forEach(entry => {
                if (new Date(entry.lastEdited).getTime() > new Date(lastLocalUpdateTimestamp).getTime()) localOutdated = true;
            })

            if (localOutdated) {
                await this.writeRemoteToLocalDB(subjects, timetable, timetableChanges, tasks);
            }
        }
    }

    async writeRemoteToLocalDB(subjects, timetable, timetableChanges, tasks) {
        await this.updateOnLocalDB('subjects', subjects);
        await this.updateOnLocalDB('timetable', timetable);
        await this.updateOnLocalDB('timetableChanges', timetableChanges);
        await this.updateOnLocalDB('tasks', tasks);

        await this.markLocalDBUpdated();
    }

    async markLocalDBUpdated() {
        let db = await this.openIndexedDB();
        db.transaction('settings', 'readwrite').objectStore('settings').put({ id: 0, lastUpdated: this.formatDateTime(new Date()) })
    }

    static async calculateAllLessonDates(className, subject, endDate, timetable, lessonChanges) {
        console.log(lessonChanges);

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
        let timeString = dateObject.getHours() + ':' + dateObject.getMinutes().toString().padStart(2, '0') + ':' + dateObject.getSeconds().toString().padStart(2, '0');

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

    async checkDataState() {
        let allSubjects = await this.readAllFromLocalDB('subjects');
        let isUnsyncedData = false;

        let dataToSync = {
            'subjects': [],
            'timetable': [],
            'timetableChanges': [],
            'tasks': []
        };

        let result;

        allSubjects.forEach(entry => {
            if (entry.synced == false) {
                dataToSync['subjects'].push(entry);
                isUnsyncedData = true;
            }
        });

        standardTimetable.forEach(entry => {
            if (entry.synced == false) {
                dataToSync['timetable'].push(entry);
                isUnsyncedData = true;
            }
        });

        timetableChanges.forEach(entry => {
            if (entry.synced == false) {
                dataToSync['timetableChanges'].push(entry);
                isUnsyncedData = true;
            }
        });

        allTasksArray.forEach(entry => {
            if (entry.synced == false) {
                dataToSync['tasks'].push(entry);
                isUnsyncedData = true;
            }
        });

        if (!isUnsyncedData && unsyncedDeletedSubjects.length == 0 && unsyncedDeletedTasks.length == 0 && unsyncedDeletedTimetableChanges.length == 0) return;

        // first delete, what needs to be deleted 
        if (unsyncedDeletedSubjects.length > 0) {
            result = await this.makeAjaxQuery('settings', 'deleteSubjects', unsyncedDeletedSubjects);

            // if the server can not be contacted, the result will just be an object, else it will be an array of objects
            if (result.status !== 'failed') {
                result.forEach(entry => {
                    if (entry.status == 'success') {
                        for (let i = unsyncedDeletedSubjects.length - 1; i >= 0; i--) {
                            if (entry.id == unsyncedDeletedSubjects[i].id) unsyncedDeletedSubjects.splice(unsyncedDeletedSubjects[i], 1);
                        }
                    }
                });
            }
        }

        if (unsyncedDeletedTasks.length > 0) {
            result = await this.makeAjaxQuery('task', 'delete', unsyncedDeletedTasks);

            // if the server can not be contacted, the result will just be an object, else it will be an array of objects
            if (result.status !== 'failed') {
                result.forEach(entry => {
                    if (entry.status == 'success') {
                        for (let i = unsyncedDeletedTasks.length - 1; i >= 0; i--) {
                            if (entry.id == unsyncedDeletedTasks[i].id) unsyncedDeletedTasks.splice(unsyncedDeletedTasks[i], 1);
                        }
                    }
                });
            }
        }

        if (unsyncedDeletedTimetableChanges.length > 0) {
            result = await this.makeAjaxQuery('lesson', 'delete', unsyncedDeletedTimetableChanges);

            // if the server can not be contacted, the result will just be an object, else it will be an array of objects
            if (result.status !== 'failed') {
                result.forEach(entry => {
                    if (entry.status == 'success') {
                        for (let i = unsyncedDeletedTimetableChanges.length - 1; i >= 0; i--) {
                            if (entry.id == unsyncedDeletedTimetableChanges[i].id) unsyncedDeletedTimetableChanges.splice(unsyncedDeletedTimetableChanges[i], 1);
                        }
                    }
                });
            }
        }

        //if the deletion worked, go on to sync the rest
        if (
            unsyncedDeletedSubjects.length == 0 &&
            unsyncedDeletedTasks.length == 0 &&
            unsyncedDeletedTimetableChanges.length == 0
        ) {
            result = await this.makeAjaxQuery('abstract', 'syncDatabase', dataToSync);

            if (result.status && result.status == 'failed') { //will be the case, if the server is not responding
                result = {
                    'subjects': { 'status': 'failed' },
                    'timetable': { 'status': 'failed' },
                    'timetableChanges': [{ 'status': 'failed' }],
                    'tasks': [{ 'status': 'failed' }],
                }
            }

            // then set previously unsynced items to synced on the global data
            //subjects
            if (result.subjects.status == 'success') {
                allSubjects.forEach(entry => {
                    if (!entry.synced) entry.synced = true;
                })
            }

            //timetable
            if (result.timetable.status == 'success') {
                standardTimetable.forEach(entry => {
                    if (!entry.synced) entry.synced = true;
                })
            }

            //lessonChanges
            result.timetableChanges.forEach(entry => {
                if (entry.status == 'success') {
                    timetableChanges.forEach(lesson => {
                        if (lesson.id == entry.id) lesson.synced = true;
                    });
                }
            });

            //tasks
            result.tasks.forEach(entry => {
                if (entry.status == 'success') {
                    allTasksArray.forEach(task => {
                        if (task.id == entry.id) task.synced = true;
                    });
                }
            });
        }
    }
}