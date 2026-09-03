import { SF_ID_TRASH, contextMenuEvent, globalItemsMultiSelectData } from "../index.js";
import GlobalNote from "../Model/GlobalNote.js";
import GlobalNoteFolder from '../Model/GlobalNoteFolder.js';
import View from "../View/GlobalNotesView.js";

export default class GlobalNotesController {
    static async renderGlobalNotesView() {
        await this.renderFolderPath();
        await this.renderFolderIcons();
        await this.renderGlobalNoteIcons();

        View.toggleGlobalItemCreationButtons(!View.isInTrash())
    }

    static async renderGlobalNoteIcons() {
        const globalNotes = await GlobalNote.getAllByParentFolderId(View.getDisplayedFolderId());
        const clipboardContent = GlobalNote.getClipboardContent();

        View.renderGlobalNoteIcons(globalNotes, clipboardContent);
    }

    static async renderFolderIcons() {
        const displayedFolder = View.getDisplayedFolderId();
        const allFolders = await GlobalNoteFolder.getAllByParentFolderId(displayedFolder);
        const clipboardContent = GlobalNoteFolder.getClipboardContent();

        View.renderFolderIcons(allFolders, clipboardContent);

        if (displayedFolder == 0) {
            View.renderTrashIcon(await GlobalNoteFolder.isTrashEmpty())
        }
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

    static async openContextMenu(event) {
        let clipboardContent = {
            folders: GlobalNoteFolder.getClipboardContent(),
            notes: GlobalNote.getClipboardContent()
        };

        const sourceContainer = View.getSourceElementOfContextMenu(event);
        let isTrashEmpty;
        if (sourceContainer.dataset.folder_id == SF_ID_TRASH) isTrashEmpty = await GlobalNoteFolder.isTrashEmpty();

        View.openContextMenu(event, clipboardContent, isTrashEmpty);
    }

    static setContextMenuPosition(event, contextMenuElement = null) {
        View.setContextMenuPosition(event, contextMenuElement);
    }

    static hideAllContextMenus(durationInMs) {
        View.hideAllContextMenus(durationInMs);
    }

    static closeAllContextMenus() {
        View.closeAllContextMenus();
    }

    static openCreateGlobalItemMenu() {
        View.openCreateGlobalItemMenu();
    }

    static closeCreateGlobalItemMenu() {
        View.closeCreateGlobalItemMenu();
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

    static async moveGlobalNoteToTrash(notesArray) {
        await (new GlobalNote).batchMoveToTrash(notesArray)
    }

    static async restoreGlobalNote(notesArray) {
        const failedRestores = await GlobalNote.batchRestoreTrashedNotes(notesArray);

        if (failedRestores.length != 0) View.openRestoreErrorMessage();
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

    static async batchDeleteGlobalNoteFolders(foldersToDelete) {
        await (new GlobalNoteFolder).batchDelete(foldersToDelete);
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

    static async moveGlobalNoteFolderToTrash(folderArray) {
        await (new GlobalNoteFolder).batchMoveToTrash(folderArray)
    }

    static async restoreGlobalNoteFolder(folderArray) {
        const failedRestores = await GlobalNoteFolder.batchRestoreTrashedFolders(folderArray);

        if (failedRestores.length != 0) View.openRestoreErrorMessage();
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

    static async cutGlobalItem() {
        const selectedElements = View.getAllSelectedElements();

        if (selectedElements.folders.length != 0) {
            GlobalNoteFolder.clearClipboard();
            GlobalNote.clearClipboard();

            GlobalNoteFolder.addToClipboard(selectedElements.folders.map(folder => folder.dataset.folder_id), 'cut');
        }

        if (selectedElements.notes.length != 0) {
            if (selectedElements.folders.length == 0) GlobalNoteFolder.clearClipboard();
            GlobalNote.clearClipboard();

            GlobalNote.addToClipboard(selectedElements.notes.map(note => note.dataset.note_id), 'cut');
        }

        View.markItemAsCut();
        this.closeAllContextMenus();
    }

    static async copyGlobalItem() {
        const selectedElements = View.getAllSelectedElements();

        if (selectedElements.folders.length != 0) {
            GlobalNoteFolder.addToClipboard(selectedElements.folders.map(folder => folder.dataset.folder_id), 'copy');
        }

        if (selectedElements.notes.length != 0) {
            GlobalNote.addToClipboard(selectedElements.notes.map(note => note.dataset.note_id), 'copy');
        }

        this.closeAllContextMenus();
    }

    static async pasteGlobalItem(event) {
        let contextMenuInfo = View.getContextMenuInfo(event);

        if (!contextMenuInfo.folderId) contextMenuInfo.folderId = View.getDisplayedFolderId();

        await GlobalNote.pasteClipboardContent(contextMenuInfo.folderId);
        await GlobalNoteFolder.pasteClipboardContent(contextMenuInfo.folderId);

        GlobalNote.clearClipboard();
        GlobalNoteFolder.clearClipboard();

        this.closeAllContextMenus();
        this.renderGlobalNotesView();
    }

    static async moveGlobalItemToTrash() {
        const selectedElements = View.getAllSelectedElements();
        const selectedFolders = await this.getInstancesFromElements(selectedElements.folders);
        const selectedNotes = await this.getInstancesFromElements(selectedElements.notes);

        if (selectedElements.folders.length != 0) {
            await this.moveGlobalNoteFolderToTrash(selectedFolders);
            this.renderFolderIcons();
            this.closeAllContextMenus();
        }

        if (selectedElements.notes.length != 0) {
            await this.moveGlobalNoteToTrash(selectedNotes);
            View.renderTrashIcon(false);
            this.renderGlobalNoteIcons();
            this.closeAllContextMenus();
        }
    }

    static async deleteGlobalItem(event) {
        const selectedElements = View.getAllSelectedElements();
        const selectedFolders = await this.getInstancesFromElements(selectedElements.folders);
        const selectedNotes = await this.getInstancesFromElements(selectedElements.notes);

        if (selectedElements.folders.length != 0) {
            await this.batchDeleteGlobalNoteFolders(selectedFolders);
            this.renderFolderIcons();
        }

        if (selectedElements.notes.length != 0) {
            await this.batchDeleteGlobalNote(selectedNotes);
            this.renderGlobalNoteIcons();
        }

        this.closeAllContextMenus();
    }

    static async restoreItemsFromTrash() {
        const selectedElements = View.getAllSelectedElements();
        const selectedFolders = await this.getInstancesFromElements(selectedElements.folders);
        const selectedNotes = await this.getInstancesFromElements(selectedElements.notes);

        if (selectedElements.folders.length != 0) {
            await this.restoreGlobalNoteFolder(selectedFolders);
            this.renderFolderIcons();
        }

        if (selectedElements.notes.length != 0) {
            await this.restoreGlobalNote(selectedNotes);
            this.renderGlobalNoteIcons();
        }

        this.closeAllContextMenus();
    }

    static async deleteItemsFromTrash() {
        const selectedElements = View.getAllSelectedElements();
        const selectedFolders = await this.getInstancesFromElements(selectedElements.folders);
        const selectedNotes = await this.getInstancesFromElements(selectedElements.notes);

        if (selectedElements.folders.length != 0) {
            await (new GlobalNoteFolder).batchDelete(selectedFolders);
            this.renderFolderIcons();

            View.toggleNavigationButtons(GlobalNoteFolder.getLatestNavigationStep());
        }

        if (selectedElements.notes.length != 0) {
            await (new GlobalNote).batchDelete(selectedNotes);
            this.renderGlobalNoteIcons();
        }

        this.closeAllContextMenus();
    }

    static async restoreAllTrashContent() {
        let failedFolders = await this.restoreGlobalNoteFolder(await GlobalNoteFolder.getAllByParentFolderId(SF_ID_TRASH));
        let failedNotes = await this.restoreGlobalNote(await GlobalNote.getAllByParentFolderId(SF_ID_TRASH));

        await this.renderGlobalNotesView();
        this.closeAllContextMenus();
    }

    static async deleteAllTrashContent() {
        const trashedItems = await GlobalNoteFolder.getFolderContentRecursively({ id: SF_ID_TRASH }, false);

        await GlobalNoteFolder.deleteAllTrashedFolders(trashedItems.folders);
        await GlobalNote.deleteAllTrashedNotes(trashedItems.notes);

        if (View.getDisplayedFolderId() == SF_ID_TRASH) { this.renderGlobalNotesView() }
        else { View.renderTrashIcon(await GlobalNoteFolder.isTrashEmpty()); }

        this.closeAllContextMenus();
    }

    static closeRestoreErrorMessage() {
        View.closeRestoreErrorMessage();
    };

    ////////////////////////
    // multiple selection //
    ////////////////////////

    static selectMultipleOnMouseDrag(event) {
        globalItemsMultiSelectData.ignoreNextClickEvent = true;

        if (globalItemsMultiSelectData.selectables.length == 0) {
            globalItemsMultiSelectData.selectables = View.getAllSelectableItems();

            View.calculateSelectablePositions();
        }

        this.closeAllContextMenus();
        View.drawSelectionRectangle(event);
        View.markItemsInRectangleSelected(event);
    }

    static selectAll() {
        this.closeAllContextMenus();
        View.selectAll();
    }

    static selectMultipleByTouch(event) {
        return View.selectMultipleByTouch(event);
    }

    static removeAllSelections() {
        View.removeAllSelections();
    }

    static removeSelectionRectangle() {
        View.removeSelectionRectangle()
    }

    static editSelectedItemsKeyboardShortcuts(event) {
        event.preventDefault();
        View.editSelectedItemsKeyboardShortcuts(event);
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

    static async folderExists(folderId) {
        return GlobalNoteFolder.folderExists(folderId);
    }

    static async getInstancesFromElements(elementArray) {
        const instanceArray = [];

        for (const element of elementArray) {
            if (element.dataset.folder_id) {
                instanceArray.push(await GlobalNoteFolder.getById(element.dataset.folder_id))
            }

            if (element.dataset.note_id) {
                instanceArray.push(await GlobalNote.getById(element.dataset.note_id))
            }
        }

        return instanceArray;
    }

    ///////////////////
    // event hanlder //
    ///////////////////

    static clickHandler(event) {
        // prevents selected items from being deselected by the click event after mouse up
        if (globalItemsMultiSelectData.ignoreNextClickEvent) {
            globalItemsMultiSelectData.ignoreNextClickEvent = false;

            return;
        }

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

            //determine, what should be closed or deselected
            switch (true) {
                case (View.isContextMenuOpen() && !target.closest('.globalNoteContextMenu')):
                    View.closeAllContextMenus();
                //dont break!

                case (View.isCreateGlobalItemMenuOpen() && !target.closest('#createglobalItemsButtonContainer')):
                    View.closeCreateGlobalItemMenu();
                    break;

                // keep selection
                case (target.closest('.globalNoteContextMenu') != undefined):
                    break;
                case (event.shiftKey):
                    break;
                case (event.ctrlKey):
                    break;
                case (event.metaKey):
                    break;

                default:
                    this.removeAllSelections();

            }

            switch (target.id) {
                case 'folderBackwardButton':
                    this.navigateFolderHistory('backward');
                    break;

                case 'folderForwardButton':
                    this.navigateFolderHistory('forward');
                    break;

                case 'createGlobalItemButton':
                    this.openCreateGlobalItemMenu();
                    break;

                case 'createGlobalNoteButton':
                    this.createNewGlobalNote();
                    this.closeCreateGlobalItemMenu();
                    this.removeAllSelections();
                    break;

                case 'createGlobalNoteFolderButton':
                    this.createNewGlobalNoteFolder();
                    this.closeCreateGlobalItemMenu();
                    this.removeAllSelections();
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
                    this.moveGlobalItemToTrash(event);
                    break;

                case 'newGlobalNoteButton':
                    this.createNewGlobalNote();
                    this.closeAllContextMenus();
                    break;

                case 'newGlobalNoteFolderButton':
                    this.createNewGlobalNoteFolder();
                    this.closeAllContextMenus();
                    break;

                //trash context menus
                case 'restoreItemButton':
                    this.restoreItemsFromTrash();
                    break;

                case 'deleteItemFromTrashButton':
                    this.deleteItemsFromTrash();
                    break;

                case 'restoreAllTrashButton':
                    this.restoreAllTrashContent();
                    break;

                case 'deleteAllTrashButton':
                    this.deleteAllTrashContent();
                    break;
            }

            switch (true) {
                //open files
                case target.closest('.noteIconContainer') != undefined:
                    if (event.shiftKey || event.ctrlKey || event.metaKey) {
                        event.preventDefault();

                        this.editSelectedItemsKeyboardShortcuts(event);
                        return;
                    }

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

                // open folder
                case target.classList.contains('folderIconContainer'):
                case target.classList.contains('folderIconSolid'):
                case target.classList.contains('trashIcon'):
                case target.classList.contains('trashIconFilled'):
                case target.classList.contains('folderNameWrapper'):
                    if (target.closest('.folderIconContainer').classList.contains('new')) return;
                    if (target.closest('.folderIconContainer').classList.contains('editable')) return;

                    // mark selected instead of opening
                    if (event.shiftKey || event.ctrlKey || event.metaKey) {
                        event.preventDefault();

                        this.editSelectedItemsKeyboardShortcuts(event);
                        return;
                    }

                    // actually open it
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

        if (View.isContextMenuOpen()) GlobalNotesController.closeAllContextMenus();
        GlobalNotesController.openContextMenu(event);
    }

    static handleKeyboardShortcuts(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'c':
                    this.copyGlobalItem();
                    break;

                case 'v':
                    this.pasteGlobalItem(event);
                    break;

                case 'x':
                    this.cutGlobalItem();
                    break;
                
                case 'a':
                    event.preventDefault();
                    this.selectAll();
                break;
            }
        }

        if (event.key == 'Backspace' || event.key == 'Delete') {
            this.moveGlobalItemToTrash();
        }
    }

    // this function only handles cases where the user tries to select items via touch, while an context menu is open
    // normally the context menu would be closed and the item opened, but with touch it should be selected
    // all else is handled via the normal clickHandler
    static handleTouchEvents(event) {
        const target = event.target;
        let selectedItemsCount;

        if (View.isContextMenuOpen()) {
            event.preventDefault();

            switch (true) {
                case target.closest('.folderIconContainer') != undefined:
                    if (target.closest('.folderIconContainer').classList.contains('new')) return;
                    if (target.closest('.folderIconContainer').classList.contains('editable')) return;
                    if ((View.getContextMenuInfo())?.menuType == 'folderClicked') return;
                    
                    selectedItemsCount = this.selectMultipleByTouch(event);

                    if (selectedItemsCount.before < selectedItemsCount.after && selectedItemsCount.before == 1) {
                        this.closeAllContextMenus();
                        this.openContextMenu(event);
                    }

                    if (selectedItemsCount.before > selectedItemsCount.after && selectedItemsCount.after == 1) {
                        this.closeAllContextMenus();
                        this.openContextMenu(event);
                    }

                    this.hideAllContextMenus(750);
                    this.setContextMenuPosition(event);

                    break;

                case target.closest('.noteIconContainer') != undefined:
                    if ((View.getContextMenuInfo())?.menuType == 'folderClicked') return;
                    selectedItemsCount = this.selectMultipleByTouch(event);

                    if (selectedItemsCount.before < selectedItemsCount.after && selectedItemsCount.before == 1) {
                        this.closeAllContextMenus();
                        this.openContextMenu(event);
                    }

                    if (selectedItemsCount.before > selectedItemsCount.after && selectedItemsCount.after == 1) {
                        this.closeAllContextMenus();
                        this.openContextMenu(event);
                    }

                    this.hideAllContextMenus(750);
                    this.setContextMenuPosition(event);

                    break;

                case target.closest('#globalNotesContainer') != undefined:
                    if (View.isContextMenuOpen()) {
                        this.closeAllContextMenus();
                        this.removeAllSelections();
                    }
                    break;
            }


        }
    }
}