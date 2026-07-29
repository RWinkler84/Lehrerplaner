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
        View.renderGlobalNoteIcons(globalNotes);
    }

    static async renderFolderIcons() {
        const allFolders = await GlobalNoteFolder.getAllByParentFolderId(View.getDisplayedFolderId());

        View.renderFolderIcons(allFolders);
    }

    static async renderFolderPath() {
        const allParentFolders = await GlobalNoteFolder.getAllParentFolders(View.getDisplayedFolderId());

        View.renderFolderPath(allParentFolders);
    }

    static async openGlobalNoteDialog(noteId = null) {

        if (noteId) {
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
        View.openContextMenu(event);
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

    /////////////////////////
    // folder crud methods //
    /////////////////////////

    static openFolder(folderId) {
        const globalNotesFileContainer = document.querySelector('#globalNotesFileContainer');

        if (globalNotesFileContainer.dataset.folder_id == folderId) return;

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

    static async deleteGlobalItem(event) {
        const clickedItem = View.getContextMenuInfo(event);

        if (clickedItem.fileType == 'folder') {
            await this.deleteGlobalNoteFolder(clickedItem.folderId);
            this.renderFolderIcons();
            this.closeAllContextMenus();
        }

        if (clickedItem.fileType == 'note') {
            await this.deleteGlobalNote(clickedItem.noteId);
            this.renderGlobalNoteIcons();
            this.closeAllContextMenus();
        }
    }


    static clickHandler(event) {
        const target = event.target;

        const currentStep = View.getCurrentNavigationStep();
        let folderId;

        console.log(target)

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

                case 'createGlobalNoteFolder':
                    this.createNewGlobalNoteFolder();
                    break;

                //context menu
                case 'deleteGlobalItemButton':
                    this.deleteGlobalItem(event);
                    break;
            }

            switch (true) {
                //open files
                case target.closest('.noteIconContainer') != undefined:
                    this.openGlobalNoteDialog(target.closest('.noteIconContainer').dataset.note_id);
                    break;

                // folder navigation
                case target.classList.contains('folderNameWrapperOnPath'):
                    folderId = target.closest('.folderPathItemContainer').dataset.folder_id;

                    GlobalNoteFolder.updateNavigationHistory(folderId, currentStep);
                    this.updateHistoryNavigationButtons();
                    this.openFolder(folderId);
                    break;

                case target.classList.contains('folderIconContainer'):
                case target.classList.contains('folderIconSolid'):
                case target.classList.contains('folderNameWrapper'):
                    if (target.closest('.folderIconContainer').classList.contains('new')) return;

                    folderId = target.closest('.folderIconContainer').dataset.folder_id;

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
            }
        }

    }

    static rightClickHandler(event) {
        const target = event.target;
        if (target.id == 'noteIconContainer' || target.id == 'folderIconContainer') return;

        event.preventDefault();

        GlobalNotesController.closeAllContextMenus();
        GlobalNotesController.openContextMenu(event);
    }

    static writeMockupData() {
        GlobalNote.writeMockupData();
        GlobalNoteFolder.writeMockupData();
    }

}