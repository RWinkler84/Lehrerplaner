import AbstractModel from "./AbstractModel.js";

export default class GlobalNote extends AbstractModel {
    #id;
    #title;
    #content;
    #parentFolderId;
    #created;
    #lastEdited;


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

    static async getAllNotes() {
        const dataArray = this.mockupFiles;

        return dataArray.map(globalNote => this.writeDataToInstance(globalNote));
    }

    static async getById(id) {
        return this.writeDataToInstance(this.mockupFiles.find(globalNote => globalNote.id == id));
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