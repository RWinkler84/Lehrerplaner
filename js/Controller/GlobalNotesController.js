import GlobalNote from "../Model/GlobalNote.js";
import GlobalNoteFolder from '../Model/GlobalNoteFolder.js';
import View from "../View/GlobalNotesView.js";

export default class GlobalNotesController {
    static async renderGlobalNotesView() {
        await this.renderFolderPath();
        await this.renderFolderIcons();
        await this.renderGlobalNoteIcons();
    }

    static async renderGlobalNoteIcons() {
        const globalNotes = await GlobalNote.getAllByParentFolderId(View.getDisplayedFolderId());
        const clipboardContent = GlobalNote.getClipboardContent();

        View.renderGlobalNoteIcons(globalNotes, clipboardContent);
    }

    static async renderFolderIcons() {
        const allFolders = await GlobalNoteFolder.getAllByParentFolderId(View.getDisplayedFolderId());
        const clipboardContent = GlobalNoteFolder.getClipboardContent();

        View.renderFolderIcons(allFolders, clipboardContent);
    }

    static async renderFolderPath() {
        const allParentFolders = await GlobalNoteFolder.getAllParentFolders(View.getDisplayedFolderId());

        View.renderFolderPath(allParentFolders);
    }

    static async openGlobalNoteDialog(noteId = null) {

        if (noteId) {
            if (GlobalNote.isCut(noteId)) return;

            const globalNote = await GlobalNote.getById(noteId);
            View.openGlobalNoteDialog(globalNote);

            return;
        }

        View.openGlobalNoteDialog();
    }

    static closeGlobalNoteDialog() {
        View.closeGlobalNoteDialog();
    }

    static openContextMenu(event) {
        let clipboardContent = {
            folders: GlobalNoteFolder.getClipboardContent(),
            notes: GlobalNote.getClipboardContent()
        };

        const sourceContainer = View.getSourceContainerOfContextMenu(event);

        View.openContextMenu(event, clipboardContent);
    }

    static closeAllContextMenus() {
        View.closeAllContextMenus();
    }

    //////////////////////////////
    // global note crud methods //
    //////////////////////////////

    static createNewGlobalNote() {
        this.openGlobalNoteDialog();
    }

    static async saveGlobalNote() {
        const globalNoteData = View.getDataFromGlobalNoteDialog();

        if (globalNoteData.title == '') {
            View.alertGlobalNoteTitleInput();

            return;
        }

        if (globalNoteData.id != '') {
            this.updateGlobalNote(globalNoteData);

            return;
        }

        const globalNote = GlobalNote.writeDataToInstance(globalNoteData)

        await globalNote.save();
        await this.renderGlobalNoteIcons();
        View.showGlobalNoteSavedMessage();
        View.updateGlobalNoteDialog(globalNote);
        View.toggleSaveDayNoteButton(false);
    }

    static async batchSaveGlobalNotes(notesToSave, keepIds) {
        const globalNote = new GlobalNote;

        await globalNote.batchSave(notesToSave, keepIds);
    }

    static async updateGlobalNote(globalNoteData) {
        const globalNote = GlobalNote.writeDataToInstance(globalNoteData)

        await globalNote.update();
        await this.renderGlobalNoteIcons();
        View.showGlobalNoteSavedMessage();
        View.toggleSaveDayNoteButton(false);
    }

    static async deleteGlobalNote(noteId) {
        const noteToDelete = await GlobalNote.getById(noteId);

        await noteToDelete.delete();
    }

    static async batchDeleteGlobalNote(globalNotesToDelete) {
        await (new GlobalNote).batchDelete(globalNotesToDelete);
    }

    /////////////////////////
    // folder crud methods //
    /////////////////////////

    static openFolder(folderId) {
        const globalNotesFileContainer = document.querySelector('#globalNotesFileContainer');
        globalNotesFileContainer.dataset.folder_id = folderId;

        this.renderGlobalNotesView();
    }

    static createNewGlobalNoteFolder() {
        View.createNewGlobalNoteFolder();
    }

    static async saveGlobalNotesFolder(event) {
        const noteFolderData = View.getFolderDataFromForm(event);

        if (!noteFolderData.name) {
            View.alertFolderNameInput(event);

            return;
        }

        const globalNoteFolder = GlobalNoteFolder.writeDataToInstance(noteFolderData);

        await globalNoteFolder.save();
        await this.renderFolderIcons();
    }

    static async updateGlobalNoteFolder(globalNoteFolderData) {
        const globalNoteFolder = GlobalNoteFolder.writeDataToInstance(globalNoteFolderData)

        await globalNoteFolder.update();
        await this.renderFolderIcons();
    }

    static cancelGlobalNotesFolderCreation(event) {
        View.cancelGlobalNotesFolderCreation(event);
    }

    static async deleteGlobalNoteFolder(folderId) {
        const globalNoteFolder = await GlobalNoteFolder.getById(folderId);

        await globalNoteFolder.delete();
    }

    static makeFolderEditable(folderId) {
        View.makeFolderEditable(folderId);
    }

    static async saveFolderEdit(event) {
        const folderData = View.getFolderDataFromForm(event);

        if (folderData.name == '') {
            View.alertFolderNameInput(event);
        }

        const globalNoteFolder = GlobalNoteFolder.writeDataToInstance(folderData);

        await globalNoteFolder.update();

        View.removeFolderEditability(event);
    }

    static cancelFolderEdit(event) {
        View.removeFolderEditability(event);
    }

    ///////////////////////
    // folder navigation //
    ///////////////////////

    /**@param direction: 'forward' or 'backward' */
    static navigateFolderHistory(direction) {
        const currentNavigationStep = View.getCurrentNavigationStep();

        if (direction == 'backward') {
            const navigationData = GlobalNoteFolder.getPreviousFolderInHistory(currentNavigationStep);

            View.toggleNavigationButtons(navigationData);
            this.openFolder(navigationData.folderToOpen);
        }

        if (direction == 'forward') {
            const navigationData = GlobalNoteFolder.getNextFolderInHistory(currentNavigationStep)

            View.toggleNavigationButtons(navigationData);
            this.openFolder(navigationData.folderToOpen);
        }
    }

    static toggleSaveGlobalNoteButton(event) {
        if (event.target.id == 'globalNoteContentEditor' || event.target.id == 'globalNoteTitleInput') {
            View.toggleSaveDayNoteButton(true);
        }
    }

    /** This function is used to update the navigation buttons, when a folder is opened by clicking the folder icon,
    not by navigating the history.
     */
    static updateHistoryNavigationButtons() {
        const navigationData = GlobalNoteFolder.getLatestNavigationStep();
        View.toggleNavigationButtons(navigationData);
    }

    //////////////////
    // context menu //
    //////////////////

    static async editGlobalItemFromContextMenu(event) {
        const clickedItemData = View.getContextMenuInfo(event);

        if (clickedItemData.fileType == 'folder') {
            this.makeFolderEditable(clickedItemData.folderId);
            this.closeAllContextMenus();
        }

        if (clickedItemData.fileType == 'note') {
            this.openGlobalNoteDialog(clickedItemData.noteId);
            this.closeAllContextMenus();
        }
    }

    static async cutGlobalItem(event) {
        const clickedItemData = View.getContextMenuInfo(event);

        if (clickedItemData.fileType == 'folder') {
            GlobalNoteFolder.clearClipboard();
            GlobalNote.clearClipboard();

            GlobalNoteFolder.addToClipboard([clickedItemData.folderId], 'cut');

            View.markItemAsCut();
            this.closeAllContextMenus();
        }

        if (clickedItemData.fileType == 'note') {
            GlobalNoteFolder.clearClipboard();
            GlobalNote.clearClipboard();

            GlobalNote.addToClipboard([clickedItemData.noteId], 'cut');

            View.markItemAsCut();
            this.closeAllContextMenus();
        }
    }

    static async copyGlobalItem(event) {
        const clickedItemData = View.getContextMenuInfo(event);

        if (clickedItemData.fileType == 'folder') {
            GlobalNote.clearClipboard();
            GlobalNoteFolder.clearClipboard();

            GlobalNoteFolder.addToClipboard([clickedItemData.folderId], 'copy');

            this.closeAllContextMenus();
        }

        if (clickedItemData.fileType == 'note') {
            GlobalNote.clearClipboard();
            GlobalNoteFolder.clearClipboard();

            GlobalNote.addToClipboard([clickedItemData.noteId], 'copy');

            this.closeAllContextMenus();
        }
    }

    static async pasteGlobalItem(event) {
        const contextMenuInfo = View.getContextMenuInfo(event);

        await GlobalNote.pasteClipboardContent(contextMenuInfo.folderId);
        await GlobalNoteFolder.pasteClipboardContent(contextMenuInfo.folderId);

        GlobalNote.clearClipboard();
        GlobalNoteFolder.clearClipboard();

        this.closeAllContextMenus();
        this.renderGlobalNotesView();
    }

    static async deleteGlobalItem(event) {
        const clickedItemData = View.getContextMenuInfo(event);

        if (clickedItemData.fileType == 'folder') {
            await this.deleteGlobalNoteFolder(clickedItemData.folderId);
            this.renderFolderIcons();
            this.closeAllContextMenus();
        }

        if (clickedItemData.fileType == 'note') {
            await this.deleteGlobalNote(clickedItemData.noteId);
            this.renderGlobalNoteIcons();
            this.closeAllContextMenus();
        }
    }

    //////////
    // misc //
    //////////

    static async getAllNotesByParentFolderId(id) {
        return await GlobalNote.getAllByParentFolderId(id);
    }
    static async getAllFoldersByParentFolderId(id) {
        return await GlobalNoteFolder.getAllByParentFolderId(id);
    }

    static async getAllGlobalNotes() {
        return await GlobalNote.getAllNotes();
    }

    static clickHandler(event) {
        const target = event.target;

        const currentStep = View.getCurrentNavigationStep();
        let folderId;

        //dialog
        if (target.closest('#globalNoteDialog')) {
            switch (target.id) {
                case 'closeGlobalNoteButton':
                    this.closeGlobalNoteDialog()
                    break;

                case 'saveGlobalNoteButton':
                    this.saveGlobalNote();
                    break;
            }
        }

        //global notes view
        if (event.target.closest('#globalNotesContainer')) {

            if (!target.closest('.globalNoteContextMenu')) this.closeAllContextMenus();

            switch (target.id) {
                case 'folderBackwardButton':
                    this.navigateFolderHistory('backward');
                    break;

                case 'folderForwardButton':
                    this.navigateFolderHistory('forward');
                    break;

                case 'createGlobalNoteButton':
                    this.createNewGlobalNote();
                    break;

                case 'createGlobalNoteFolderButton':
                    this.createNewGlobalNoteFolder();
                    break;

                //context menu
                case 'editGlobalItemButton':
                    this.editGlobalItemFromContextMenu(event);
                    break;

                case 'cutGlobalItemButton':
                    this.cutGlobalItem(event);
                    break;

                case 'copyGlobalItemButton':
                    this.copyGlobalItem(event);
                    break;

                case 'pasteGlobalItemButton':
                    this.pasteGlobalItem(event);
                    break;

                case 'deleteGlobalItemButton':
                    this.deleteGlobalItem(event);
                    break;

                case 'newGlobalNoteButton':
                    this.closeAllContextMenus();
                    this.createNewGlobalNote();
                    break;

                case 'newGlobalNoteFolderButton':
                    this.closeAllContextMenus()
                    this.createNewGlobalNoteFolder();
                    break;
            }

            switch (true) {
                //open files
                case target.closest('.noteIconContainer') != undefined:
                    this.openGlobalNoteDialog(target.closest('.noteIconContainer').dataset.note_id);
                    break;

                // folder navigation
                case target.classList.contains('folderNameWrapperOnPath'):
                    folderId = Number(target.closest('.folderPathItemContainer').dataset.folder_id);

                    if (View.getDisplayedFolderId() == folderId) return;

                    GlobalNoteFolder.updateNavigationHistory(folderId, currentStep);
                    this.updateHistoryNavigationButtons();
                    this.openFolder(folderId);
                    break;

                case target.classList.contains('folderIconContainer'):
                case target.classList.contains('folderIconSolid'):
                case target.classList.contains('folderNameWrapper'):
                    if (target.closest('.folderIconContainer').classList.contains('new')) return;
                    if (target.closest('.folderIconContainer').classList.contains('editable')) return;

                    folderId = target.closest('.folderIconContainer').dataset.folder_id;

                    if (GlobalNoteFolder.isCut(folderId)) return;

                    GlobalNoteFolder.updateNavigationHistory(folderId, currentStep);
                    this.updateHistoryNavigationButtons();
                    this.openFolder(folderId);
                    break;

                //create folder
                case target.classList.contains('saveNewFolderButton'):
                    this.saveGlobalNotesFolder(event);
                    break;

                case target.classList.contains('cancelNewFolderButton'):
                    this.cancelGlobalNotesFolderCreation(event);
                    break;

                case target.classList.contains('saveFolderEditButton'):
                    this.saveFolderEdit(event);
                    break;

                case target.classList.contains('cancelFolderEditButton'):
                    this.cancelFolderEdit(event);
                    break;
            }
        }

    }

    static rightClickHandler(event) {
        const target = event.target;
        event.preventDefault();

        GlobalNotesController.closeAllContextMenus();
        GlobalNotesController.openContextMenu(event);
    }

    static writeMockupData() {
        GlobalNote.writeMockupData();
        GlobalNoteFolder.writeMockupData();
    }

}