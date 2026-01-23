import View from '../View/SchoolYearView.js';
import SchoolYear from "../Model/SchoolYear.js";
import CurriculumController from './CurriculumController.js';
import LessonController from './LessonController.js';

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

    static async getSchoolYearByDate(date) {
        return await SchoolYear.getSchoolYearByDate(date);
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

    static editSchoolYearDatesAndGrades() {
        View.showSaveSchoolYearDatesGradesButton();

        View.hideEditSchoolYearDatesGradesButton();
        View.hideSchoolYearSelect();
        View.disableCreateNewSchoolYearButton();
        View.disableEditHolidayDatesButton();

        View.editSchoolYearDates();
        View.editTaughtGrades();
    }

    static async saveSchoolYearDatesAndGrades() {
        const yearData = View.getSchoolYearDatesFromPicker();

        if (yearData.startDate == '') {
            View.alertSchoolYearStartDatePicker();
            return;
        }

        if (yearData.endDate == '') {
            View.alertSchoolYearEndDatePicker();
            return;
        }

        View.removeSchoolYearDatePicker();
        View.hideSaveSchoolYearDatesGradesButton();
        View.showEditSchoolYearDatesGradesButton();

        if (yearData.id == '') {
            yearData.grades = View.saveTaughtGrades();
            const schoolYear = SchoolYear.writeDataToInstance(yearData);

            await schoolYear.save();

            View.setDisplayedSchoolYearId(schoolYear.id);
            View.showCreateHolidaysButton();
            View.enableCreateHolidayDatesButton();
            View.enableSaveNewSchoolYearButton();

            await LessonController.renderCurriculaSelection();

            return;
        }

        const schoolYear = await SchoolYear.getSchoolYearById(yearData.id);
        const taughtGrades = View.saveTaughtGrades();
        await schoolYear.updateStartAndEndDate(yearData);
        await schoolYear.updateGrades(taughtGrades);

        if (!View.isNewSchoolYear()) {
            View.renderSchoolYearInfoSection(schoolYear);
            View.showSchoolYearSelect();
            View.enableCreateNewSchoolYearButton();
            View.enableEditHolidayDatesButton();
        }

        if (CurriculumController.getEditorType() == 'Curriculum Editor') CurriculumController.renderSchoolYearCurriculumEditor(schoolYear);

        await LessonController.renderCurriculaSelection();
    }

    static async editHolidayDates() {
        const schoolYearId = View.getDisplayedSchoolYearId();
        const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);
        CurriculumController.openHolidayEditor(schoolYear);

        View.disableCreateNewSchoolYearButton();
        View.disableEditSchoolYearDatesGradesButton();
        View.disableEditHolidayDatesButton();
        View.disableCreateHolidayDatesButton();
    }

    static disableSchoolYearButtons() {
        View.disableCreateNewSchoolYearButton();
        View.disableEditSchoolYearDatesGradesButton();
        View.disableCreateHolidayDatesButton();
        View.disableEditHolidayDatesButton();
    }

    static enableSchoolYearButtons() {
        View.enableCreateNewSchoolYearButton();
        View.enableEditSchoolYearDatesGradesButton();
        View.enableCreateHolidayDatesButton();
        View.enableEditHolidayDatesButton();
    }

    static createNewSchoolYear() {
        View.setEditOngoingStatus(true);

        View.hideEditSchoolYearDatesGradesButton();
        View.hideEditHolidayDatesButton();
        View.hideCreateNewSchoolYearButton();

        View.showSchoolYearCreationButtonsContainer();
        View.disableSaveNewSchoolYearButton();  //this button must only function after school year dates are saved
        View.showSaveSchoolYearDatesGradesButton();
        View.showCreateHolidayDatesButton();
        View.showNewSchoolYearForm();

        CurriculumController.renderEmptyCalendar();
    }

    static async saveNewSchoolYear() {
        const schoolYearId = View.getDisplayedSchoolYearId();
        const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);

        View.setEditOngoingStatus(false);

        CurriculumController.renderSchoolYearCurriculumEditor(schoolYear);

        View.renderSchoolYearInfoSection(schoolYear);
        View.showSchoolYearSelect();
    }

    static async cancelSchoolYearCreation() {
        const schoolYearId = View.getDisplayedSchoolYearId();

        if (schoolYearId) {
            const schoolYear = await SchoolYear.getSchoolYearById(schoolYearId);
            schoolYear.delete();
        }
        View.setEditOngoingStatus(false);

        CurriculumController.enableCreateCurriculumButton();
        CurriculumController.hideCloseHolidayEditorButton();


        View.showSchoolYearSelect();
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
            case 'saveNewSchoolYearButton':
                this.saveNewSchoolYear();
                break;
            case 'cancelSchoolYearCreationButton':
                this.cancelSchoolYearCreation();
                break;

            case 'editSchoolYearDatesGradesButton':
                this.editSchoolYearDatesAndGrades();
                break;
            case 'saveSchoolYearDatesGradesButton':
                this.saveSchoolYearDatesAndGrades();
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