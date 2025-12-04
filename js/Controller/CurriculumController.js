import View from "../View/CurriculumView.js";
import SchoolYearController from "./SchoolYearController.js";

export default class CurriculumController {
    static renderEmptyCalendar(startDate, endDate) {
        View.renderEmptyCalendar(startDate, endDate);
    }

    static renderSchoolYearCurriculumEditor(schoolYear) {
        this.renderEmptyCalendar(schoolYear.startDate, schoolYear.endDate)
        View.renderSchoolYearCurriculumEditor(schoolYear);
    }

    static renderHolidayEditor(schoolYear) {
        View.renderEmptyCalendar(schoolYear.startDate, schoolYear.endDate);
        View.renderHolidayEditor(schoolYear)
    }

    static handleClicksOnDayElements(event) {
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
    }

    static timespanFormHandler(event) {
        switch (event.target.id) {
            case 'saveSpanCreationButton':
                CurriculumController.saveSpan();
                break;

            case 'cancelSpanCreationButton':
                CurriculumController.cancelSpanCreation();
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

    static createNewSpan(event) {
        View.disableTouchActionsOnDayElements();
        View.activateSpanEditing();
        let spanId = View.createNewSpan(event);
        View.addHandlesToSpan(spanId);
    }

    static createNewSubSpan() {
        View.activateSpanEditing();
        View.createNewSubSpan(event);
    }

    static saveSpan() {
        const spanId = View.getActiveSpanId();
        View.saveSpan();
        View.deactivateSpanEditing();
        View.removeAllHandles();
        View.removeAnchorFromSpan(spanId);
        View.enableTouchActionsOnDayElements();
    }

    static async cancelSpanCreation() {
        const spanId = View.getActiveSpanId();
        const isNewSpan = View.getNewSpan();

        View.cancelSpanCreation(spanId);
        View.deactivateSpanEditing();
        View.removeAllHandles();
        View.enableTouchActionsOnDayElements();

        if (!isNewSpan) {
            const spanData = await this.getSpanDataById(spanId);
            View.renderSpan(spanId, spanData);
            View.renderSpanContentContainer(spanId, spanData);
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

        View.activateSpanEditing(spanData);
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
            return await SchoolYearController.getHolidayById(spanId)
        }

        if (editorType == 'Curriculum Editor'){
            // still work in progress
            //getCurriculumById()
        }

    }
}