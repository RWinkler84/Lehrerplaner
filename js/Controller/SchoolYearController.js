import View from '../View/SchoolYearView.js';
import SchoolYear from "../Model/SchoolYear.js";

export default class SchoolYearController {

    static renderSchoolYearInfoSection(id = null) {
        View.renderSchoolYearInfoSection(id);
    }

    static async getSchoolYearById(id) {
        return await SchoolYear.getSchoolYearById(id)
    }

    static async getCurrentSchoolYear() {
        return await SchoolYear.getCurrentSchoolYear();
    }

    static async getAllSchoolYears() {
        return await SchoolYear.getAllSchoolYears();
    }

    static editSchoolYearDates() {
        View.showSaveSchoolYearDatesButton();
        View.hideEditSchoolYearDatesButton();
        View.editSchoolYearDates();
    }

    static saveSchoolYearDates() {
        const dates = View.getSchoolYearDatesFromPicker();

        if (dates.startDate == '') {
            View.alertSchoolYearStartDatePicker();
            return;
        }

        if (dates.endDate == '') {
            View.alertSchoolYearEndDatePicker();
            return;
        }

        View.removeSchoolYearDatePicker();
        View.hideSaveSchoolYearDatesButton();
        View.showEditSchoolYearDatesButton();

        if (dates.id == '') { //no id means school year in creation
            View.removeHiddenFromCreateHolidaysButton();
            return;
        }

        SchoolYear.saveSchoolYearDates(dates);
    }

    static createNewSchoolYear() {
        View.hideEditSchoolYearDatesButton();
        View.hideEditHolidayDatesButton();
        View.hideCreateNewSchoolYearButton();

        View.showSchoolYearCreationButtonsContainer();
        View.showSaveSchoolYearDatesButton();
        View.showCreateHolidayDatesButton();
        View.showNewSchoolYearForm();
    }

    static saveNewSchoolYear() {

    }

    static cancelSchoolYearCreation() {
        View.removeHiddenFromSchoolYearSelect();
        View.renderSchoolYearInfoSection();
    }
    static changeDisplayedSchoolYear() {
        this.renderSchoolYearInfoSection(View.getSelectedYearId());
    }

    //event handler
    static clickEventHandler(event) {
        //by id
        switch (event.target.id) {
            case 'createNewSchoolYearButton':
                this.createNewSchoolYear();
                break;
            case 'cancelSchoolYearCreationButton':
                this.cancelSchoolYearCreation();
                break;
            case 'editSchoolYearDatesButton':
                this.editSchoolYearDates();
                break;
            case 'saveSchoolYearDatesButton':
                this.saveSchoolYearDates();
                break;
            case 'editHolidayDatesButton':

                break;
            case 'createHolidayDatesButton':

                break;
        }
    }

    static changeEventHandler(event) {
        switch (event.target.id) {
            case 'schoolYearNameSelect':
                SchoolYearController.changeDisplayedSchoolYear();
                break;
        }
    }
}