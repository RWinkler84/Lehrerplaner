import View from "../View/CurriculumView.js";

export default class CurriculumController {
    static renderEmptyCalendar() {
        View.renderEmptyCalendar();
    }

    static handleClicksOnDayElements(event) {
        const spanEditOngoing = document.querySelector('div[data-span_edit_active]').dataset.span_edit_active;
        const classList = event.target.classList;

        // handle clicks on day elements
        if (classList.contains('day')) {
            switch (true) {
                case !classList.contains('selected'):
                    if (spanEditOngoing == 'false') CurriculumController.createNewSpan();
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

    static createNewSpan() {
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

    static cancelSpanCreation() {
        View.cancelSpanCreation();
        View.deactivateSpanEditing();
        View.removeAllHandles();
        View.enableTouchActionsOnDayElements();
    }

    static selectSpan(event) {
        const currentlyActiveSpanId = View.getActiveSpanId();
        const spanId = View.getSpanId(event);

        if (currentlyActiveSpanId) {
            if (View.getNewSpan()) {
                View.cancelSpanCreation();
            } else {
                View.drawSpan(currentlyActiveSpanId);
            }
        }

        View.activateSpanEditing();
        View.disableTouchActionsOnDayElements();
        View.removeAllHandles();
        View.addHandlesToSpan(spanId);
    }

    static modifySpanRange(event) {
        View.modifySpanRange(event)
    }
}