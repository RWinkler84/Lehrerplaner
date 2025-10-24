import AbstractModel from "./AbstractModel.js";

export default class LessonNote extends AbstractModel {
    #id
    #date
    #weekday
    #timeslot
    #class
    #subject
    #content

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

        note = this.writeDataToInstance(note, noteData);

        return note;
    }

    static async getAllLessonNotes() {
        let db = new AbstractModel;
        let notesDataArray = await db.readAllFromLocalDB('lessonNotes');
        let notesArray = [];

        if (notesDataArray.length == 0) {
            console.log('No lesson notes found!');
            return;
        }

        notesDataArray.forEach(noteData => {
            let note = new LessonNote;

            note = this.writeDataToInstance(note, noteData);

            notesArray.push(note);
        })

        return notesArray;
    }

    static async getAllNotesInTimeRange(startDate, endDate) {
        let model = new AbstractModel;
        let db = await model.openIndexedDB();
        let store = db.transaction('lessonNotes', 'readonly').objectStore('lessonNotes');
        let index = store.index('date');
        let range = IDBKeyRange.bound(model.formatDate(startDate), model.formatDate(endDate));

        return new Promise((resolve, reject) => {
            let results = [];
            let search = index.openCursor(range);

            search.onsuccess = (event) => {
                let cursor = event.target.result;

                if (cursor) {
                    let note = new LessonNote;
                    let noteData = cursor.value;

                    note = this.writeDataToInstance(note, noteData);

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

    static async updateLessonNote(noteData) {
        let note = this.getById(noteData.id);

        note = this.writeDataToInstance(note, noteData);

        note.update();
    }

    static createMockData() {
        const mockLessonNotes = [
            {
                id: 1,
                date: '2025-10-13',
                timeslot: '08:00–08:45',
                class: '10A',
                subject: 'Mathematik',
                content: 'Einführung in lineare Gleichungen'
            },
            {
                id: 2,
                date: '2025-10-13',
                timeslot: '09:00–09:45',
                class: '10A',
                subject: 'Englisch',
                content: 'Simple Past vs. Present Perfect'
            },
            {
                id: 3,
                date: '2025-10-14',
                timeslot: '08:00–08:45',
                class: '10B',
                subject: 'Physik',
                content: 'Newtonsche Gesetze – Grundlagen'
            },
            {
                id: 4,
                date: '2025-10-14',
                timeslot: '09:00–09:45',
                class: '10A',
                subject: 'Biologie',
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

            note = this.writeDataToInstance(note, noteData);

            await note.update();
        })
    }

    async save() {

        await this.writeToLocalDB('lessonNotes', this.serialize());
        let result = await this.makeAjaxQuery('lessonNotes', 'save', this.serialize());

        if (result.status == 'failed') {
            await this.writeToLocalDB('unsyncedLessonNotes', this.serialize());
        }
    }

    async update() {
        await this.updateOnLocalDB('lessonNotes', this.serialize());
        let result = await this.makeAjaxQuery('lessonNotes', 'update', this.serialize());

        console.log(result)

        if (result.status == 'failed') {
            await this.writeToLocalDB('unsyncedLessonNotes', this.serialize());
        }
    }

    async delete() {
        await this.deleteFromLocalDB('lessonNotes', this.id);
        let result = await this.makeAjaxQuery('lessonNotes', 'delete', this.serialize());

        if (result.status == 'failed') {
            await this.writeToLocalDB('unsyncedLessonNotes', this.serialize());
        }
    }

    serialize() {
        return {
            id: this.id,
            date: this.date,
            timeslot: this.timeslot,
            class: this.class,
            subject: this.subject,
            content: this.content
        }
    }

    static writeDataToInstance(instance, noteData) {
        instance.id ?? noteData.id;
        if (noteData.date) instance.date = noteData.date;
        if (noteData.weekday) instance.weekday = noteData.weekday;
        if (noteData.timeslot) instance.timeslot = noteData.timeslot;
        if (noteData.class) instance.class = noteData.class;
        if (noteData.subject) instance.subject = noteData.subject;
        if (noteData.content) instance.content = noteData.content;

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

    // Setter
    set id(value) { this.#id = value; }
    set date(value) { this.#date = value; }
    set weekday(value) { this.#weekday = value; }
    set timeslot(value) { this.#timeslot = value; }
    set class(value) { this.#class = value; }
    set subject(value) { this.#subject = value; }
    set content(value) { this.#content = value; }

}