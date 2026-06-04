import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js'

export default class DayNote extends AbstractModel {
    #id;
    #date;
    #content;
    #created;
    #lastEdited;

    constructor() {
        super()
    }

    static async getAllDayNotes() {
        const model = new AbstractModel;
        const allDayNotes = await model.readAllFromLocalDB('dayNotes');

        if (allDayNotes.length == 0) return [];

        const notesArray = allDayNotes.map(note => this.writeDataToInstance(note));

        notesArray.sort((a, b) => Fn.sortByDate(a, b));

        return notesArray;
    }

    static async getAllDayNotesInTimeSpan(startDate, endDate) {
        let model = new AbstractModel;
        let db = await model.openIndexedDB();
        let store = db.transaction('dayNotes', 'readonly').objectStore('dayNotes');
        let index = store.index('date');

        if (!endDate) endDate = startDate;

        let range = IDBKeyRange.bound(model.formatDate(startDate), model.formatDate(endDate));

        return new Promise((resolve, reject) => {
            let results = [];
            let search = index.openCursor(range);

            search.onsuccess = (event) => {
                let cursor = event.target.result;

                if (cursor) {
                    let note = new DayNote;
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

    static async getById(id) {
        const model = new AbstractModel;
        
        return this.writeDataToInstance(await model.readFromLocalDB('dayNotes', id));
    }

    async save() {
        let allDayNotes = await DayNote.getAllDayNotes();

        this.id = Fn.generateId(allDayNotes);
        this.lastEdited = this.formatDateTime(new Date());

        await this.writeToLocalDB('dayNotes', this.serialize());
        let result = await this.makeAjaxQuery('dayNote', 'save', this.serialize());

        if (result.status == 'failed') {
            await this.writeToLocalDB('unsyncedDayNotes', this.serialize());
        }
    }

    async update() {
        this.lastEdited = this.formatDateTime(new Date());

        await this.updateOnLocalDB('dayNotes', this.serialize());
        let result = await this.makeAjaxQuery('dayNote', 'update', this.serialize());

        if (result.status == 'failed') {
            await this.updateOnLocalDB('unsyncedDayNotes', this.serialize());
        }
    }

    async delete() {
        this.lastEdited = this.formatDateTime(new Date());

        await this.deleteFromLocalDB('dayNotes', this.id);
        await this.deleteFromLocalDB('unsyncedDayNotes', this.id);
        let result = await this.makeAjaxQuery('dayNote', 'delete', this.serialize());

        if (result.status == 'failed') {
            await this.writeToLocalDB('unsyncedDeletedDayNotes', this.serialize());
        }
    }

    serialize() {
        return {
            id: this.id,
            date: this.formatDate(this.date),
            content: this.content,
            created: this.created,
            lastEdited: this.lastEdited
        }
    }

    static writeDataToInstance(noteData, instance = null) {
        let model = new AbstractModel;
        if (!instance) instance = new DayNote;

        instance.id = instance.id ?? noteData.id;
        if (noteData.date) instance.date = noteData.date;
        if (noteData.content) instance.content = noteData.content;
        if (noteData.created) { instance.created = noteData.created } else { instance.created = model.formatDateTime(new Date()) };
        if (noteData.lastEdited) { instance.lastEdited = noteData.lastEdited } else { instance.lastEdited = model.formatDateTime(new Date()) };

        return instance;
    }

    get id() { return this.#id }
    set id(id) { this.#id = id };

    get date() { return new Date(this.#date) }
    set date(date) { this.#date = date };

    get content() { return this.#content; };
    set content(content) { this.#content = content; }

    get created() { return this.#created; };
    set created(created) { this.#created = created; }

    get lastEdited() { return this.#lastEdited; }
    set lastEdited(lastEdited) { this.#lastEdited = lastEdited; }
}