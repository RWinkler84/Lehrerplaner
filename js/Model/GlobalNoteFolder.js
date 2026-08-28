import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js';
import GlobalNotesController from "../Controller/GlobalNotesController.js";
import { SF_ID_ROOT, SF_ID_TRASH } from "../index.js";

export default class GlobalNoteFolder extends AbstractModel {
    #id;
    #name;
    #parentFolderId;
    #parentIdBeforeDelete = null;
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

        this.#systemFolders.map(folder => { if (folder.parentFolderId == parentFolderId) systemFolders.push(folder) });

        const allFolders = systemFolders.concat(allFoldersFromDB);

        return allFolders.map(entry => this.writeDataToInstance(entry));
    }

    static async getAllParentFolders(folderId, parentFolderArray = []) {
        const currentFolder = await this.getById(folderId)

        parentFolderArray.unshift(currentFolder);

        if (currentFolder.parentFolderId !== undefined) parentFolderArray = await this.getAllParentFolders(currentFolder.parentFolderId, parentFolderArray);

        return parentFolderArray;
    }

    static async folderExists(folderId) {
        const model = new GlobalNoteFolder;
        const db = await model.openIndexedDB();
        let request = db.transaction('globalNoteFolders', 'readonly').objectStore('globalNoteFolders').count(folderId);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log(request.result);
                if (request.result != 0) { resolve(true) }
                else { resolve(false) }
            }
            request.onerror = () => reject(false);
        })
    }

    ////////////////////////
    // navigation history //
    ////////////////////////

    static updateNavigationHistory(folderIdToStore, currentStep) {
        currentStep = Number(currentStep);

        if (currentStep < this.#navigationHistory.length - 1) this.#navigationHistory.splice(currentStep + 1)
        this.#navigationHistory.push(folderIdToStore);
    }

    static removeFromNavigationHistory(folderIdToRemove) {
        this.#navigationHistory = this.#navigationHistory.filter(entry => entry != folderIdToRemove);
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

    static async getFolderContentRecursively(folder, includeParent = true) {
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

        if (!includeParent) {
            folderContentArrays.folders.splice(folderContentArrays.folders.indexOf(folder), 1);
        }

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
        let allGlobalNotes = null;
        let allGlobalNotesFolders = null;
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
                if (!allGlobalNotesFolders) allGlobalNotesFolders = await this.getAllFolders();
                if (!allGlobalNotes) allGlobalNotes = await GlobalNotesController.getAllGlobalNotes();
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


    ///////////////////
    // trash methods //
    ///////////////////

    static async batchRestoreTrashedFolders(folderArray) {
        const model = new GlobalNoteFolder;
        const foldersToUpdate = [];
        const failedRestores = [];

        for (const folder of folderArray) {

            const parentExists = await this.folderExists(folder.parentIdBeforeDelete);

            if (!parentExists && folder.parentIdBeforeDelete !== SF_ID_ROOT) {
                failedRestores.push(folder);

                continue;
            }

            folder.parentFolderId = folder.parentIdBeforeDelete;
            folder.parentIdBeforeDelete = null;

            foldersToUpdate.push(folder);
        };

        await model.batchUpdate(foldersToUpdate);

        return failedRestores;
    }

    static async deleteAllTrashedFolders(allTrashedFolders) {
        await (new GlobalNoteFolder).batchDelete(allTrashedFolders);
    }

    static async isTrashEmpty() {
        const foldersInTrash = await this.getAllByParentFolderId(1);
        const notesInTrash = await GlobalNotesController.getAllNotesByParentFolderId(1);

        if (foldersInTrash.length == 0 && notesInTrash.length == 0) return true;

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

    async moveToTrash() {
        this.parentIdBeforeDelete = this.parentFolderId;
        this.parentFolderId = 1;

        await this.update();
    }

    async delete() {
        const itemsToDelete = await GlobalNoteFolder.getFolderContentRecursively(this);
        const foldersToDelete = itemsToDelete.folders;
        const notesToDelete = itemsToDelete.notes;
        const serializedFolders = [];
        const now = this.formatDateTime(new Date());

        for (const folder of foldersToDelete) {
            folder.lastEdited = now;
            
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
        const now = this.formatDateTime(new Date());

        for (const folder of foldersToUpdate) {
            folder.lastEdited = now;

            let serializedFolder = folder.serialize();
            serializedFolders.push(serializedFolder);

            await this.updateOnLocalDB('globalNoteFolders', serializedFolder);
        }

        let result = await this.makeAjaxQuery('globalNoteFolder', 'update', serializedFolders);

        if (result.status == 'failed') {
            for (const folder of serializedFolders) {
                this.updateOnLocalDB('unsyncedGlobalNoteFolders', folder);
            }
        }
    }

    async batchDelete(foldersToDelete) {
        if (foldersToDelete.length == 0) return;

        const now = this.formatDateTime(new Date());
        const uniqueFolders = {};
        const notesToDelete = [];

        for (const folder of foldersToDelete) {
            const allChildItems = await GlobalNoteFolder.getFolderContentRecursively(folder, false);

            for (const childFolder of allChildItems.folders) {
                childFolder.lastEdited = now;
                uniqueFolders[childFolder.id] = childFolder.serialize();

                await this.deleteFromLocalDB('globalNoteFolders', childFolder.id);
                await this.deleteFromLocalDB('unsyncedGlobalNoteFolders', childFolder.id);
            }

            folder.lastEdited = now;
            uniqueFolders[folder.id] = folder.serialize();

            await this.deleteFromLocalDB('globalNoteFolders', folder.id);
            await this.deleteFromLocalDB('unsyncedGlobalNoteFolders', folder.id);

            allChildItems.notes.forEach(note => notesToDelete.push(note));
        }

        const serializedFolders = Object.keys(uniqueFolders).map(key => uniqueFolders[key]);

        serializedFolders.forEach(folder => GlobalNoteFolder.removeFromNavigationHistory(folder.id));

        await GlobalNotesController.batchDeleteGlobalNote(notesToDelete);

        let result = await this.makeAjaxQuery('globalNoteFolder', 'delete', serializedFolders);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedGlobalNoteFolders', serializedFolders);
    }

    async batchMoveToTrash(foldersToMoveToTrash) {
        foldersToMoveToTrash.forEach(folder => {
            folder.parentIdBeforeDelete = folder.parentFolderId;
            folder.parentFolderId = SF_ID_TRASH;
        })

        await this.batchUpdate(foldersToMoveToTrash);
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            parentFolderId: this.parentFolderId,
            parentIdBeforeDelete: this.parentIdBeforeDelete,
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
        if (folderData.parentIdBeforeDelete != undefined) { instance.parentIdBeforeDelete = folderData.parentIdBeforeDelete };
        if (folderData.created) { instance.created = folderData.created } else { instance.created = model.formatDateTime(new Date()) };
        if (folderData.lastEdited) { instance.lastEdited = folderData.lastEdited } else { instance.lastEdited = model.formatDateTime(new Date()) };

        return instance;
    }

    // Getter
    get id() { return this.#id; }
    get name() { return this.#name; }
    get parentFolderId() { return this.#parentFolderId; }
    get parentIdBeforeDelete() { return this.#parentIdBeforeDelete; }
    get created() { return this.#created; }
    get lastEdited() { return this.#lastEdited; }

    // Setter
    set id(value) { this.#id = value; }
    set name(value) { this.#name = value; }
    set parentFolderId(value) { this.#parentFolderId = value; }
    set parentIdBeforeDelete(value) { this.#parentIdBeforeDelete = value; }
    set created(value) { this.#created = value; }
    set lastEdited(value) { this.#lastEdited = value; }

}