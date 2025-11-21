import AbstractModel from "./AbstractModel.js";
import Fn from "../inc/utils.js";
import { lessonNoteChangesArray } from "../index.js";

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
        console.log(this.serialize());


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
        console.log(result);
        if (result.status == 'failed') {
            await this.writeToLocalDB('unsyncedDeletedLessonNotes', this.serialize());
        }
    }

    static trackLessonNoteChanges(currentContent) {
        let noteVersion = lessonNoteChangesArray.length;
        lessonNoteChangesArray.push({ version: noteVersion, content: currentContent });

        return noteVersion;
    }

    static clearLessonNoteChanges() {
        do {
            lessonNoteChangesArray.pop();
        } while (lessonNoteChangesArray.length != 0); 
    }

    static getPreviousChange(displayedVersion) {
        if (displayedVersion == 0) return;
        return lessonNoteChangesArray[displayedVersion - 1];
    }

    static getNextChange(displayedVersion) {
        if (displayedVersion == lessonNoteChangesArray.length) return;
        return lessonNoteChangesArray[displayedVersion + 1];
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
        if (noteData.fixedDate) {instance.fixedDate = noteData.fixedDate } else {instance.fixedDate = false};
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