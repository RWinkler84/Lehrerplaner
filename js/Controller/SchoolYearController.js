import View from '../View/SchoolYearView.js';
import SchoolYear from "../Model/SchoolYear.js";
import CurriculumController from './CurriculumController.js';

export default class SchoolYearController {

    static async renderSchoolYearInfoSection(id = null) {
        let schoolYear = await this.getSchoolYearById(id);

        if (!id) schoolYear = await this.getCurrentSchoolYear();

        if (schoolYear) {
            CurriculumController.renderSchoolYearCurriculumEditor(schoolYear);
        } else {
            CurriculumController.renderEmptyCalendar();
        }

        View.renderSchoolYearInfoSection(schoolYear);
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

    static async getHolidayById(id) {
        const schoolYearId = View.getSelectedYearId();
        const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);

        return schoolYear.getHolidayByIndex(id);
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

    static async editHolidayDates() {
        const schoolYearId = View.getSelectedYearId();
        const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);
        CurriculumController.renderHolidayEditor(schoolYear);
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
        this.renderSchoolYearInfoSection();
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
                this.editHolidayDates();
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