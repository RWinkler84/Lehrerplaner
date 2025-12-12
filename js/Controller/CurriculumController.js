import View from "../View/CurriculumView.js";
import LessonController from "./LessonController.js";
import SchoolYearController from "./SchoolYearController.js";

export default class CurriculumController {
    static renderEmptyCalendar(startDate, endDate) {
        View.renderEmptyCalendar(startDate, endDate);
        View.cancelSpanCreation();
        View.closeSpanForm();
    }

    static async renderSchoolYearCurriculumEditor(schoolYear = null, curriculumId = null) {
        if (!schoolYear) schoolYear = await SchoolYearController.getCurrentSchoolYear()

        this.renderEmptyCalendar(schoolYear.startDate, schoolYear.endDate)
        View.renderSchoolYearCurriculumEditor(schoolYear, curriculumId);
    }

    static async changeDisplayedCurriculum(event) {
        const curriculumId = event.target.dataset.curriculumid;
        const schoolYearId = SchoolYearController.getDisplayedSchoolYearId();
        const schoolYear = await this.getSchoolYearById(schoolYearId);

        View.changeDisplayedCurriculum(schoolYear, curriculumId);
    }

    static openHolidayEditor(schoolYear) {
        this.renderEmptyCalendar(schoolYear.startDate, schoolYear.endDate);
        View.openHolidayEditor(schoolYear);
    }

    static closeHolidayEditor() {
        View.closeHolidayEditor();
        this.renderSchoolYearCurriculumEditor()
    }

    static createNewSpan(event) {
        View.disableTouchActionsOnDayElements();
        let spanId = View.createNewSpan(event);
        View.addHandlesToSpan(spanId);
        View.openSpanForm();
    }

    static createNewSubSpan() {
        View.openSpanForm();
        View.createNewSubSpan(event);
    }

    static async saveSpan() {
        const spanId = View.getActiveSpanId();
        const spanData = View.saveSpan();
        const editorType = View.getEditorType();

        if (editorType == 'Holiday Editor') {
            const schoolYear = await SchoolYearController.getSchoolYearById(SchoolYearController.getDisplayedSchoolYearId());
            await schoolYear.updateHoliday(spanData);

            SchoolYearController.renderSchoolYearInfoSection(schoolYear.id, false);
            View.openHolidayEditor(schoolYear);
        }

        if (editorType == 'Curriculum Editor') {

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
            await schoolYear.removeHolidayById(spanId);

            CurriculumController.openHolidayEditor(schoolYear);
            SchoolYearController.renderSchoolYearInfoSection(schoolYear.id, false);
        }

        if (editorType == 'Curriculum Editor') {
            // do something different

            CurriculumController.renderSchoolYearCurriculumEditor(schoolYear);
        }
    }

    static async selectSpan(event) {
        const previouslyActiveSpanId = View.getActiveSpanId();
        const spanId = View.getSpanId(event);
        const spanData = await this.getSpanDataById(spanId);

        if (previouslyActiveSpanId) {
            if (View.getNewSpan()) {
                View.cancelSpanCreation(previouslyActiveSpanId);
            } else {
                const spanData = await this.getSpanDataById(previouslyActiveSpanId);
                View.renderSpan(previouslyActiveSpanId, spanData);
                View.renderSpanContentContainer(previouslyActiveSpanId, spanData);
            }
        }

        View.openSpanForm(spanData);
        View.disableTouchActionsOnDayElements();
        View.removeAllHandles();
        View.addHandlesToSpan(spanId);
    }

    static modifySpanRange(event) {
        View.modifySpanRange(event)
    }

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

    // event handlers
    static handleClickEvents(event) {
        const spanEditOngoing = document.querySelector('div[data-span_edit_active]').dataset.span_edit_active;
        const classList = event.target.classList;

        // handle clicks on day elements
        if (classList.contains('day')) {
            switch (true) {
                case !classList.contains('selected'):
                    if (spanEditOngoing == 'false') CurriculumController.createNewSpan(event);
                    break;

                case classList.contains('selected'):
                    if (spanEditOngoing == 'true') {
                        const clickedSpanId = View.getSpanId(event);
                        const activeSpanId = View.getActiveSpanId();
                        if (clickedSpanId == activeSpanId) {
                            CurriculumController.createNewSubSpan(event);
                        } else {
                            CurriculumController.selectSpan(event);
                        }
                    };

                    if (spanEditOngoing == 'false') CurriculumController.selectSpan(event);
                    break;
            }
        }

        //handle clicks on curriculum selection elements

        if (classList.contains('curriculumSelectionItem')) {
            if (classList.contains('selected')) return;
            CurriculumController.changeDisplayedCurriculum(event);
        }

        //handle clicks on buttons
        switch (event.target.id) {
            case 'closeHolidayEditorButton':
                CurriculumController.closeHolidayEditor();
                break;
            case 'saveSpanCreationButton':
                CurriculumController.saveSpan();
                break;
            case 'cancelSpanCreationButton':
                CurriculumController.cancelSpanCreation();
                break;
            case 'deleteSelectedSpanButton':
                CurriculumController.deleteSelectedSpan();
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
}