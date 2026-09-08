import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js';
import GlobalNotesController from "../Controller/GlobalNotesController.js";
import { SF_ID_ROOT, SF_ID_TRASH } from "../index.js";

export default class GlobalNote extends AbstractModel {
    #id;
    #title;
    #content;
    #parentFolderId;
    #parentIdBeforeDelete = null;
    #created;
    #lastEdited;

    static #clipboard = {};

    static async getAllNotes() {
        const globalNote = new GlobalNote;
        let dataArray = await globalNote.readAllFromLocalDB('globalNotes')

        dataArray = Fn.sortByProperty(dataArray, 'title');

        return dataArray.map(noteData => this.writeDataToInstance(noteData));
    }

    static async getById(id) {
        const globalNote = new GlobalNote;
        const noteData = await globalNote.readFromLocalDB('globalNotes', id);

        return this.writeDataToInstance(noteData);
    }

    static async getAllByParentFolderId(parentFolderId) {
        const note = new GlobalNote;
        let allNotesOfFolder = await note.readAllByIndexFromLocalDB('globalNotes', 'parentFolderId', parentFolderId);

        allNotesOfFolder = Fn.sortByProperty(allNotesOfFolder, 'title');

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
        if (Fn.isEmptyObject(this.#clipboard)) return;

        let allGlobalNotes = null;
        const notesToSaveRemotly = [];
        const notesToUpdate = [];
        const model = new GlobalNote;

        for (const id of Object.keys(this.#clipboard)) {
            const globalNote = await this.getById(id);

            if (this.#clipboard[id].operationType == 'copy') {
                if (!allGlobalNotes) allGlobalNotes = await GlobalNote.getAllNotes();

                globalNote.id = Fn.generateId(allGlobalNotes);
                globalNote.title = `${globalNote.title}(Kopie)`;
                globalNote.parentFolderId = Number(targetFolderId);

                allGlobalNotes.push(globalNote);
                notesToSaveRemotly.push(globalNote);

                continue;
            }

            globalNote.parentFolderId = Number(targetFolderId);
            notesToUpdate.push(globalNote);
        }

        await model.batchUpdate(notesToUpdate);
        if (notesToSaveRemotly.length != 0) await model.batchSave(notesToSaveRemotly, true);
    }

    static isCut(id) {
        const clipboard = this.#clipboard;

        if (clipboard[id] && clipboard[id].operationType == 'cut') return true;

        return false;
    }

    static async batchRestoreTrashedNotes(notesArray) {
        const model = new GlobalNote;
        const notesToUpdate = [];
        const failedRestores = [];

        for (const note of notesArray) {
            const parentExists = await GlobalNotesController.folderExists(note.parentIdBeforeDelete);

            if (!parentExists && note.parentIdBeforeDelete != SF_ID_ROOT) {
                failedRestores.push(note);

                continue;
            }

            note.parentFolderId = note.parentIdBeforeDelete;
            note.parentIdBeforeDelete = null;

            notesToUpdate.push(note);
        }

        await model.batchUpdate(notesToUpdate);

        return failedRestores;
    }

    static async deleteAllTrashedNotes(allTrashedNotes) {
        await (new GlobalNote).batchDelete(allTrashedNotes);
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

    async moveToTrash() {
        this.parentIdBeforeDelete = this.parentFolderId;
        this.parentFolderId = 1;

        await this.update();
    }

    async delete() {
        this.lastEdited = this.formatDateTime(new Date());

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
        const allGlobalNotes = await GlobalNote.getAllNotes();
        const now = this.formatDateTime(new Date());

        for (const note of globalNotesToSave) {
            if (!keepIds) {
                note.id = Fn.generateId(allGlobalNotes)
                allGlobalNotes.push(note);
            }

            note.lastEdited = now;

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
        const now = this.formatDateTime(new Date());

        for (const note of globalNotesToUpdate) {
            note.lastEdited = now;

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
        if (globalNotesToDelete.length == 0) return;

        const now = this.formatDateTime(new Date());
        const serializedNotes = [];

        for (const note of globalNotesToDelete) {
            note.lastEdited = now;

            serializedNotes.push(note.serialize());

            await this.deleteFromLocalDB('globalNotes', note.id);
            await this.deleteFromLocalDB('unsyncedGlobalNotes', note.id);
        }

        let result = await this.makeAjaxQuery('globalNote', 'delete', serializedNotes);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedGlobalNotes', serializedNotes);
    }

    async batchMoveToTrash(notesToMoveToTrash) {
        notesToMoveToTrash.forEach(note => {
            note.parentIdBeforeDelete = note.parentFolderId;
            note.parentFolderId = SF_ID_TRASH;
        })

        await this.batchUpdate(notesToMoveToTrash);
    }

    serialize() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            parentFolderId: this.parentFolderId,
            parentIdBeforeDelete: this.parentIdBeforeDelete,
            created: this.created,
            lastEdited: this.lastEdited
        }
    }

    static writeDataToInstance(noteData, instance = null) {
        if (!noteData) return false;

        let model = new AbstractModel;
        if (!instance) instance = new GlobalNote;

        instance.id = instance.id ?? noteData.id;
        if (noteData.title) instance.title = noteData.title;
        if (noteData.content) instance.content = noteData.content;
        if (noteData.parentFolderId != undefined) { instance.parentFolderId = noteData.parentFolderId };
        if (noteData.parentIdBeforeDelete != undefined) { instance.parentIdBeforeDelete = noteData.parentIdBeforeDelete };
        if (noteData.created) { instance.created = noteData.created } else { instance.created = model.formatDateTime(new Date()) };
        if (noteData.lastEdited) { instance.lastEdited = noteData.lastEdited } else { instance.lastEdited = model.formatDateTime(new Date()) };

        return instance;
    }

    // Getter
    get id() { return this.#id; }
    get title() { return this.#title; }
    get content() { return this.#content; }
    get parentFolderId() { return this.#parentFolderId; }
    get parentIdBeforeDelete() { return this.#parentIdBeforeDelete; }
    get created() { return this.#created; }
    get lastEdited() { return this.#lastEdited; }

    // Setter
    set id(value) { this.#id = value; }
    set title(value) { this.#title = value; }
    set content(value) { this.#content = value; }
    set parentFolderId(value) { this.#parentFolderId = value; }
    set parentIdBeforeDelete(value) { this.#parentIdBeforeDelete = value; }
    set created(value) { this.#created = value; }
    set lastEdited(value) { this.#lastEdited = value; }

}