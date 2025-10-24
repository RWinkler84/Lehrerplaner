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

        note.id = noteData.id;
        note.date = noteData.date;
        note.weekday = noteData.weekday;
        note.timeslot = noteData.timeslot;
        note.class = noteData.class;
        note.subject = noteData.subject;
        note.content = noteData.content;

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

            note.id = noteData.id;
            note.date = noteData.date;
            note.weekday = noteData.weekday;
            note.timeslot = noteData.timeslot;
            note.class = noteData.class;
            note.subject = noteData.subject;
            note.content = noteData.content;

            notesArray.push(note);
        })

        return notesArray;
    }

    static async getAllNotesInTimeRange(startDate, endDate) {
        let model = new AbstractModel;
        let db = await model.openIndexedDB();


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
            
            note.id = noteData.id;
            note.date = noteData.date;
            note.weekday = noteData.weekday;
            note.timeslot = noteData.timeslot;
            note.class = noteData.class;
            note.subject = noteData.subject;
            note.content = noteData.content;

            await note.save();
        })
    }

    async save() {

        await this.writeToLocalDB('lessonNotes', this.serialize());
        let result = await this.makeAjaxQuery('lessonNotes', 'save', this.serialize());

        if (result.status == 'failed') {
            await this.writeRemoteToLocalDB('unsyncedLessonNotes', this.serialize());
        }
    }

    async update() {
        await this.updateOnLocalDB('lessonNotes', this.serialize());
        let result = await this.makeAjaxQuery('lessonNotes', 'update', this.serialize());

        if (result.status == 'failed') {
            await this.writeRemoteToLocalDB('unsyncedLessonNotes', this.serialize());
        }
    }

    async delete() {
        await this.deleteFromLocalDB('lessonNotes', this.id);
        let result = await this.makeAjaxQuery('lessonNotes', 'delete', this.serialize());

        if (result.status == 'failed') {
            await this.writeRemoteToLocalDB('unsyncedLessonNotes', this.serialize());
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