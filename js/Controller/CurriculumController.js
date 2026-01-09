import View from "../View/CurriculumView.js";
import LessonController from "./LessonController.js";
import SchoolYearController from "./SchoolYearController.js";
import Fn from "../inc/utils.js";
import SchoolYear from "../Model/SchoolYear.js";
import AbstractController from "./AbstractController.js";

export default class CurriculumController {
    static renderEmptyCalendar(startDate, endDate) {
        View.renderEmptyCalendar(startDate, endDate);
        View.cancelSpanCreation();
        View.closeSpanForm();
        View.hideCreateCurriculumButton();
    }

    static async renderSchoolYearCurriculumEditor(schoolYear = null, curriculumId = null) {
        if (!schoolYear) schoolYear = await SchoolYearController.getCurrentSchoolYear()
        if (!curriculumId) curriculumId = await CurriculumController.getDisplayedCurriculumId()

        this.renderEmptyCalendar(schoolYear.startDate, schoolYear.endDate)
        View.renderSchoolYearCurriculumEditor(schoolYear, curriculumId);
        View.showCreateCurriculumButton();
    }

    static async rerenderDisplayedCurriculum(curriculumId, schoolYear = null) {
        if (!schoolYear) {
            const schoolYearId = SchoolYearController.getDisplayedSchoolYearId();
            schoolYear = await this.getSchoolYearById(schoolYearId);
        }

        if (View.getNewSpan()) await this.cancelSpanCreation();
        
        View.rerenderDisplayedCurriculum(schoolYear, curriculumId);
        View.removeAllHandles();
    }

    static openHolidayEditor(schoolYear) {
        this.renderEmptyCalendar(schoolYear.startDate, schoolYear.endDate);
        View.openHolidayEditor(schoolYear);
        View.hideCreateCurriculumButton();
    }

    static closeHolidayEditor() {
        View.closeHolidayEditor();
        this.renderSchoolYearCurriculumEditor()
    }

    static resizeTimeSpanForm() {
        View.resizeTimeSpanForm();
    }

    /////////////////////////
    // curriculum creation //
    /////////////////////////
    static async createNewCurriculum() {
        const schoolYearId = SchoolYearController.getDisplayedSchoolYearId();
        const schoolYear = await SchoolYearController.getSchoolYearById(schoolYearId);
        const newCurriculumId = Fn.generateId(schoolYear.curricula);

        View.hideCreateCurriculumButton();
        View.hideCurriculumSelectionContainer();

        View.showSaveCancelNewCurriculumButtonContainer();
        View.showCurriculumCreationSelectContainer();
        await View.renderCurriculumSubjectAndGradeSelect(schoolYear);

        //the renderCurriculumSubjectAndGradeSelect function preselects the first free grade/subject combination
        //which should be used for the mockup curriculum, which gets update whenever the user selects something else
        const selectedSubjectGrade = View.getSelectedSubjectAndGrade();

        //if there is no selectedSubjectGrade the user did not create teached grades or subjects or there wasn't a free combination of grade and subject
        //so no subject/grad select was created. It this case there must not be an empty curriculum or an id set on the curriculum container
        if (!selectedSubjectGrade) {
            View.setDisplayedCurriculumId('');
            return;
        }
        
        await schoolYear.addCurriculum({ id: newCurriculumId, grade: selectedSubjectGrade.grade, subject: selectedSubjectGrade.subject, curriculumSpans: [], provisional: true });
        View.rerenderDisplayedCurriculum(schoolYear, newCurriculumId);
    }

    static async saveNewCurriculum() {
        const schoolYear = await SchoolYear.getSchoolYearById(SchoolYearController.getDisplayedSchoolYearId());
        const curriculumId = View.getDisplayedCurriculumId();

        await schoolYear.removeProvisionalStatusFromCurriculum(curriculumId);

        View.hideSaveCancelNewCurriculumButtonContainer();
        View.hideCurriculumCreationSelectContainer();

        View.showCurriculumSelectionContainer();
        View.showCreateCurriculumButton();
        View.renderSchoolYearCurriculumEditor(schoolYear, curriculumId);
    }

    static async cancelCurriculumCreation() {
        const schoolYearId = SchoolYearController.getDisplayedSchoolYearId();
        const schoolYear = await SchoolYearController.getSchoolYearById(schoolYearId);
        const curriculumId = View.getDisplayedCurriculumId();

        if (curriculumId != '') await schoolYear.removeCurriculumById(curriculumId);

        View.setDisplayedCurriculumId('');
        View.hideCurriculumCreationSelectContainer();
        View.hideSaveCancelNewCurriculumButtonContainer();

        View.showCurriculumSelectionContainer();
        this.renderSchoolYearCurriculumEditor(schoolYear);
    }

    static async preventDuplicateCurricula() {
        const schoolYear = await SchoolYear.getSchoolYearById(SchoolYearController.getDisplayedSchoolYearId());
        const subjectAndGradeSelection = View.getSelectedSubjectAndGrade();
        const curriculumId = View.getDisplayedCurriculumId();

        const match = schoolYear.curricula.find(curriculum => {
            return curriculum.grade == subjectAndGradeSelection.grade && curriculum.subject == subjectAndGradeSelection.subject;
        });

        if (match) {
            View.showCurriculumAlreadyExistsError();
            View.alertCurriculumAlreadyExists();
            View.disableSaveCurriculumButton();
            //still update the currriculum, otherwise the program will falsely claim, that a possible grade/subject combination is already taken
            schoolYear.updateCurriculum({ id: curriculumId, grade: subjectAndGradeSelection.grade, subject: subjectAndGradeSelection.subject });
        } else {
            View.hideCurriculumAlreadyExistsError();
            View.enableSaveCurriculumButton();
            schoolYear.updateCurriculum({ id: curriculumId, grade: subjectAndGradeSelection.grade, subject: subjectAndGradeSelection.subject });
        }

    }

    ///////////////////////
    // span manipulation //
    ///////////////////////
    static createNewSpan(event) {
        View.disableTouchActionsOnDayElements();
        let spanId = View.createNewSpan(event);
        View.addHandlesToSpan(spanId);
        View.openSpanForm();
    }

    static async saveSpan() {
        const spanId = View.getActiveSpanId();
        const spanData = View.saveSpan();
        const editorType = View.getEditorType();
        const schoolYear = await SchoolYearController.getSchoolYearById(SchoolYearController.getDisplayedSchoolYearId());

        if (editorType == 'Holiday Editor') {
            await schoolYear.updateHoliday(spanData);

            SchoolYearController.renderSchoolYearInfoSection(schoolYear.id, false);
            View.openHolidayEditor(schoolYear);

            await AbstractController.greyOutHolidaysAndPassedDays();
            await LessonController.setLessonsInHolidaysCanceled(schoolYear);
        }

        if (editorType == 'Curriculum Editor') {
            const curriculumId = View.getDisplayedCurriculumId();
            await schoolYear.updateCurriculumSpan(curriculumId, spanData);
            View.rerenderDisplayedCurriculum(schoolYear, curriculumId);

            await LessonController.renderSelectedCurricula();
        }

        View.closeSpanForm();
        View.removeAllHandles();
        View.removeAnchorFromSpan(spanId);
        View.enableTouchActionsOnDayElements();
    }

    static async cancelSpanCreation() {
        const spanId = View.getActiveSpanId();
        const isNewSpan = View.getNewSpan();

        View.cancelSpanCreation(spanId);
        View.closeSpanForm();
        View.removeAllHandles();
        View.enableTouchActionsOnDayElements();

        if (!isNewSpan) {
            const spanData = await this.getSpanDataById(spanId);
            View.renderSpan(spanId, spanData);
            View.renderSpanContentContainer(spanId, spanData);
        }
    }

    static async deleteSelectedSpan() {
        const spanId = View.getActiveSpanId();
        const yearId = SchoolYearController.getDisplayedSchoolYearId();
        const editorType = View.getEditorType()
        const schoolYear = await SchoolYearController.getSchoolYearById(yearId);

        if (editorType == 'Holiday Editor') {
            schoolYear.removeHolidayById(spanId);

            CurriculumController.openHolidayEditor(schoolYear);
            SchoolYearController.renderSchoolYearInfoSection(schoolYear.id, false);
        }

        if (editorType == 'Curriculum Editor') {
            const curriculumId = View.getDisplayedCurriculumId();

            schoolYear.removeCurriculumSpanById(curriculumId, spanId)
            await CurriculumController.rerenderDisplayedCurriculum(curriculumId, schoolYear);
            View.closeSpanForm();
        }
    }

    static async selectSpan(event) {
        const previouslyActiveSpanId = View.getActiveSpanId();
        const spanId = View.getSpanId(event);
        const spanData = await this.getSpanDataById(spanId);

        if (previouslyActiveSpanId) {
            await this.saveSpan()
        }

        View.openSpanForm(spanData);
        View.disableTouchActionsOnDayElements();
        View.removeAllHandles();
        View.addHandlesToSpan(spanId);
    }

    static modifySpanRange(event) {
        View.modifySpanRange(event)
    }

    /////////////////////
    //helper functions //
    /////////////////////
    static async getSchoolYearById(id) {
        return await SchoolYearController.getSchoolYearById(id);
    }

    static async getSpanDataById(spanId) {
        const editorType = View.getEditorType();

        if (editorType == 'Holiday Editor') {
            return await SchoolYearController.getHolidayById(spanId);
        }

        if (editorType == 'Curriculum Editor') {
            return await SchoolYearController.getCurriculumSpanById(spanId);
        }
    }

    static getEditorType() {
        return View.getEditorType();
    }

    static getDisplayedCurriculumId() {
        return View.getDisplayedCurriculumId();
    }

    static async getAllSubjects() {
        return await LessonController.getAllSubjects();
    }

    static async getCurriculaSelectionItems(referenceDate, forMainView, preselectedIds) {
        const schoolYear = await SchoolYearController.getSchoolYearByDate(referenceDate);

        if (!schoolYear) return false;
        
        return await View.getCurriculaSelectionItems(schoolYear, forMainView, preselectedIds);
    }

    // event handlers
    static async handleClickEvents(event) {
        const spanEditOngoing = document.querySelector('div[data-span_edit_active]').dataset.span_edit_active;
        const classList = event.target.classList;

        // handle clicks on day elements
        if (classList.contains('day')) {
            switch (true) {
                case !classList.contains('selected'):
                    if (spanEditOngoing == 'false') CurriculumController.createNewSpan(event);
                    if (spanEditOngoing == 'true') {
                        await CurriculumController.saveSpan();
                        CurriculumController.createNewSpan(event);
                    }
                    break;

                case classList.contains('selected'):
                    CurriculumController.selectSpan(event);
                    break;
            }
        }

        //handle clicks on curriculum selection elements 
        if (classList.contains('curriculumSelectionItem')) {
            if (classList.contains('selected')) return;

            const curriculumId = event.target.dataset.curriculumid;
            CurriculumController.rerenderDisplayedCurriculum(curriculumId);
        }

        //handle clicks on buttons
        switch (event.target.id) {
            //curriculum creation
            case 'createCurriculumButton':
                CurriculumController.createNewCurriculum();
                SchoolYearController.disableSchoolYearButtons();
                break;
            case 'saveNewCurriculumButton':
                CurriculumController.saveNewCurriculum();
                SchoolYearController.enableSchoolYearButtons();
                break;
            case 'cancelNewCurriculumButton':
                CurriculumController.cancelCurriculumCreation();
                SchoolYearController.enableSchoolYearButtons();
                break;

            //holiday editor
            case 'closeHolidayEditorButton':
                CurriculumController.closeHolidayEditor();
                SchoolYearController.enableSchoolYearButtons();
                break;

            //span form buttons
            case 'saveSpanCreationButton':
                CurriculumController.saveSpan();
                break;
            case 'cancelSpanCreationButton':
            case 'closeTimeSpanFormButton':
                CurriculumController.cancelSpanCreation();
                break;
            case 'deleteSelectedSpanButton':
                CurriculumController.deleteSelectedSpan();
                break;
            case 'resizeTimeSpanFormButton':
                CurriculumController.resizeTimeSpanForm();
            break;
        }
    }

    static handleMouseDownOnDayElements(event) {
        const classList = event.target.classList;

        switch (true) {
            case classList.contains('handleContainer'):
                CurriculumController.modifySpanRange(event);
                break;
        }
    }

    static changeEventHandler(event) {
        const target = event.target;

        switch (target.id) {
            case 'curriculumGradeSelect':
            case 'curriculumSubjectSelect':
                CurriculumController.preventDuplicateCurricula();
                break;
        }
    }

    static enableCreateCurriculumButton() {
        View.enableCreateCurriculumButton();
    }
    static disableCreateCurriculumButton() {
        View.disableCreateCurriculumButton();
    }
}