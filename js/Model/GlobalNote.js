import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js';

export default class GlobalNote extends AbstractModel {
    #id;
    #title;
    #content;
    #parentFolderId;
    #created;
    #lastEdited;

    static #clipboard = {};

    static mockupFiles = [
        {
            id: 1,
            title: 'Abgabe Hausaufgaben 8a',
            content: '<p><b>fehlende Abgaben</b></p><p>Ronny Reinemacher</p>',
            parentFolderId: 0,
            created: '',
            lastEdited: ''
        },
        {
            id: 2,
            title: 'Protokoll Dienstberatung',
            content: '<p><b>War alles ganz toll</b></p><p>Furchtbar...</p>',
            parentFolderId: 0,
            created: '',
            lastEdited: ''
        },
        {
            id: 3,
            title: 'Ich bin raus',
            content: '<p><b>War alles ganz toll</b></p><p>Furchtbar...</p>',
            parentFolderId: 1,
            created: '',
            lastEdited: ''
        },
        {
            id: 4,
            title: 'Ich bin in der 2',
            content: '<p><b>War alles ganz toll</b></p><p>Furchtbar...</p>',
            parentFolderId: 2,
            created: '',
            lastEdited: ''
        }
    ];

    static writeMockupData() {
        this.mockupFiles.forEach(noteData => {
            const note = this.writeDataToInstance(noteData);

            note.save();
        })
    }

    static async getAllNotes() {
        const globalNote = new GlobalNote;
        const dataArray = await globalNote.readAllFromLocalDB('globalNotes')

        return dataArray.map(noteData => this.writeDataToInstance(noteData));
    }

    static async getById(id) {
        const globalNote = new GlobalNote;
        const noteData = await globalNote.readFromLocalDB('globalNotes', id);

        return this.writeDataToInstance(noteData);
    }

    static async getAllByParentFolderId(parentFolderId) {
        const note = new GlobalNote;
        const allNotesOfFolder = await note.readAllByIndexFromLocalDB('globalNotes', 'parentFolderId', parentFolderId);

        return allNotesOfFolder.map(entry => this.writeDataToInstance(entry));
    }

    ///////////////////////
    // clipboard methods //
    ///////////////////////

    /**@param operationType 'cut', 'copy'  */
    static addToClipboard(noteIdArray, operationType) {
        if (operationType != 'cut' && operationType != 'copy') console.error('Unknown operation type!')

        noteIdArray.forEach(noteId => this.#clipboard[noteId] = { noteId: noteId, operationType: operationType });
    }

    static getClipboardContent() {
        return this.#clipboard;
    }

    static clearClipboard() {
        this.#clipboard = [];
    }

    static async pasteClipboardContent(targetFolderId) {
        let allGlobalNotes;
        const notesToUpdate = [];
        const model = new GlobalNote;

        for (const id of Object.keys(this.#clipboard)) {
            const globalNote = await this.getById(id);

            if (this.#clipboard[id].operationType == 'copy') {
                allGlobalNotes = await GlobalNote.getAllNotes();

                globalNote.id = Fn.generateId(allGlobalNotes);
                globalNote.title = `${globalNote.title}(Kopie)`;
            }

            globalNote.parentFolderId = Number(targetFolderId);
            notesToUpdate.push(globalNote);
        }

        await model.batchUpdate(notesToUpdate);
    }

    static isCut(id) {
        const clipboard = this.#clipboard;

        if (clipboard[id] && clipboard[id].operationType == 'cut') return true;

        return false;
    }

    //////////////////////
    // instance methods //
    //////////////////////

    async save() {
        let allGlobalNotes = await GlobalNote.getAllNotes();

        this.id = Fn.generateId(allGlobalNotes);
        this.lastEdited = this.formatDateTime(new Date());
        this.created = this.lastEdited;

        await this.writeToLocalDB('globalNotes', this.serialize());
        let result = await this.makeAjaxQuery('globalNote', 'save', [this.serialize()]);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedGlobalNotes', this.serialize());
    }

    async delete() {
        this.deleteFromLocalDB('globalNotes', this.id);
        this.deleteFromLocalDB('unsyncedGlobalNotes', this.id);

        let result = await this.makeAjaxQuery('globalNote', 'delete', [this.serialize()]);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedGlobalNotes', this.serialize());
    }

    async update() {
        this.lastEdited = this.formatDateTime(new Date());

        this.updateOnLocalDB('globalNotes', this.serialize());
        let result = await this.makeAjaxQuery('globalNote', 'update', [this.serialize()]);

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedGlobalNotes', this.serialize());
    }

    async batchSave(globalNotesToSave, keepIds = false) {
        const serializedNotes = [];
        const allGlobalNotes = await GlobalNote.getAllNotes()

        for (const note of globalNotesToSave) {
            if (!keepIds) {
                note.id = Fn.generateId(allGlobalNotes)
                allGlobalNotes.push(note);
            }

            note.lastEdited = this.formatDateTime(new Date());

            let serializedNote = note.serialize();
            serializedNotes.push(serializedNote);

            await this.writeToLocalDB('globalNotes', serializedNote);
        }

        let result = await this.makeAjaxQuery('globalNote', 'save', serializedNotes);

        if (result.status == 'failed') {
            for (const note of serializedNotes) {
                this.writeToLocalDB('unsyncedGlobalNotes', note);
            }
        }
    }

    async batchUpdate(globalNotesToUpdate) {
        const serializedNotes = [];

        for (const note of globalNotesToUpdate) {
            note.lastEdited = this.formatDateTime(new Date());

            let serializedNote = note.serialize();
            serializedNotes.push(serializedNote);

            await this.updateOnLocalDB('globalNotes', serializedNote);
        }

        let result = await this.makeAjaxQuery('globalNote', 'update', serializedNotes);

        if (result.status == 'failed') {
            this.writeToLocalDB('unsyncedGlobalNotes', serializedNotes);
        }
    }

    async batchDelete(globalNotesToDelete) {
        const serializedNotes = [];

        for (const note of globalNotesToDelete) {
            serializedNotes.push(note.serialize());

            await this.deleteFromLocalDB('globalNotes', note.id);
            await this.deleteFromLocalDB('unsyncedGlobalNotes', note.id);
        }

        let result = await this.makeAjaxQuery('globalNote', 'delete', serializedNotes);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedGlobalNotes', serializedNotes);
    }

    serialize() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            parentFolderId: this.parentFolderId,
            created: this.created,
            lastEdited: this.lastEdited
        }
    }

    static writeDataToInstance(noteData, instance = null) {
        let model = new AbstractModel;
        if (!instance) instance = new GlobalNote;

        instance.id = instance.id ?? noteData.id;
        if (noteData.title) instance.title = noteData.title;
        if (noteData.content) instance.content = noteData.content;
        if (noteData.parentFolderId != undefined) { instance.parentFolderId = noteData.parentFolderId };
        if (noteData.created) { instance.created = noteData.created } else { instance.created = model.formatDateTime(new Date()) };
        if (noteData.lastEdited) { instance.lastEdited = noteData.lastEdited } else { instance.lastEdited = model.formatDateTime(new Date()) };

        return instance;
    }

    // Getter
    get id() { return this.#id; }
    get title() { return this.#title; }
    get content() { return this.#content; }
    get parentFolderId() { return this.#parentFolderId; }
    get created() { return this.#created; }
    get lastEdited() { return this.#lastEdited; }

    // Setter
    set id(value) { this.#id = value; }
    set title(value) { this.#title = value; }
    set content(value) { this.#content = value; }
    set parentFolderId(value) { this.#parentFolderId = value; }
    set created(value) { this.#created = value; }
    set lastEdited(value) { this.#lastEdited = value; }

}