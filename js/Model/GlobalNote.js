import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js';

export default class GlobalNote extends AbstractModel {
    #id;
    #title;
    #content;
    #parentFolderId;
    #created;
    #lastEdited;

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
        // this needs to be completely rewritten in the end
        // search by folder id will be done by a cursor on the indexeddb

        const dataArray = await this.getAllNotes();

        dataArray.filter(globalNote => {
            globalNote.parentFolderId == parentFolderId
        })

        return dataArray.filter(globalNote => globalNote.parentFolderId == parentFolderId);
    }

    async save() {
        let allGlobalNotes = await GlobalNote.getAllNotes();

        this.id = Fn.generateId(allGlobalNotes);
        this.lastEdited = this.formatDateTime(new Date());
        this.created = this.lastEdited;

        await this.writeToLocalDB('globalNotes', this.serialize());
        // let result = await this.makeAjaxQuery('globalNote', 'save', [this.serialize()]);

        // if (result.status == 'failed') this.writeToLocalDB('unsyncedGlobalNotes', this.serialize());
    }

    async delete() {
        let deletedItem = await this.readFromLocalDB('globalNotes', this.id);
        this.deleteFromLocalDB('globalNotes', this.id);
        this.deleteFromLocalDB('unsyncedGlobalNotes', this.id);

        // let result = await this.makeAjaxQuery('globalNote', 'delete', [this.serialize()]);

        // if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedGlobalNotes', deletedItem);
    }

    async update() {
        this.lastEdited = this.formatDateTime(new Date());

        this.updateOnLocalDB('globalNotes', this.serialize());
        // let result = await this.makeAjaxQuery('globalNote', 'update', this.serialize());

        // if (result.status == 'failed') this.updateOnLocalDB('unsyncedGlobalNotes', this.serialize());
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