import Editor from "../inc/editor.js";
import { globalItemsMultiSelectData, MOBILE_VIEW_WIDTH, SF_ID_TRASH } from "../index.js";

export default class GlobalNotesView {
    static #contextMenus = {
        //folder or a note is right clicked
        itemClicked: [
            {
                action: 'editGlobalItem',
                text: 'bearbeiten'
            },
            {
                action: 'copyGlobalItem',
                text: 'kopieren'
            },
            {
                action: 'cutGlobalItem',
                text: 'ausschneiden'
            },
            {
                action: 'pasteGlobalItem',
                text: 'einfügen'
            },
            {
                action: 'deleteGlobalItem',
                text: 'löschen'
            },
        ],
        //context menu when a blank space is clicked
        folderClicked: [
            {
                action: 'newGlobalNoteFolder',
                text: 'neuer Ordner'
            },
            {
                action: 'newGlobalNote',
                text: 'neue Notiz'
            },
            {
                action: 'pasteGlobalItem',
                text: 'einfügen'
            }
        ],
        multiSelect: [
            {
                action: 'copyGlobalItem',
                text: 'kopieren'
            },
            {
                action: 'cutGlobalItem',
                text: 'ausschneiden'
            },
            {
                action: 'deleteGlobalItem',
                text: 'löschen'
            },
        ],
        // trash
        trashClicked: [
            {
                action: 'restoreAllTrash',
                text: 'wiederherstellen'
            },
            {
                action: 'deleteAllTrash',
                text: 'Papierkorb leeren'
            }
        ],
        trashedItemClicked: [
            {
                action: 'restoreItem',
                text: 'wiederherstellen'
            },
            {
                action: 'copyGlobalItem',
                text: 'kopieren'
            },
            {
                action: 'cutGlobalItem',
                text: 'ausschneiden'
            },
            {
                action: 'deleteItemFromTrash',
                text: 'endgültig löschen'
            }
        ],
        trashedChildItemClicked: [
            {
                action: 'copyGlobalItem',
                text: 'kopieren'
            },
            {
                action: 'cutGlobalItem',
                text: 'ausschneiden'
            },
            {
                action: 'deleteItemFromTrash',
                text: 'endgültig löschen'
            },
        ],
        trashMultiSelect: [
            {
                action: 'restoreItem',
                text: 'wiederherstellen'
            },
            {
                action: 'copyGlobalItem',
                text: 'kopieren'
            },
            {
                action: 'cutGlobalItem',
                text: 'ausschneiden'
            },
            {
                action: 'deleteItemFromTrash',
                text: 'endgültig löschen'
            }
        ]
    }

    static renderGlobalNoteIcons(notesArray, clipboardContent) {
        const container = document.querySelector('#noteIconContainer')
        const fragment = document.createDocumentFragment();
        const blankDiv = document.createElement('div');

        const noteContainer = blankDiv.cloneNode();
        const iconWrapper = blankDiv.cloneNode();
        const noteIcon = blankDiv.cloneNode();

        noteIcon.classList.add('noteIcon', 'fileIcon');

        iconWrapper.append(noteIcon);
        noteContainer.append(iconWrapper);
        noteContainer.classList.add('noteIconContainer');

        notesArray.forEach(globalNote => {
            const currentNoteContainer = noteContainer.cloneNode(true);
            const noteTitle = blankDiv.cloneNode();

            noteTitle.textContent = globalNote.title;
            noteTitle.classList.add('fileNameWrapper');

            currentNoteContainer.append(noteTitle);
            currentNoteContainer.setAttribute('tabindex', 0);
            currentNoteContainer.dataset.note_id = globalNote.id;
            currentNoteContainer.dataset.created = globalNote.created;

            if (globalNote.parentIdBeforeDelete !== null) currentNoteContainer.dataset.parent_id_before_delete = globalNote.parentIdBeforeDelete;

            if (clipboardContent[globalNote.id]) {
                if (clipboardContent[globalNote.id].operationType == 'cut') currentNoteContainer.classList.add('cut');
            }

            fragment.append(currentNoteContainer);
        })

        while (container.childElementCount != 0) {
            container.firstElementChild.remove();
        }

        container.append(fragment);
    }

    static renderFolderIcons(folderArray, clipboardContent) {
        const container = document.querySelector('#folderIconContainer')
        const fragment = document.createDocumentFragment();
        const blankDiv = document.createElement('div');

        const folderContainer = blankDiv.cloneNode();
        const iconWrapper = blankDiv.cloneNode();
        const folderIcon = blankDiv.cloneNode();

        folderIcon.classList.add('folderIconSolid', 'fileIcon');

        iconWrapper.append(folderIcon);
        folderContainer.append(iconWrapper);
        folderContainer.classList.add('folderIconContainer');

        folderArray.forEach(folder => {
            const currentFolderContainer = folderContainer.cloneNode(true);
            const folderName = blankDiv.cloneNode();

            folderName.textContent = folder.name;
            folderName.classList.add('folderNameWrapper');

            currentFolderContainer.append(folderName);
            currentFolderContainer.setAttribute('tabindex', 0);
            currentFolderContainer.dataset.folder_id = folder.id;
            currentFolderContainer.dataset.created = folder.created;

            if (folder.parentIdBeforeDelete !== null) currentFolderContainer.dataset.parent_id_before_delete = folder.parentIdBeforeDelete;

            if (clipboardContent[folder.id]) {
                if (clipboardContent[folder.id].operationType == 'cut') currentFolderContainer.classList.add('cut');
            }

            fragment.append(currentFolderContainer);
        })

        while (container.childElementCount != 0) {
            container.firstElementChild.remove();
        }

        container.append(fragment);
    }

    static renderTrashIcon(isEmpty = true) {
        const trashIcon = document.querySelector('.folderIconContainer[data-folder_id="1"]')?.querySelector('.fileIcon');
        if (!trashIcon) return;

        trashIcon.classList.remove('folderIconSolid');
        trashIcon.classList.remove('trashIcon');
        trashIcon.classList.remove('trashIconFilled');

        if (isEmpty) trashIcon.classList.add('trashIcon');
        if (!isEmpty) trashIcon.classList.add('trashIconFilled');
    }

    static renderFolderPath(allParentFolders) {
        const folderPathContainer = document.querySelector('#folderPathContainer');
        const fragment = document.createDocumentFragment();
        const blankDiv = document.createElement('div');

        const folderContainer = blankDiv.cloneNode();
        const title = blankDiv.cloneNode();
        const folderNameDivider = blankDiv.cloneNode();

        folderContainer.classList.add('folderPathItemContainer');
        title.classList.add('folderNameWrapperOnPath');
        folderNameDivider.classList.add('folderNameDivider');
        folderNameDivider.textContent = '/';

        folderContainer.append(title);
        folderContainer.append(folderNameDivider);

        allParentFolders.forEach(folder => {
            const currentContainer = folderContainer.cloneNode(true);

            currentContainer.querySelector('.folderNameWrapperOnPath').textContent = folder.name;
            currentContainer.dataset.folder_id = folder.id;

            fragment.append(currentContainer);
        })

        while (folderPathContainer.firstElementChild) { folderPathContainer.firstElementChild.remove() }

        folderPathContainer.append(fragment);
    }

    static openGlobalNoteDialog(globalNote = null) {
        const globalNoteEditorDialog = document.querySelector('#globalNoteDialog');
        const globalNoteTitleInput = document.querySelector('#globalNoteTitleInput');
        const globalNoteContentEditor = document.querySelector('#globalNoteContentEditor');

        if (globalNote) {
            globalNoteEditorDialog.dataset.note_id = globalNote.id;
            globalNoteEditorDialog.dataset.created = globalNote.created;
            globalNoteTitleInput.value = globalNote.title;
            globalNoteContentEditor.innerHTML = globalNote.content;
        } else {
            globalNoteEditorDialog.dataset.note_id = '';
            globalNoteEditorDialog.dataset.created = '';
            globalNoteTitleInput.value = '';
            globalNoteContentEditor.innerHTML = '<p><br></p>';

        }

        Editor.init(globalNoteContentEditor);
        globalNoteEditorDialog.showModal();
        if (!globalNote) globalNoteTitleInput.focus();
    }

    static closeGlobalNoteDialog() {
        document.querySelector('#globalNoteDialog').close();
    }

    static updateGlobalNoteDialog(globalNote) {
        const dialog = document.querySelector('#globalNoteDialog');

        dialog.dataset.note_id = globalNote.id;
        dialog.dataset.created = globalNote.created;
    }

    static getDataFromGlobalNoteDialog() {
        const dialog = document.querySelector('#globalNoteDialog');

        return {
            id: dialog.dataset.note_id,
            title: dialog.querySelector('#globalNoteTitleInput').value,
            content: Editor.getContent(dialog.querySelector('#globalNoteContentEditor')),
            parentFolderId: this.getDisplayedFolderId(),
            created: dialog.dataset.created
        }
    }

    static openContextMenu(event, clipboardContent, isTrashEmpty = true) {
        const globalNotesContainer = document.querySelector('#globalNotesContainer');
        const navHeight = document.querySelector('nav').getBoundingClientRect().height;
        const bodyMargin = Number(window.getComputedStyle(document.querySelector('body')).margin[0]);

        const offsetY = navHeight + bodyMargin;
        const offsetX = bodyMargin;

        const sourceElement = this.getSourceElementOfContextMenu(event);

        if (sourceElement.classList.contains('new')) return;
        if (sourceElement.classList.contains('cut')) return;
        if (!sourceElement.classList.contains('selected')) {
            this.removeAllSelections();
        }

        const menuData = this.getMenuToRender(sourceElement);

        // create the menu element
        const blankDiv = document.createElement('div');
        const blankButton = document.createElement('button');

        const menuContainer = blankDiv.cloneNode()
        menuContainer.classList.add('globalNoteContextMenu');
        menuContainer.dataset.menu_type = menuData.menuType;

        // set initial position on screen
        if (window.innerWidth > MOBILE_VIEW_WIDTH) {
            menuContainer.style.top = (event.pageY ?? event.changedTouches[0].pageY) - offsetY + 'px';
            menuContainer.style.left = (event.pageX ?? event.changedTouches[0].pageX) - offsetX + 'px';

            if (event.pointerType == 'touch') {
                menuContainer.style.transform = 'translate(-100%, -100%)';
            }
        }

        // set source element infos
        if (sourceElement.classList.contains('folderIconContainer')) menuContainer.dataset.folder_id = sourceElement.dataset.folder_id;
        if (sourceElement.classList.contains('noteIconContainer')) menuContainer.dataset.note_id = sourceElement.dataset.note_id;
        if (sourceElement.id == 'globalNotesFileContainer') menuContainer.dataset.folder_id = sourceElement.dataset.folder_id;

        sourceElement.classList.add('selected');

        menuData.menuToRender.forEach(item => {
            const currentItem = blankDiv.cloneNode();
            const currentButton = blankButton.cloneNode();

            currentButton.classList.add('contextMenuButton');
            currentButton.textContent = item.text;
            currentButton.id = `${item.action}Button`;

            if (item.action == 'pasteGlobalItem') {
                if ((Object.keys(clipboardContent.folders).length == 0 && Object.keys(clipboardContent.notes).length == 0)) currentButton.disabled = true
            };

            menuContainer.append(currentButton);
        })

        if (sourceElement.dataset.folder_id == 1 && isTrashEmpty) {
            menuContainer.querySelectorAll('button').forEach(button => button.disabled = true);
        }

        globalNotesContainer.append(menuContainer);

        const menuContainerProps = menuContainer.getBoundingClientRect();
        const notesContainerProps = globalNotesContainer.getBoundingClientRect();

        if (window.innerWidth > MOBILE_VIEW_WIDTH) {
            // reset pos, if menu extends off screen
            let translateX = '0%';
            let translateY = '0%';

            if (event.type == 'touchstart' || event.type == 'touchend') {
                translateX = '-100%';
                translateY = '-100%';
            }

            if (menuContainerProps.right > notesContainerProps.right) translateX = '-100%';
            if (menuContainerProps.left < notesContainerProps.left) translateX = '0%';
            if (menuContainerProps.top < notesContainerProps.top) translateY = '0%';
            if (menuContainerProps.bottom > notesContainerProps.bottom) translateY = '-100%';

            menuContainer.style.transform = `translate(${translateX}, ${translateY})`;
        }

        // prevent context menu from covering items on mobile
        if (window.innerWidth < MOBILE_VIEW_WIDTH) {
            globalNotesContainer.style.height = `${menuContainerProps.height + notesContainerProps.height}px`;
        }
    }

    static getMenuToRender(sourceElement) {
        let menuData = {
            menuType: 'itemClicked',
            menuToRender: this.#contextMenus.itemClicked
        };

        if (sourceElement.id == 'globalNotesFileContainer') {
            menuData.menuToRender = this.#contextMenus.folderClicked;
            menuData.menuType = 'folderClicked';
        }

        if (sourceElement.dataset.folder_id == SF_ID_TRASH) {
            menuData.menuToRender = this.#contextMenus.trashClicked;
            menuData.menuType = 'trashClicked';

        }
        if (globalNotesContainer.querySelectorAll('.selected').length > 1) {
            menuData.menuToRender = this.#contextMenus.multiSelect
            menuData.menuType = 'multiClicked';
        };

        if (this.isInTrash()) {
            if (sourceElement.dataset.parent_id_before_delete) {
                menuData.menuToRender = this.#contextMenus.trashedItemClicked;
                menuData.menuType = 'trashedItemClicked';

            }
            if (sourceElement.dataset.folder_id != SF_ID_TRASH && !sourceElement.dataset.parent_id_before_delete) {
                menuData.menuToRender = this.#contextMenus.trashedChildItemClicked;
                menuData.menuType = 'trashedChildItemClicked';

            }
            if (globalNotesContainer.querySelectorAll('.selected').length > 1) {
                menuData.menuToRender = this.#contextMenus.trashMultiSelect;
                menuData.menuType = 'trashMultiSelect';
            }
        }

        return menuData;
    }

    static getContextMenuInfo() {
        const openContextMenu = document.querySelector('.globalNoteContextMenu');

        return {
            menuType: openContextMenu?.dataset.menu_type,
            fileType: openContextMenu?.dataset.folder_id ? 'folder' : 'note',
            folderId: Number(openContextMenu?.dataset.folder_id),
            noteId: Number(openContextMenu?.dataset.note_id)
        }
    }

    static closeAllContextMenus() {
        const globalNotesContainer = document.querySelector('#globalNotesContainer');

        globalNotesContainer.querySelector('#globalNotesFileContainer').classList.remove('selected');
        globalNotesContainer.style.height = '';

        while (globalNotesContainer.querySelector('.globalNoteContextMenu')) globalNotesContainer.querySelector('.globalNoteContextMenu').remove();
    }

    static openCreateGlobalItemMenu() {
        document.querySelector('#createGlobalItemsButtonContainer').classList.add('open');
    }

    static closeCreateGlobalItemMenu() {
        document.querySelector('#createGlobalItemsButtonContainer').classList.remove('open');
    }

    ////////////////////
    // folder methods //
    ////////////////////

    static getDisplayedFolderId() {
        return Number(document.querySelector('#globalNotesFileContainer').dataset.folder_id)
    }

    static getFolderDataFromForm(event) {
        const folderContainer = event.target.closest('.folderIconContainer');

        return {
            id: folderContainer.dataset.folder_id,
            name: folderContainer.querySelector('.folderNameInput').value,
            created: folderContainer.dataset.created,
            parentFolderId: this.getDisplayedFolderId()
        }
    }

    static createNewGlobalNoteFolder() {
        const folderDisplay = document.querySelector('#folderIconContainer');

        const blankDiv = document.createElement('div');
        const textarea = document.createElement('textarea');
        const blankButton = document.createElement('button');
        const blankSpan = document.createElement('span');

        const folderContainer = blankDiv.cloneNode();
        const iconWrapper = blankDiv.cloneNode();
        const folderIcon = blankDiv.cloneNode();
        const textareaWrapper = blankDiv.cloneNode();
        const buttonContainer = blankDiv.cloneNode();
        const saveButton = blankButton.cloneNode();
        const cancelButton = blankButton.cloneNode();
        const checkIcon = blankSpan.cloneNode()
        const crossIcon = blankSpan.cloneNode()

        folderIcon.classList.add('folderIconSolid', 'fileIcon');
        folderContainer.classList.add('folderIconContainer', 'new');
        buttonContainer.classList.add('flex', 'halfGap');

        textarea.placeholder = 'Ordername';
        textarea.classList.add('folderNameInput');
        textarea.classList.add('alertRing');

        saveButton.classList.add('confirmationButton', 'saveNewFolderButton');
        cancelButton.classList.add('cancelButton', 'cancelNewFolderButton');

        checkIcon.classList.add('icon', 'checkIcon');
        crossIcon.classList.add('icon', 'crossIcon');

        saveButton.append(checkIcon);
        cancelButton.append(crossIcon);
        buttonContainer.append(saveButton);
        buttonContainer.append(cancelButton);

        iconWrapper.append(folderIcon);

        folderContainer.append(iconWrapper);
        folderContainer.append(textarea);
        folderContainer.append(buttonContainer);

        folderDisplay.append(folderContainer);
        textarea.focus();
    }

    static cancelGlobalNotesFolderCreation(event) {
        event.target.closest('.folderIconContainer').remove();
    }

    static getCurrentNavigationStep() {
        return document.querySelector('#folderNavigationButtonContainer').dataset.history_step;
    }

    static makeFolderEditable(folderId) {
        const folderIconContainer = document.querySelector(`.folderIconContainer[data-folder_id="${folderId}"]`);
        const folderNameWrapper = folderIconContainer.querySelector('.folderNameWrapper');

        const textarea = document.createElement('textarea');
        const blankButton = document.createElement('button');
        const blankSpan = document.createElement('span');

        const buttonContainer = document.createElement('div');
        const saveButton = blankButton.cloneNode();
        const cancelButton = blankButton.cloneNode();
        const checkIcon = blankSpan.cloneNode()
        const crossIcon = blankSpan.cloneNode()

        textarea.classList.add('folderNameInput');
        textarea.value = folderNameWrapper.textContent;
        textarea.classList.add('alertRing');

        folderIconContainer.classList.add('editable');
        buttonContainer.classList.add('flex', 'halfGap');

        saveButton.classList.add('confirmationButton', 'saveFolderEditButton');
        cancelButton.classList.add('cancelButton', 'cancelFolderEditButton');

        checkIcon.classList.add('icon', 'checkIcon');
        crossIcon.classList.add('icon', 'crossIcon');

        saveButton.append(checkIcon);
        cancelButton.append(crossIcon);
        buttonContainer.append(saveButton);
        buttonContainer.append(cancelButton);

        folderIconContainer.append(textarea);
        folderIconContainer.append(buttonContainer);

        folderNameWrapper.classList.add('notDisplayed');
    }

    static removeFolderEditability(event) {
        const folderIconContainer = event.target.closest('.folderIconContainer');
        const buttonContainer = event.target.parentElement;
        const folderNameWrapper = folderIconContainer.querySelector('.folderNameWrapper');
        const textarea = folderIconContainer.querySelector('textarea');

        if (event.target.classList.contains('saveFolderEditButton')) {
            folderNameWrapper.textContent = textarea.value;
        }

        folderIconContainer.classList.remove('editable');
        folderNameWrapper.classList.remove('notDisplayed');
        textarea.remove();
        buttonContainer.remove();
    }

    ////////////////////
    // item selection //
    ////////////////////

    static drawSelectionRectangle(event) {
        const globalNotesContainer = document.querySelector('#globalNotesContainer');

        let selectionRect = globalNotesContainer.querySelector('#selectionRectangle');
        let startX = globalItemsMultiSelectData.startX;
        let startY = globalItemsMultiSelectData.startY;
        let currentX = event.clientX;
        let currentY = event.clientY;
        let translateX = '0';
        let translateY = '0';

        if (startX > currentX) translateX = '-100%';
        if (startY > currentY) translateY = '-100%';

        let rectWidth = Math.abs(startX - currentX);
        let rectHeight = Math.abs(startY - currentY);

        if (!selectionRect) {
            selectionRect = document.createElement('div');
            selectionRect.id = 'selectionRectangle';
        }

        selectionRect.style.top = `${startY}px`;
        selectionRect.style.left = `${startX}px`;
        selectionRect.style.width = `${rectWidth}px`;
        selectionRect.style.height = `${rectHeight}px`;
        selectionRect.style.transform = `translate(${translateX}, ${translateY})`;

        globalNotesContainer.append(selectionRect);
    }

    static getAllSelectableItems() {
        const fileContainer = document.querySelector('#globalNotesFileSystemDisplay');

        const allFolders = fileContainer.querySelectorAll('.folderIconContainer');
        const allNotes = fileContainer.querySelectorAll('.noteIconContainer');

        return Array.from(allFolders).concat(Array.from(allNotes));
    }

    static calculateSelectablePositions() {
        globalItemsMultiSelectData.selectables.forEach((item, index) => {
            const props = item.getBoundingClientRect();

            globalItemsMultiSelectData.selecatablesPos[index] = {
                x1: props.x,
                y1: props.y,
                x2: props.x + props.width,
                y2: props.y + props.height
            }
        })

    }

    static markItemsInRectangleSelected() {
        const selectionRectElem = document.querySelector('#selectionRectangle');

        if (!selectionRectElem) return;

        const selectionRectProps = selectionRectElem.getBoundingClientRect();
        const selectionRect = {
            x1: selectionRectProps.x,
            x2: selectionRectProps.x + selectionRectProps.width,
            y1: selectionRectProps.y,
            y2: selectionRectProps.y + selectionRectProps.height
        }

        Object.keys(globalItemsMultiSelectData.selecatablesPos).forEach(k => {
            const itemPos = globalItemsMultiSelectData.selecatablesPos[k];
            globalItemsMultiSelectData.selectables[k].classList.remove('selected');

            if (
                selectionRect.x1 <= itemPos.x2 && selectionRect.x2 >= itemPos.x1 &&
                selectionRect.y1 <= itemPos.y2 && selectionRect.y2 >= itemPos.y1
            ) {
                if (globalItemsMultiSelectData.selectables[k].dataset.folder_id == SF_ID_TRASH) return;

                globalItemsMultiSelectData.selectables[k].classList.add('selected');
            }
        })
    }

    static selectMultipleByTouch(event) {
        const srcElement = event.target.closest('.folderIconContainer') ?? event.target.closest('.noteIconContainer');
        const allSelectedItems = this.getAllSelectedElements(true);
        const contextMenuInfo = this.getContextMenuInfo();
        const selectedItemsCount = {
            before: allSelectedItems.length,
            after: allSelectedItems.length
        };

        if (srcElement.dataset.folder_id == SF_ID_TRASH) return selectedItemsCount;
        if (contextMenuInfo.menuType == 'trashClicked') return selectedItemsCount;

        if (srcElement.classList.contains('selected') && allSelectedItems.length > 1) {
            srcElement.classList.remove('selected');
            selectedItemsCount.after = selectedItemsCount.before--;

            return selectedItemsCount;
        }

        srcElement.classList.add('selected');
        selectedItemsCount.after = selectedItemsCount.before++;

        return selectedItemsCount;
    }

    static editSelectedItemsKeyboardShortcuts(event) {
        const srcElement = event.target.closest('.folderIconContainer') ?? event.target.closest('.noteIconContainer');

        // ctrl and meta key selection
        if (event.metaKey || event.ctrlKey) {
            if (srcElement.classList.contains('selected')) {
                srcElement.classList.remove('selected');

                return;
            }

            srcElement.classList.add('selected');
        }

        // shift key selection
        if (event.shiftKey) {
            let allItems = this.getAllSelectableItems();
            let allSelectedItems = this.getAllSelectedElements(true);

            if (allSelectedItems.length == 0) {
                srcElement.classList.add('selected');

                return;
            }

            //add multiple items to selection
            //new item sits before first one
            if (srcElement.compareDocumentPosition(allSelectedItems[0]) == Node.DOCUMENT_POSITION_FOLLOWING) {
                const indexSrcElement = allItems.indexOf(srcElement);
                const indexLastElement = allItems.indexOf(allSelectedItems[allSelectedItems.length - 1]);

                for (let i = indexSrcElement; i <= indexLastElement; i++) {
                    if (allItems[i].dataset.folder_id == SF_ID_TRASH) continue;
                    allItems[i].classList.add('selected');
                }

                return;
            }

            //new item sits after last one
            if (srcElement.compareDocumentPosition(allSelectedItems[allSelectedItems.length - 1]) == Node.DOCUMENT_POSITION_PRECEDING) {
                const indexSrcElement = allItems.indexOf(srcElement);
                const indexFirstElement = allItems.indexOf(allSelectedItems[0]);

                for (let i = indexFirstElement; i <= indexSrcElement; i++) {
                    if (allItems[i].dataset.folder_id == SF_ID_TRASH) continue;
                    allItems[i].classList.add('selected');
                }

                return;
            }

            //remove multiple items from selection
            //the lower difference decides where to shave off

            const indexSrcElement = allItems.indexOf(srcElement);
            const indexFirstElement = allItems.indexOf(allSelectedItems[0]);
            const indexLastElement = allItems.indexOf(allSelectedItems[allSelectedItems.length - 1]);

            const source = indexSrcElement + 1;
            const first = indexFirstElement + 1;
            const last = indexLastElement + 1;

            let diffCutStart = source - first;
            let diffCutEnd = last - source;

            if (diffCutEnd <= diffCutStart) {
                for (let i = indexSrcElement + 1; i <= indexLastElement; i++) {
                    allItems[i].classList.remove('selected');
                }
            } else {
                for (let i = indexFirstElement; i < indexSrcElement; i++) {
                    allItems[i].classList.remove('selected');
                }
            }
        }
    }

    static removeAllSelections() {
        const globalNotesContainer = document.querySelector('#globalNotesContainer');
        globalNotesContainer.querySelectorAll('.selected').forEach(item => item.classList.remove('selected'));
    }

    static removeSelectionRectangle(event) {
        document.querySelector('#selectionRectangle')?.remove();
    }

    //////////
    // misc //
    //////////

    static markItemAsCut() {
        const globalNotesContainer = document.querySelector('#globalNotesContainer');
        globalNotesContainer.querySelectorAll('.cut').forEach(item => item.classList.remove('cut'));
        globalNotesContainer.querySelectorAll('.selected').forEach(item => item.classList.add('cut'));
    }

    static getSourceElementOfContextMenu(event) {
        if (event.srcElement.closest('.folderIconContainer')) return event.srcElement.closest('.folderIconContainer');
        if (event.srcElement.closest('.noteIconContainer')) return event.srcElement.closest('.noteIconContainer');

        return document.querySelector('#globalNotesFileContainer');
    }

    static isInTrash() {
        const pathItems = document.querySelectorAll('.folderPathItemContainer');

        const trashFound = Array.from(pathItems).find(elem => elem.dataset.folder_id == SF_ID_TRASH);

        if (trashFound) return true;

        return false;
    }

    static isContextMenuOpen() {
        return document.querySelector('.globalNoteContextMenu') ? true : false;
    }

    static isCreateGlobalItemMenuOpen() {
        return document.querySelector('#createGlobalItemsButtonContainer').classList.contains('open') ? true : false;
    }

    static isItemSelected() {
        return this.getAllSelectedElements(true).length > 0 ? true : false;
    }

    static isMultiSelected() {
        return this.getAllSelectedElements(true).length > 1 ? true : false;
    }

    static getAllSelectedElements(mergeToSingleArray = false) {
        const foldersContainer = document.querySelector('#folderIconContainer');
        const notesContainer = document.querySelector('#noteIconContainer');

        if (mergeToSingleArray) {
            return Array.from(foldersContainer.querySelectorAll('.selected')).concat(Array.from(notesContainer.querySelectorAll('.selected')));
        }

        return {
            folders: Array.from(foldersContainer.querySelectorAll('.selected')),
            notes: Array.from(notesContainer.querySelectorAll('.selected'))
        };
    }

    /////////////
    // buttons //
    /////////////

    static toggleSaveDayNoteButton(activate = false) {
        const saveGlobalNoteButton = document.querySelector('#saveGlobalNoteButton');

        if (activate) {
            saveGlobalNoteButton.disabled = false;
        } else {
            saveGlobalNoteButton.disabled = true;
        }
    }

    static toggleNavigationButtons(navigationData) {
        const buttonContainer = document.querySelector('#folderNavigationButtonContainer');
        const backwardButton = document.querySelector('#folderBackwardButton');
        const forwardButton = document.querySelector('#folderForwardButton');

        buttonContainer.dataset.history_step = navigationData.step;
        backwardButton.disabled = true;
        forwardButton.disabled = true;

        if (navigationData.previousStepAvailable) backwardButton.disabled = false;
        if (navigationData.nextStepAvailable) forwardButton.disabled = false;
    }

    static toggleGlobalItemCreationButtons(activate = true) {
        const buttonContainer = document.querySelector('#createGlobalItemsButtonContainer');
        const createGlobalItemButton = buttonContainer.querySelector('#createGlobalItemButton');
        const createNoteButton = buttonContainer.querySelector('#createGlobalNoteButton');
        const createFolderButton = buttonContainer.querySelector('#createGlobalNoteFolderButton');

        if (!activate) {
            createGlobalItemButton.disabled = true;
            createNoteButton.disabled = true;
            createFolderButton.disabled = true;

            return;
        }

        createGlobalItemButton.disabled = false;
        createNoteButton.disabled = false;
        createFolderButton.disabled = false;
    }

    static showGlobalNoteSavedMessage() {
        const message = document.querySelector('#globalNoteSavedMessage');
        message.classList.add('active');
        setTimeout(() => {
            message.classList.remove('active');
        }, 2000);
    }

    static alertGlobalNoteTitleInput() {
        let globalNoteDialog = document.querySelector('#globalNoteDialog');
        let alertRing = globalNoteDialog.querySelector('#globalNoteTitleInput').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }

    static alertFolderNameInput(event) {
        const folderIconContainer = event.target.closest('.folderIconContainer');
        const alertRing = folderIconContainer.querySelector('.folderNameInput');

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
            alertRing.focus();
        }, 300);
    }

    static openRestoreErrorMessage() {
        const errorDialog = document.querySelector('#errorMessageDialog');
        const errorDisplay = errorDialog.querySelector('.dialogText');

        let errorMessage = '<p>Die Wiederherstellung ist fehlgeschlagen. Der Ursprungsordner eines Elements existiert nicht mehr.</p><p>Schneide das Element aus und füge es an einem Ort deiner Wahl ein, um es aus dem Papierkorb zu entfernen.</p>'

        if (errorDialog.hasAttribute('open')) {
            errorMessage = '<p>Die Wiederherstellung ist fehlgeschlagen. Der Ursprungsordner mehrerer Elemente existiert nicht mehr.</p><p>Schneide die Elemente aus und füge sie an einem Ort deiner Wahl ein, um sie aus dem Papierkorb zu entfernen.</p>'
        }

        errorDisplay.innerHTML = errorMessage;
        errorDialog.showModal()
    }

    static closeRestoreErrorMessage() {
        const errorDialog = document.querySelector('#errorMessageDialog');
        const errorDisplay = errorDialog.querySelector('.dialogText');

        errorDialog.close();
        errorDisplay.innerHTML = '';
    }
}