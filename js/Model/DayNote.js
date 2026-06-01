import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js'

export default class DayNote extends AbstractModel {
    #id;
    #date;
    #content;
    #created;
    #lastEdited;

    static getAllDayNotes() {
        const model = new AbstractModel;

        let allDayNotes = [
            {id: 1, date: '2026-06-01', content: '<p>test</p>', created: 'Mon Jun 01 2026 11:56:19 GMT+0200 (Mitteleuropäische Sommerzeit)', lastEdited: 'Mon Jun 01 2026 11:59:19 GMT+0200 (Mitteleuropäische Sommerzeit)'},
            {id: 2, date: '2026-06-04', content: '<p>test 2</p>', created: 'Mon Jun 01 2026 11:58:19 GMT+0200 (Mitteleuropäische Sommerzeit)', lastEdited: 'Mon Jun 01 2026 11:59:29 GMT+0200 (Mitteleuropäische Sommerzeit)'},
            {id: 3, date: '2026-06-02', content: '<p>test 3</p>', created: 'Mon Jun 01 2026 11:57:19 GMT+0200 (Mitteleuropäische Sommerzeit)', lastEdited: 'Mon Jun 01 2026 11:57:29 GMT+0200 (Mitteleuropäische Sommerzeit)'},
            {id: 4, date: '2026-06-09', content: '<p>test 4</p>', created: 'Mon Jun 01 2026 11:57:19 GMT+0200 (Mitteleuropäische Sommerzeit)', lastEdited: 'Mon Jun 01 2026 11:57:29 GMT+0200 (Mitteleuropäische Sommerzeit)'}
        ];

        // const allDayNotes = model.readAllFromLocalDB('dayNotes');

        if (allDayNotes.length == 0) return [];

        const notesArray = allDayNotes.map(note => this.writeDataToInstance(note));

        notesArray.sort((a, b) => Fn.sortByDate(a, b));

        return notesArray;
    }

    static getAllDayNotesInTimeSpan(startDate, endDate) {
        const allDayNotes = this.getAllDayNotes();

        if (!startDate instanceof Date) startDate = new Date(startDate);
        if (!endDate instanceof Date) endDate = new Date(endDate);

        const startTimestamp = startDate.setHours(12,0,0,0);
        const endTimestamp = endDate.setHours(12,0,0,0);

        return allDayNotes.filter(note => note.date.setHours(12,0,0,0) >= startTimestamp && note.date.setHours(12,0,0,0) <= endTimestamp );
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