import AbstractModel from "./AbstractModel.js";
import Fn from "../inc/utils.js";
import { ONEDAY } from "../index.js";
import LessonNoteController from "../Controller/LessonNoteController.js";

export default class LessonNote extends AbstractModel {
    #id;
    #date;
    #weekday;
    #timeslot;
    #class;
    #subject;
    #content;
    #fixedDate;
    #created;
    #lastEdited;

    constructor() {
        super();
    }

    static async getById(id) {
        let db = new AbstractModel;
        let noteData = await db.readFromLocalDB('lessonNotes', id);

        if (!noteData) {
            console.error('No lesson note found!');
            return;
        }

        let note = new LessonNote;

        note = this.writeDataToInstance(noteData, note);

        return note;
    }

    static async getAllLessonNotes() {
        let db = new AbstractModel;
        let notesDataArray = await db.readAllFromLocalDB('lessonNotes');
        let notesArray = [];

        if (notesDataArray.length == 0) {
            return notesArray;
        }

        notesDataArray.forEach(noteData => {
            let note = new LessonNote;

            note = this.writeDataToInstance(noteData, note);

            notesArray.push(note);
        })

        return notesArray;
    }

    static async getAllNotesInTimeRange(startDate, endDate = null) {
        let model = new AbstractModel;
        let db = await model.openIndexedDB();
        let store = db.transaction('lessonNotes', 'readonly').objectStore('lessonNotes');
        let index = store.index('date');

        if (!endDate) endDate = startDate;

        let range = IDBKeyRange.bound(model.formatDate(startDate), model.formatDate(endDate));

        return new Promise((resolve, reject) => {
            let results = [];
            let search = index.openCursor(range);

            search.onsuccess = (event) => {
                let cursor = event.target.result;

                if (cursor) {
                    let note = new LessonNote;
                    let noteData = cursor.value;

                    note = this.writeDataToInstance(noteData, note);

                    results.push(note);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            search.onerror = (event) => {
                console.error('Fetching failed', event.target.error);
                reject(event.target.error);
            }
        });
    }

    static async getLessonNoteForLesson(date, timeslot, className, subject) {
        const lessonNotes = await LessonNote.getAllNotesInTimeRange(date);
        let matchedNote;

        lessonNotes.forEach(note => {
            if (Fn.formatDate(note.date) != Fn.formatDate(date)) return;
            if (note.timeslot != timeslot) return;
            if (note.class != className) return;
            if (note.subject != subject) return;

            matchedNote = note;
        });

        return matchedNote;
    }

    async save() {
        let allLessonNotes = await LessonNote.getAllLessonNotes();

        this.id = Fn.generateId(allLessonNotes);
        this.lastEdited = this.formatDateTime(new Date());

        await this.writeToLocalDB('lessonNotes', this.serialize());
        let result = await this.makeAjaxQuery('lessonNote', 'save', this.serialize());

        if (result.status == 'failed') {
            await this.writeToLocalDB('unsyncedLessonNotes', this.serialize());
        }
    }

    async update() {
        this.lastEdited = this.formatDateTime(new Date());

        await this.updateOnLocalDB('lessonNotes', this.serialize());
        let result = await this.makeAjaxQuery('lessonNote', 'update', this.serialize());

        if (result.status == 'failed') {
            await this.updateOnLocalDB('unsyncedLessonNotes', this.serialize());
        }
    }

    async delete() {
        await this.deleteFromLocalDB('lessonNotes', this.id);
        await this.deleteFromLocalDB('unsyncedLessonNotes', this.id);
        let result = await this.makeAjaxQuery('lessonNote', 'delete', this.serialize());

        if (result.status == 'failed') {
            await this.writeToLocalDB('unsyncedDeletedLessonNotes', this.serialize());
        }
    }

    static async reorderLessonNotes(oldTimetable, oldTimetableChanges) {
        const allLessonNotes = await this.getAllLessonNotes();
        const allAffectedNotes = [];

        allLessonNotes.forEach(note => {
            if (new Date(note.date).setHours(12) < new Date().setHours(12)) return;
            if (note.fixedDate) return;
            
            allAffectedNotes.push(note);
        });

        if (allAffectedNotes.length > 0) {
            const currentTimetable = await LessonNoteController.getAllRegularLessons();
            const currentChanges = await LessonNoteController.getAllTimetableChanges();
            const endDate = new Date(allAffectedNotes[allAffectedNotes.length - 1].date).setHours(12) + ONEDAY * 30;

            const subjectsByClass = {};

            allAffectedNotes.forEach(note => {
                subjectsByClass[note.class] ? '' : subjectsByClass[note.class] = [];
                if (!subjectsByClass[note.class].includes(note.subject)) subjectsByClass[note.class].push(note.subject);
            });

            for (let key of Object.keys(subjectsByClass)) {
                let className = key;
                let subjectsArray = subjectsByClass[key];

                for (let subject of subjectsArray) {
                    let allOldLessonDates = await this.calculateAllLessonDates(className, subject, endDate, oldTimetable, oldTimetableChanges)
                    let allNewLessonDates = await this.calculateAllLessonDates(className, subject, endDate, currentTimetable, currentChanges);

                    //in the unlikely case, a lesson note exists without a corresponding lesson, jump to the next subject
                    if (allOldLessonDates.length == 0) continue;
                    if (allNewLessonDates.length == 0) continue;

                    //find the index of the note.date for this class/subject combination on the old dates and then pick the
                    //date with the corresponding index on the new dates and asign it as the new note.date
                    allAffectedNotes.forEach(note => {
                        if (note.class != className) return;
                        if (note.subject != subject) return;

                        let noteDate = new Date(note.date).setHours(12)
                        let match = false;
                        let indexInOldDates = 0;

                        //search for the note.date and get its index
                        while (!match) {
                            if (
                                noteDate == new Date(allOldLessonDates[indexInOldDates].date).setHours(12) &&
                                note.timeslot == allOldLessonDates[indexInOldDates].timeslot
                            ) {
                                match = true;
                            } else {
                                indexInOldDates++
                            }

                            if (!allOldLessonDates[indexInOldDates]) break;
                            if (indexInOldDates > 1000) break;
                        }

                        if (allNewLessonDates[indexInOldDates]) {
                            note.date = allNewLessonDates[indexInOldDates].date;
                            note.timeslot = allNewLessonDates[indexInOldDates].timeslot;
                            note.update();
                        }
                    });
                }
            }
        }
    }

    serialize() {
        return {
            id: this.id,
            date: this.formatDate(this.date),
            weekday: this.weekday,
            timeslot: this.timeslot,
            class: this.class,
            subject: this.subject,
            content: this.content,
            fixedDate: this.fixedDate,
            created: this.created,
            lastEdited: this.lastEdited
        }
    }

    static writeDataToInstance(noteData, instance = null) {
        let model = new AbstractModel;
        if (!instance) instance = new LessonNote;

        instance.id = instance.id ?? noteData.id;
        if (noteData.date) instance.date = noteData.date;
        if (noteData.weekday) instance.weekday = noteData.weekday;
        if (noteData.timeslot) instance.timeslot = noteData.timeslot;
        if (noteData.class) instance.class = noteData.class;
        if (noteData.subject) instance.subject = noteData.subject;
        if (noteData.content) instance.content = noteData.content;
        if (noteData.fixedDate) { instance.fixedDate = noteData.fixedDate } else { instance.fixedDate = false };
        if (noteData.created) { instance.created = noteData.created } else { instance.created = model.formatDateTime(new Date()) };
        if (noteData.lastEdited) { instance.lastEdited = noteData.lastEdited } else { instance.lastEdited = model.formatDateTime(new Date()) };

        return instance;
    }

    // Getter
    get id() { return this.#id; }
    get date() { return this.#date; }
    get weekday() { return this.#weekday; }
    get timeslot() { return this.#timeslot; }
    get class() { return this.#class; }
    get subject() { return this.#subject; }
    get content() { return this.#content; }
    get fixedDate() { return this.#fixedDate; }
    get created() { return this.#created; }
    get lastEdited() { return this.#lastEdited; }

    // Setter
    set id(value) { this.#id = value; }
    set date(value) { this.#date = value; }
    set weekday(value) { this.#weekday = value; }
    set timeslot(value) { this.#timeslot = value; }
    set class(value) { this.#class = value; }
    set subject(value) { this.#subject = value; }
    set content(value) { this.#content = value; }
    set fixedDate(value) { this.#fixedDate = value; }
    set created(value) { this.#created = value; }
    set lastEdited(value) { this.#lastEdited = value; }
}