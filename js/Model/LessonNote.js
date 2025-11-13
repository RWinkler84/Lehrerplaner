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

    static createMockData() {
        const mockLessonNotes = [
            {
                id: 1,
                date: '2025-10-23',
                weekday: '4',
                timeslot: '1',
                class: '7c',
                subject: 'De',
                content: 'Einführung in lineare Gleichungen'
            },
            {
                id: 2,
                date: '2025-10-27',
                weekday: '1',
                timeslot: '1',
                class: '12a',
                subject: 'Fra',
                content: 'rumbaguetten bis einer richtig hart weint, sich ne flasche wein vor den kopf haut und abopfert. bonjour et au revoir!'
            },
            {
                id: 3,
                date: '2025-10-27',
                weekday: '1',
                timeslot: '2',
                class: '12a',
                subject: 'Info',
                content: 'Newtonsche Gesetze – Grundlagen'
            },
            {
                id: 4,
                date: '2025-10-28',
                timeslot: '1',
                weekday: '2',
                class: '7c',
                subject: 'Ge',
                content: 'Zellaufbau und Zellteilung'
            },
            {
                id: 5,
                date: '2025-10-15',
                timeslot: '10:00–10:45',
                class: '10A',
                subject: 'Geschichte',
                content: 'Industrialisierung in Europa'
            },
            {
                id: 6,
                date: '2025-10-16',
                timeslot: '08:00–08:45',
                class: '10B',
                subject: 'Chemie',
                content: 'Säuren und Basen – Einführung'
            },
            {
                id: 7,
                date: '2025-10-16',
                timeslot: '09:00–09:45',
                class: '10A',
                subject: 'Mathematik',
                content: 'Lösen von Gleichungssystemen'
            },
            {
                id: 8,
                date: '2025-10-17',
                timeslot: '08:00–08:45',
                class: '10A',
                subject: 'Informatik',
                content: 'Einführung in Arrays'
            },
            {
                id: 9,
                date: '2025-10-17',
                timeslot: '09:00–09:45',
                class: '10B',
                subject: 'Deutsch',
                content: 'Gedichtanalyse – Balladen'
            },
            {
                id: 10,
                date: '2025-10-17',
                timeslot: '10:00–10:45',
                class: '10A',
                subject: 'Sport',
                content: 'Konditionstraining in der Halle'
            }
        ];

        mockLessonNotes.map(async (noteData) => {
            let note = new LessonNote;

            note = this.writeDataToInstance(noteData, note);

            await note.update();
        })
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
    set created(value) { this.#created = value; }
    set lastEdited(value) { this.#lastEdited = value; }
}