import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js';

export default class GlobalNoteFolder extends AbstractModel {
    #id;
    #name;
    #parentFolderId;
    #created;
    #lastEdited;

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

        static writeMockupData() {
        this.mockupFolders.forEach(noteData => {
            const note = this.writeDataToInstance(noteData);

            note.save();
        })
    }

    static #navigationHistory = [0];
    static #clipboard = [];

    static async getAllFolders() {
        const noteFolder = new GlobalNoteFolder;
        const dataArray = await noteFolder.readAllFromLocalDB('globalNoteFolders')

        return dataArray.map(globalNoteFolder => this.writeDataToInstance(globalNoteFolder));
    }

    static async getById(id) {
        const noteFolder = new GlobalNoteFolder;
        const folderData = await noteFolder.readFromLocalDB('globalNoteFolders', id);

        return this.writeDataToInstance(folderData);
    }

    static async getAllByParentFolderId(parentFolderId) {
        const noteFolder = new GlobalNoteFolder;
        const allFoldersOfParent = await noteFolder.readAllByIndexFromLocalDB('globalNoteFolders', 'parentFolderId', parentFolderId);

        return allFoldersOfParent;
    }

    static async getAllParentFolders(folderId, parentFolderArray = []) {
        const currentFolder = await this.getById(folderId)

        parentFolderArray.unshift(currentFolder);

        if (currentFolder.parentFolderId !== undefined) parentFolderArray = await this.getAllParentFolders(currentFolder.parentFolderId, parentFolderArray);

        return parentFolderArray;
    }

    ////////////////////////
    // navigation history //
    ////////////////////////

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

    ///////////////////////
    // clipboard methods //
    ///////////////////////
    
    /**@param operationType 'move', 'copy'  */
    static addToClipboard(folderIdArray, operationType) {
        if (operationType != 'move' && operationType != 'copy') console.error('Unknown operation type!')

        this.clearClipboard();

        folderIdArray.forEach(folderId => this.#clipboard.push({folderId: folderId, operationType: operationType}));

        console.log(this.#clipboard);
    }

    static getClipboardContent() {
        return this.#clipboard;
    }

    static clearClipboard() {
        this.#clipboard = [];
    } 
    
    //////////////////////
    // instance methods //
    //////////////////////

    async save() {
        let allGlobalNoteFolders = await GlobalNoteFolder.getAllFolders();

        this.id = Fn.generateId(allGlobalNoteFolders);
        this.lastEdited = this.formatDateTime(new Date());
        this.created = this.lastEdited;

        await this.writeToLocalDB('globalNoteFolders', this.serialize());
        let result = await this.makeAjaxQuery('globalNoteFolder', 'save', [this.serialize()]);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedGlobalNoteFolders', this.serialize());
    }

    async delete() {
        let deletedItem = await this.readFromLocalDB('globalNoteFolders', this.id);
        this.deleteFromLocalDB('globalNoteFolders', this.id);
        this.deleteFromLocalDB('unsyncedGlobalNoteFolders', this.id);

        let result = await this.makeAjaxQuery('globalNoteFolder', 'delete', [this.serialize()]);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedGlobalNoteFolders', deletedItem);
    }

    async update() {
        this.lastEdited = this.formatDateTime(new Date());

        this.updateOnLocalDB('globalNoteFolders', this.serialize());
        let result = await this.makeAjaxQuery('globalNoteFolder', 'update', [this.serialize()]);

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedGlobalNoteFolders', this.serialize());
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
        if (folderData.created) { instance.created = folderData.created } else { instance.created = model.formatDateTime(new Date()) };
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