import Editor from "../inc/editor.js";

export default class GlobalNotesView {
    static renderGlobalNoteIcons(notesArray) {
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

            fragment.append(currentNoteContainer);
        })

        while (container.childElementCount != 0) {
            container.firstElementChild.remove();
        }

        container.append(fragment);
    }

    static renderFolderIcons(folderArray) {
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
        title.classList.add('folderNameWrapper');
        folderNameDivider.classList.add('folderNameDivider');
        folderNameDivider.textContent = '/';

        folderContainer.append(title);
        folderContainer.append(folderNameDivider);

        allParentFolders.forEach(folder => {
            const currentContainer = folderContainer.cloneNode(true);

            currentContainer.querySelector('.folderNameWrapper').textContent = folder.name;
            currentContainer.dataset.folder_id = folder.id;

            fragment.append(currentContainer);
        })

        while (folderPathContainer.firstElementChild) { folderPathContainer.firstElementChild.remove() }

        folderPathContainer.append(fragment);
    }

    static getDataFromGlobalNoteDialog() {
        const dialog = document.querySelector('#globalNoteDialog');

        return {
            id: dialog.dataset.note_id,
            title: dialog.querySelector('#globalNoteTitleInput').value,
            content: Editor.getContent(dialog.querySelector('#globalNoteContentEditor')),
            parentFolderId: this.getDisplayedFolderId()
        }
    }

    static openGlobalNoteDialog(globalNote = null) {
        const globalNoteEditorDialog = document.querySelector('#globalNoteDialog');
        const globalNoteTitleInput = document.querySelector('#globalNoteTitleInput');
        const globalNoteContentEditor = document.querySelector('#globalNoteContentEditor');

        if (globalNote) {
            globalNoteEditorDialog.dataset.note_id = globalNote.id;
            globalNoteTitleInput.value = globalNote.title;
            globalNoteContentEditor.innerHTML = globalNote.content;
        } else {
            globalNoteEditorDialog.dataset.note_id = '';
            globalNoteTitleInput.value = '';
            globalNoteContentEditor.innerHTML = '<p><br></p>';
        }

        Editor.init(globalNoteContentEditor);
        globalNoteEditorDialog.showModal();
    }

    static closeGlobalNoteDialog() {
        document.querySelector('#globalNoteDialog').close();
    }

    static getDisplayedFolderId() {
        return Number(document.querySelector('#globalNotesFileContainer').dataset.folder_id)
    }

    static getCurrentNavigationStep() {
        return document.querySelector('#folderNavigationButtonContainer').dataset.history_step;
    }

    static createNewGlobalNoteFolder(){
        const folderDisplay = document.querySelector('#folderIconContainer');
        
        const blankDiv = document.createElement('div');
        const textarea = document.createElement('textarea');
        const blankButton = document.createElement('button');
        const blankSpan = document.createElement('span');

        const folderContainer = blankDiv.cloneNode();
        const iconWrapper = blankDiv.cloneNode();
        const folderIcon = blankDiv.cloneNode();
        const buttonContainer = blankDiv.cloneNode();
        const saveButton = blankButton.cloneNode();
        const cancelButton = blankButton.cloneNode();
        const checkIcon = blankSpan.cloneNode()
        const crossIcon = blankSpan.cloneNode()

        folderIcon.classList.add('folderIconSolid', 'fileIcon');
        folderContainer.classList.add('folderIconContainer', 'new');
        buttonContainer.classList.add('flex', 'halfGap');

        textarea.id = 'folderNameInput';
        textarea.placeholder = 'Ordername';

        saveButton.classList.add('confirmationButton');
        cancelButton.classList.add('cancelButton');
        
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

    static alertGlobalNoteTitleInput() {
        let globalNoteDialog = document.querySelector('#globalNoteDialog');
        let alertRing = globalNoteDialog.querySelector('#globalNoteTitleInput').parentElement;

        alertRing.classList.add('validationError');
        setTimeout(() => {
            alertRing.classList.remove('validationError');
        }, 300);
    }
}