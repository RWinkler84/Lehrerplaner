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
        let noteData = await this.readFromLocalDB('lessonNotes', id);

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
        let notesDataArray = await this.readAllFromLocalDB('lessonNotes');
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