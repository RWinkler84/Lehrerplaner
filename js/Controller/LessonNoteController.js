import LessonNote from "../Model/LessonNote.js";
import LessonNoteView from "../View/LessonNoteView.js";
import LessonController from "./LessonController.js";

export default class LessonNoteController {
    static async renderLessonNote(event) {
        let lessonData = LessonController.getLessonDataFromElement(event);
        let note = await this.getLessonNoteForLesson(lessonData.date, lessonData.timeslot, lessonData.className, lessonData.subject);
        
        LessonNoteView.renderLessonNotesModal(note, lessonData);
        if (note) LessonNote.trackLessonNoteChanges(note.content);
    }

    static async getAllLessonNotes() {
        return await LessonNote.getAllLessonNotes();
    }

    static async getAllLessonNotesInTimeRange(startDate, endDate) {
        return await LessonNote.getAllNotesInTimeRange(startDate, endDate);
    }

    static async getLessonNoteForLesson(date, timeslot, className, subject) {
        return await LessonNote.getLessonNoteForLesson(date, timeslot, className, subject);
    }

    static async getLessonNoteById(id) {
        return await LessonNote.getById(id);
    }

    static async saveLessonNote() {
        let noteData = LessonNoteView.getNoteDataFromForm();

        if (noteData.content.trim() == '<p><br></p>' && noteData.id) {
            LessonNoteController.deleteLessonNote(noteData.id);
            LessonNoteView.removeIdAndCreatedFromLessonNoteDialog();
            return;
        } 
        
        if (noteData.id) {
            LessonNoteController.updateLessonNote(noteData);
            return;
        }

        let note = LessonNote.writeDataToInstance(noteData);

        await note.save();
        LessonNoteView.updateLessonNoteDialog(note);
        LessonNoteView.toggleSaveLessonNoteButton(false);
        LessonNoteView.showLessonNoteSavedMessage()
        LessonController.renderLesson();
    }

    static async updateLessonNote(noteData) {
        let note = await LessonNote.getById(noteData.id);

        note = LessonNote.writeDataToInstance(noteData, note);

        note.update();
        LessonNoteView.toggleSaveLessonNoteButton(false);
        LessonNoteView.showLessonNoteSavedMessage()
    }

    static async deleteLessonNote(id) {
        let note = await LessonNote.getById(id);

        note.delete();
    }

    static changeNoteVersion(action) {
        let displayedVersion = LessonNoteView.getDisplayedNoteVersion();
        let versionToDisplay = null;

        if (action == 'revert') versionToDisplay = LessonNote.getPreviousChange(displayedVersion);
        if (action == 'redo') versionToDisplay = LessonNote.getNextChange(displayedVersion);

        if (!versionToDisplay) return;

        LessonNoteView.updateEditorContent(versionToDisplay.content);
        LessonNoteView.setDisplayedNoteVersion(versionToDisplay.version);
    }

    static normalizeInput() {
        LessonNoteView.normalizeInput();
        LessonNoteView.toggleSaveLessonNoteButton(true);
    }

    static trackLessonNoteChanges(forceVersionBackup = false) {

        const editor = document.querySelector('#noteContentEditor');
        let currentContent = LessonNoteView.serializeNodeContent(editor, true);
        let version = LessonNote.trackLessonNoteChanges(currentContent);
        LessonNoteView.setDisplayedNoteVersion(version);
    }

    static updateButtonStatus() {
        LessonNoteView.updateButtonStatus();
    }

    static handleClickEvents(event) {
        const clickedElement = event.target;

        switch (clickedElement.id) {
            case 'noteContentEditor':
                LessonNoteView.removePlaceholderText();
                break;
            case 'closeLessonNotesButton':
                LessonNoteView.closeLessonNotesDialog();
                LessonNote.clearLessonNoteChanges();
                break;
            case 'saveLessonNotesButton':
                LessonNoteController.saveLessonNote();
                break;

            // editor styling buttons
            case 'boldButton':
                LessonNoteView.toggleBoldText(event);
                LessonNoteController.trackLessonNoteChanges(true);
                break;
            case 'unorderedListButton':
                LessonNoteView.toggleList('ul');
                LessonNoteController.trackLessonNoteChanges(true);
                break;
            case 'orderedListButton':
                LessonNoteView.toggleList('ol');
                LessonNoteController.trackLessonNoteChanges(true);
                break;

            //change edit version forward/backward
            case 'revertChangeButton':
                LessonNoteController.changeNoteVersion('revert');
                break;
            case 'redoChangeButton':
                LessonNoteController.changeNoteVersion('redo');
                break;
        }

        switch (true) {
            case clickedElement.classList.contains('placeholder'):
                LessonNoteView.removePlaceholderText();
                break;
            case clickedElement.classList.contains('ulIcon'):
                LessonNoteView.toggleList('ul');
                LessonNoteController.trackLessonNoteChanges(true);
                break;
            case clickedElement.classList.contains('olIcon'):
                LessonNoteView.toggleList('ol');
                LessonNoteController.trackLessonNoteChanges(true);
                break;
        }
    }

    static handleKeyDownEvents(event) {
        const key = event.code;

        switch (key) {
            case 'Escape':
                event.preventDefault();

                break;

            case 'Space':
            case 'Backspace':
            case 'Delete':
            case 'Enter':
            case 'Period':
            case 'Digit1': //exclamtion mark
            case 'Minus': //question mark
                setTimeout(() => { LessonNoteController.trackLessonNoteChanges(true); }, 100);
                break;

            case 'KeyY':
                if (event.getModifierState('Control') || event.getModifierState('Meta')) {
                    event.preventDefault();
                    LessonNoteController.changeNoteVersion('revert');
                }
                break;
            case 'KeyZ':
                if (event.getModifierState('Control') || event.getModifierState('Meta')) {
                    event.preventDefault();
                    LessonNoteController.changeNoteVersion('redo');
                }
                break;
        }
    }
}