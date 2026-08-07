import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js';
import GlobalNotesController from "../Controller/GlobalNotesController.js";

export default class GlobalNoteFolder extends AbstractModel {
    #id;
    #name;
    #parentFolderId;
    #created;
    #lastEdited;

    static #systemFolders = [
        {
            id: 0,
            name: 'alle',
            parentFolderId: undefined,
            created: '',
            lastEdited: ''
        },
        {
            id: 1,
            name: 'Papierkorb',
            parentFolderId: 0,
            created: '',
            lastEdited: '',
        }
    ];

    static #navigationHistory = [0];
    static #clipboard = {};

    static async getAllFolders() {
        const noteFolder = new GlobalNoteFolder;
        const foldersFromDb = await noteFolder.readAllFromLocalDB('globalNoteFolders');
        const allFolders = this.#systemFolders.concat(foldersFromDb);

        return allFolders.map(globalNoteFolder => this.writeDataToInstance(globalNoteFolder));
    }

    static async getById(id) {
        const systemFolder = this.#systemFolders.find(folder => folder.id == id);

        if (systemFolder) {
            return this.writeDataToInstance(systemFolder);
        }

        const noteFolder = new GlobalNoteFolder;
        const folderData = await noteFolder.readFromLocalDB('globalNoteFolders', id);

        return this.writeDataToInstance(folderData);
    }

    static async getAllByParentFolderId(parentFolderId) {
        const noteFolder = new GlobalNoteFolder;
        const allFoldersFromDB = await noteFolder.readAllByIndexFromLocalDB('globalNoteFolders', 'parentFolderId', parentFolderId);
        const systemFolders = [];
            
        this.#systemFolders.map(folder => {if (folder.parentFolderId == parentFolderId) systemFolders.push(folder)});

        const allFolders = systemFolders.concat(allFoldersFromDB);

        return allFolders.map(entry => this.writeDataToInstance(entry));
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

    static async getFolderContentRecursively(folder) {
        let folderContentArrays = {
            folders: [],
            notes: []
        }

        async function getContents(folder, folderContentArrays) {

            const allChildFolders = await GlobalNoteFolder.getAllByParentFolderId(folder.id);
            const allChildNotes = await GlobalNotesController.getAllNotesByParentFolderId(folder.id);

            folderContentArrays.folders.push(folder);

            allChildNotes.forEach(note => folderContentArrays.notes.push(note));

            for (const folder of allChildFolders) {
                folderContentArrays = await getContents(folder, folderContentArrays);
            }

            return folderContentArrays;
        }

        folderContentArrays = await getContents(folder, folderContentArrays);

        return folderContentArrays;
    }

    ///////////////////////
    // clipboard methods //
    ///////////////////////

    /**@param operationType 'cut', 'copy'  */
    static addToClipboard(folderIdArray, operationType) {
        if (operationType != 'cut' && operationType != 'copy') console.error('Unknown operation type!')

        folderIdArray.forEach(folderId => this.#clipboard[folderId] = { folderId: folderId, operationType: operationType });
    }

    static getClipboardContent() {
        return this.#clipboard;
    }

    static clearClipboard() {
        this.#clipboard = {};
    }

    static async pasteClipboardContent(targetFolderId) {
        if (Fn.isEmptyObject(this.#clipboard)) return;

        const foldersToUpdate = [];
        let allGlobalNotes = [];
        let allGlobalNotesFolders = [];
        let itemsToSave = {
            folders: [],
            notes: []
        };

        const model = new GlobalNoteFolder;

        async function copyFolder(folder, newParentFolderId, itemsToSave) {
            const allChildFolders = await GlobalNoteFolder.getAllByParentFolderId(folder.id);
            const allChildNotes = await GlobalNotesController.getAllNotesByParentFolderId(folder.id);

            folder.parentFolderId = Number(newParentFolderId);
            folder.id = Fn.generateId(allGlobalNotesFolders);

            allGlobalNotesFolders.push(folder);
            itemsToSave.folders.push(folder);

            for (const note of allChildNotes) {
                note.id = Fn.generateId(allGlobalNotes);
                note.parentFolderId = folder.id;

                itemsToSave.notes.push(note);
                allGlobalNotes.push(note);
            }

            for (const childFolder of allChildFolders) {
                itemsToSave = await copyFolder(childFolder, folder.id, itemsToSave)
            }

            return itemsToSave;
        }

        for (const id of Object.keys(this.#clipboard)) {
            const folder = await this.getById(id);

            if (this.#clipboard[id].operationType == 'copy') {
                allGlobalNotesFolders = await this.getAllFolders();
                allGlobalNotes = await GlobalNotesController.getAllGlobalNotes();
                folder.name = `${folder.name}(Kopie)`;

                itemsToSave = await copyFolder(folder, targetFolderId, itemsToSave);

                continue;
            }

            folder.parentFolderId = Number(targetFolderId);
            foldersToUpdate.push(folder);
        }

        await model.batchSave(itemsToSave.folders, true);
        await GlobalNotesController.batchSaveGlobalNotes(itemsToSave.notes, true);
        await model.batchUpdate(foldersToUpdate);
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
        const allGlobalNoteFolders = await GlobalNoteFolder.getAllFolders();
        let newId = Fn.generateId(allGlobalNoteFolders);

        if (newId <= 1000) newId = 1001;

        this.id = newId;
        this.lastEdited = this.formatDateTime(new Date());
        this.created = this.lastEdited;

        await this.writeToLocalDB('globalNoteFolders', this.serialize());
        let result = await this.makeAjaxQuery('globalNoteFolder', 'save', [this.serialize()]);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedGlobalNoteFolders', this.serialize());
    }

    async delete() {
        const itemsToDelete = await GlobalNoteFolder.getFolderContentRecursively(this);
        const foldersToDelete = itemsToDelete.folders;
        const notesToDelete = itemsToDelete.notes;
        const serializedFolders = [];

        for (const folder of foldersToDelete) {
            serializedFolders.push(folder.serialize());

            await this.deleteFromLocalDB('globalNoteFolders', folder.id);
            await this.deleteFromLocalDB('unsyncedGlobalNoteFolders', folder.id);
        }

        let result = await this.makeAjaxQuery('globalNoteFolder', 'delete', serializedFolders);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedGlobalNoteFolders', serializedFolders);

        GlobalNotesController.batchDeleteGlobalNote(notesToDelete);
    }

    async update() {
        this.lastEdited = this.formatDateTime(new Date());

        this.updateOnLocalDB('globalNoteFolders', this.serialize());
        let result = await this.makeAjaxQuery('globalNoteFolder', 'update', [this.serialize()]);

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedGlobalNoteFolders', this.serialize());
    }

    async batchSave(foldersToSave, keepIds = false) {
        const serializedFolders = [];
        const allGlobalNoteFolders = await GlobalNoteFolder.getAllFolders();

        for (const folder of foldersToSave) {
            if (!keepIds) {
                folder.id = Fn.generateId(allGlobalNoteFolders)
                allGlobalNoteFolders.push(folder);
            }

            folder.lastEdited = this.formatDateTime(new Date());

            let serializedFolder = folder.serialize();
            serializedFolders.push(serializedFolder);

            await this.writeToLocalDB('globalNoteFolders', serializedFolder);
        }

        let result = await this.makeAjaxQuery('globalNoteFolder', 'save', serializedFolders);

        if (result.status == 'failed') {
            for (const folder of serializedFolders) {
                this.writeToLocalDB('unsyncedGlobalNoteFolders', folder);
            }
        }
    }

    async batchUpdate(foldersToUpdate) {
        const serializedFolders = [];

        for (const folder of foldersToUpdate) {
            folder.lastEdited = this.formatDateTime(new Date());

            let serializedFolder = folder.serialize();
            serializedFolders.push(serializedFolder);

            await this.updateOnLocalDB('globalNoteFolders', serializedFolder);
        }

        let result = await this.makeAjaxQuery('globalNoteFolder', 'update', serializedFolders);

        if (result.status == 'failed') {
            for (const folder of serializedFolders) {
                this.writeToLocalDB('unsyncedGlobalNoteFolders', folder);
            }
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
        if (!folderData) return false;

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