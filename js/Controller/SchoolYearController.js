import View from '../View/SchoolYearView.js';
import SchoolYear from "../Model/SchoolYear.js";
import CurriculumController from './CurriculumController.js';

export default class SchoolYearController {

    static async renderSchoolYearInfoSection(id = null) {
        let schoolYear;

        if (id) schoolYear = await this.getSchoolYearById(id);
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

    static getDisplayedSchoolYearId() {
        return View.getDisplayedSchoolYearId();
    }

    static async getHolidayById(id) {
        const schoolYearId = View.getSelectedYearId();
        const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);

        return schoolYear.getHolidayById(id);
    }

    static editSchoolYearDates() {
        View.showSaveSchoolYearDatesButton();
        View.hideEditSchoolYearDatesButton();
        View.editSchoolYearDates();
    }

    static async saveSchoolYearDates() {
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

        if (dates.id == '') {
            let schoolYear = SchoolYear.writeDataToInstance(dates);
            await schoolYear.save();

            View.setDisplayedSchoolYearId(schoolYear.id);
            View.removeHiddenFromCreateHolidaysButton();
            
            CurriculumController.renderSchoolYearCurriculumEditor(schoolYear);
            
            return;
        }

        const schoolYear = await SchoolYear.getSchoolYearById(dates.id);
        schoolYear.updateStartAndEndDate(dates);

        View.renderSchoolYearInfoSection(schoolYear);
        CurriculumController.renderSchoolYearCurriculumEditor(schoolYear);
    }

    static async editHolidayDates() {
        const schoolYearId = View.getDisplayedSchoolYearId();
        const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);
        CurriculumController.openHolidayEditor(schoolYear);
    }

    static createNewSchoolYear() {
        View.hideEditSchoolYearDatesButton();
        View.hideEditHolidayDatesButton();
        View.hideCreateNewSchoolYearButton();

        View.showSchoolYearCreationButtonsContainer();
        View.showSaveSchoolYearDatesButton();
        View.showCreateHolidayDatesButton();
        View.showNewSchoolYearForm();

        CurriculumController.renderEmptyCalendar();
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
                this.editHolidayDates();
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