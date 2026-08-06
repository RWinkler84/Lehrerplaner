import Editor from "../inc/editor.js";

export default class GlobalNotesView {
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

    static openContextMenu(event, clipboardContent) {
        //folder or a note is right clicked
        const itemClickedMenu = [
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
        ]

        //context menu when a blank space is clicked
        const folderClickedMenu = [
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
        ];

        let menuToRender = itemClickedMenu;

        const globalNotesContainer = document.querySelector('#globalNotesContainer');
        const navHeight = document.querySelector('nav').getBoundingClientRect().height;
        const bodyMargin = Number(window.getComputedStyle(document.querySelector('body')).margin[0]);

        const offsetY = navHeight + bodyMargin;
        const offsetX = bodyMargin;

        const sourceContainer = this.getSourceContainerOfContextMenu(event);

        if (sourceContainer.classList.contains('new')) return;
        if (sourceContainer.classList.contains('cut')) return;
        if (sourceContainer.id == 'globalNotesFileContainer') menuToRender = folderClickedMenu;


        const blankDiv = document.createElement('div');
        const blankButton = document.createElement('button');

        const menuContainer = blankDiv.cloneNode()
        menuContainer.classList.add('globalNoteContextMenu');
        menuContainer.style.top = event.y - offsetY + 'px';
        menuContainer.style.left = event.x - offsetX + 'px';

        if (sourceContainer.classList.contains('folderIconContainer')) menuContainer.dataset.folder_id = sourceContainer.dataset.folder_id;
        if (sourceContainer.classList.contains('noteIconContainer')) menuContainer.dataset.note_id = sourceContainer.dataset.note_id;
        if (sourceContainer.id == 'globalNotesFileContainer') menuContainer.dataset.folder_id = sourceContainer.dataset.folder_id;

        sourceContainer.classList.add('selected');

        menuToRender.forEach(item => {
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

        globalNotesContainer.append(menuContainer);
    }

    static getContextMenuInfo(event) {
        const clickedContextMenu = event.target.closest('.globalNoteContextMenu');

        return {
            fileType: clickedContextMenu.dataset.folder_id ? 'folder' : 'note',
            folderId: Number(clickedContextMenu.dataset.folder_id),
            noteId: Number(clickedContextMenu.dataset.note_id)
        }
    }

    static closeAllContextMenus() {
        while (document.querySelector('.globalNoteContextMenu')) document.querySelector('.globalNoteContextMenu').remove();

        document.querySelectorAll('.selected').forEach(item => item.classList.remove('selected'));
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

    //////////
    // misc //
    //////////

    static markItemAsCut() {
        const globalNotesContainer = document.querySelector('#globalNotesContainer');
        globalNotesContainer.querySelectorAll('.cut').forEach(item => item.classList.remove('cut'));
        globalNotesContainer.querySelectorAll('.selected').forEach(item => item.classList.add('cut'));
    }

    static getSourceContainerOfContextMenu(event) {
        if (event.srcElement.closest('.folderIconContainer')) return event.srcElement.closest('.folderIconContainer');
        if (event.srcElement.closest('.noteIconContainer')) return event.srcElement.closest('.noteIconContainer');

        return document.querySelector('#globalNotesFileContainer');
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
}