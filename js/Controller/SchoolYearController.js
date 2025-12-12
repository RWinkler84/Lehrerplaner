import View from '../View/SchoolYearView.js';
import SchoolYear from "../Model/SchoolYear.js";
import CurriculumController from './CurriculumController.js';

export default class SchoolYearController {

    static async renderSchoolYearInfoSection(id = null, rerenderCurriculumView = true) {
        let schoolYear;

        if (id) schoolYear = await this.getSchoolYearById(id);
        if (!id) schoolYear = await this.getCurrentSchoolYear();

        if (rerenderCurriculumView) {
            if (schoolYear) {
                CurriculumController.renderSchoolYearCurriculumEditor(schoolYear);
            } else {
                CurriculumController.renderEmptyCalendar();
            }
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

    static async getCurriculumSpanById(id) {
        const schoolYearId = View.getSelectedYearId();
        const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);
        const curriculumId = CurriculumController.getDisplayedCurriculumId();

        return schoolYear.getCurriculumById(curriculumId).getCurriculumSpanById(id);
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

    static editTeachedGrades() {
        View.hideEditTeachedGradesButton();
        View.showSaveTeachedGradesButton();

        View.editTeachedGrades();
    }

    static async saveTeachedGrades() {
        const teachedGrades = View.saveTeachedGrades();
        const schoolYearId = this.getDisplayedSchoolYearId();
        const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);

        await schoolYear.updateGrades(teachedGrades);

        if (CurriculumController.getEditorType() == 'Curriculum Editor') CurriculumController.renderSchoolYearCurriculumEditor(schoolYear);

        View.hideSaveTeachedGradesButton();
        View.showEditTeachedGradesButton();
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

    static async cancelSchoolYearCreation() {
        const schoolYearId = View.getDisplayedSchoolYearId();

        if (schoolYearId) {
            const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);
            schoolYear.delete();
        }

        View.removeHiddenFromSchoolYearSelect();
        View.hideSchoolYearCreationButtonsContainer();

        View.showCreateNewSchoolYearButton();
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

            case 'editTeachedGradesButton':
                this.editTeachedGrades();
                break;
            case 'saveTeachedGradesButton':
                this.saveTeachedGrades();
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