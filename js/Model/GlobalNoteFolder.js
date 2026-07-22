import AbstractModel from "./AbstractModel.js";

export default class GlobalNoteFolder extends AbstractModel {
    #id;
    #name;
    #parentFolderId;
    #created;
    #lastEdited;

    static #navigationHistory = [0];

    static mockupFolders = [
        {
            id: 0,
            name: 'alle Dateien',
            parentFolderId: undefined,
            created: '',
            lastEdited: ''
        },
        {
            id: 1,
            name: 'alte Daten',
            parentFolderId: 0,
            created: '',
            lastEdited: ''
        },
        {
            id: 2,
            name: 'neuer Ordner länger',
            parentFolderId: 0,
            created: '',
            lastEdited: ''
        },
        {
            id: 3,
            name: 'ältere Daten',
            parentFolderId: 1,
            created: '',
            lastEdited: ''
        },
        {
            id: 4,
            name: 'mittlere Daten',
            parentFolderId: 1,
            created: '',
            lastEdited: ''
        }
    ];

    static async getAllFolders() {
        const dataArray = this.mockupFolders

        return dataArray.map(globalNoteFolder => this.writeDataToInstance(globalNoteFolder));
    }

    static async getById(id) {
        return this.writeDataToInstance(this.mockupFolders.find(folder => folder.id == id));
    }

    static async getAllByParentFolderId(parentFolderId) {
        // this needs to be completely rewritten in the end
        // search by folder id will be done by a cursor on the indexeddb

        const dataArray = await this.getAllFolders();

        return dataArray.filter(globalNoteFolder => globalNoteFolder.parentFolderId == parentFolderId);
    }

    static async getAllParentFolders(folderId, parentFolderArray = []) {
        const currentFolder = await this.getById(folderId)

        parentFolderArray.unshift(currentFolder);

        if (currentFolder.parentFolderId !== undefined) parentFolderArray = await this.getAllParentFolders(currentFolder.parentFolderId, parentFolderArray);

        return parentFolderArray;
    }

    static updateNavigationHistory(folderIdToStore, currentStep) {
        currentStep = Number(currentStep);

        if (currentStep < this.#navigationHistory.length - 1) this.#navigationHistory.splice(currentStep + 1)
        this.#navigationHistory.push(folderIdToStore);
    }

    static getPreviousFolderInHistory(currentStep) {
        const historyStepCount = this.#navigationHistory.length;

        currentStep = Number(currentStep);

        let previousStepAvailable = true;
        let nextStepAvailable = true;

        if (currentStep - 1 == 0) previousStepAvailable = false;
        if (currentStep == historyStepCount) nextStepAvailable = false

        return {
            folderToOpen: this.#navigationHistory[currentStep - 1],
            step: currentStep - 1,
            previousStepAvailable: previousStepAvailable,
            nextStepAvailable: nextStepAvailable
        }
    }

    static getNextFolderInHistory(currentStep) {
        const historyStepCount = this.#navigationHistory.length;

        currentStep = Number(currentStep);

        let previousStepAvailable = true;
        let nextStepAvailable = true;

        if (currentStep + 1 == 0) previousStepAvailable = false;
        if (currentStep + 2 >= historyStepCount) nextStepAvailable = false

        return {
            folderToOpen: this.#navigationHistory[currentStep + 1],
            step: currentStep + 1,
            previousStepAvailable: previousStepAvailable,
            nextStepAvailable: nextStepAvailable
        }
    }

    static getLatestNavigationStep() {
        return {
            step: this.#navigationHistory.length - 1,
            previousStepAvailable: true,
            nextStepAvailable: false
        }
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            parentFolderId: this.parentFolderId,
            created: this.created,
            lastEdited: this.lastEdited
        }
    }

    static writeDataToInstance(folderData, instance = null) {
        let model = new AbstractModel;
        if (!instance) instance = new GlobalNoteFolder;

        instance.id = instance.id ?? folderData.id;
        if (folderData.name) instance.name = folderData.name;
        if (folderData.parentFolderId != undefined) { instance.parentFolderId = folderData.parentFolderId };
        if (folderData.created) { instance.created = noteData.created } else { instance.created = model.formatDateTime(new Date()) };
        if (folderData.lastEdited) { instance.lastEdited = folderData.lastEdited } else { instance.lastEdited = model.formatDateTime(new Date()) };

        return instance;
    }

    // Getter
    get id() { return this.#id; }
    get name() { return this.#name; }
    get parentFolderId() { return this.#parentFolderId; }
    get created() { return this.#created; }
    get lastEdited() { return this.#lastEdited; }

    // Setter
    set id(value) { this.#id = value; }
    set name(value) { this.#name = value; }
    set parentFolderId(value) { this.#parentFolderId = value; }
    set created(value) { this.#created = value; }
    set lastEdited(value) { this.#lastEdited = value; }

}