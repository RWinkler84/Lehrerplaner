import Lesson from '../Model/Lesson.js';
import View from '../View/LessonView.js';
import TaskController from './TaskController.js';
import LessonNoteController from './LessonNoteController.js';
import LessonView from '../View/LessonView.js';
import CurriculumController from './CurriculumController.js';
import SchoolYearController from './SchoolYearController.js';
import Editor from '../inc/editor.js';
import TimetableController from './TimetableController.js';

export default class LessonController {

    static async renderLesson() {
        View.renderLesson();
    }

    static async saveNewLesson(event) {
        event.preventDefault();

        View.toggleSaveLessonButton(event);

        let lessonData = LessonView.saveNewLesson(event);
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();

        if (lessonData.class == '' && lessonData.subject != 'Termin') {
            View.alertClassInput();
            View.toggleSaveLessonButton(event);
            return;
        }

        if (lessonData.subject == '') {
            View.alertSubjectSelect();
            View.toggleSaveLessonButton(event);
            return;
        }

        await lesson.save();

        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        await LessonNoteController.reorderLessonNotes(oldTimetable, oldTimetableChanges);
        LessonController.renderLesson();
    }

    static async deleteLessonById(id) {
        let lesson = await Lesson.getLessonById(id);

        lesson.delete();
    }

    static async updateLesson(lessonData, oldLessonData) {

        if (lessonData.class == '' && lessonData.subject != 'Termin') {
            View.alertClassInput();
            return false;
        }

        if (lessonData.subject == '') {
            View.alertSubjectSelect();
            return false;
        }

        await this.setLessonCanceled(oldLessonData);

        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();

        await lesson.save();

        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        await LessonNoteController.reorderLessonNotes(oldTimetable, oldTimetableChanges);
        this.renderLesson();
    }

    static async setLessonCanceled(lessonData) {
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();

        await lesson.cancel();

        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        await LessonNoteController.reorderLessonNotes(oldTimetable, oldTimetableChanges);
        this.renderLesson();

        return lesson.id;
    }

    static async setLessonsInHolidaysCanceled(schoolYear = null) {
        let schoolYears = [schoolYear];
        if (!schoolYear) schoolYears = await SchoolYearController.getAllSchoolYears();
        if (schoolYears.length == 0) return;

        await Lesson.setLessonsInHolidaysCanceled(schoolYears);

        await this.renderLesson();
    }

    static async setLessonNotCanceled(lessonData) {
        let lesson = LessonController.#lessonDataToLessonObject(lessonData);
        let oldTimetable = await Lesson.getOldTimetableCopy();
        let oldTimetableChanges = await Lesson.getOldTimetableChanges();

        await lesson.uncancel();

        await TaskController.reorderTasks(oldTimetable, oldTimetableChanges);
        this.renderLesson();
    }
    /** @param isNewTimetable bool, indicates, if the affected lessons fall into the validity timespan of a new or a an updated timetable, triggering different filter methods */
    static async filterAffectedLessonChanges(affectedLessonChanges, timetable, isNewTimetable) {
        let model = new Lesson;

        return await model.filterAffectedLessonChanges(affectedLessonChanges, timetable, isNewTimetable);
    }

    static async handleTimetableChangesCarryover(remainingLessonIds, timetableValidFromDate) {
        let model = new Lesson;

        await model.handleTimetableChangesCarryover(remainingLessonIds, timetableValidFromDate);
    }

    static getLessonDataFromElement(event) {
        return LessonView.getLessonDataFromElement(event);
    }

    static getLessonNoteIdFromLessonElement(event) {
        return LessonView.getLessonNoteIdFromLessonElement(event);
    }

    static createNewTask(event) {
        TaskController.createNewTask(event);
    }

    static async getOldTimetableCopy() {
        return await Lesson.getOldTimetableCopy();
    };

    static async getOldTimetableChanges() {
        return await Lesson.getOldTimetableChanges();
    };

    static async getAllSubjects() {
        return await TimetableController.getAllSubjects();
    }

    static async getAllRegularLessons() {
        return await Lesson.getAllRegularLessons();
    }

    static async getRegularLessonsForCurrentWeek(monday, sunday) {
        return await Lesson.getRegularLessonsForCurrentWeek(monday, sunday);
    }

    static async getAllTimetableChanges() {
        return await Lesson.getAllTimetableChanges();
    }

    static async getTimetableChanges(startDate, endDate) {
        return await Lesson.getTimetableChanges(startDate, endDate);
    }

    static getLessonObject(lessonData) {
        return this.#lessonDataToLessonObject(lessonData);
    }

    static async getLessonById(id) {
        return await Lesson.getLessonById(id);
    }

    static async getAllTasksInTimespan(startDate, endDate) {
        return await TaskController.getAllTasksInTimespan(startDate, endDate);
    }

    static async getAllLessonNotesInTimespan(startDate, endDate) {
        return await LessonNoteController.getAllLessonNotesInTimeRange(startDate, endDate);
    }

    static renderLessonNote(event) {
        LessonNoteController.renderLessonNote(event);
    }

    ///////////////
    // curricula //
    ///////////////

    static async renderCurriculaSelection() {
        const weekdayDates = View.getCurrentlyDisplayedWeekDates();
        const currentlySelectedCurricula = View.getSelectedCurriculaIds();

        const selection = await CurriculumController.getCurriculaSelectionItems(weekdayDates.monday, true, currentlySelectedCurricula);

        View.renderCurriculaSelection(selection);
    }

    static async renderSelectedCurricula() {
        View.removeAllCurriculumSpans();

        const selectedCurriculaIds = View.getSelectedCurriculaIds();
        const weekdayDates = View.getCurrentlyDisplayedWeekDates();
        const schoolYear = await SchoolYearController.getSchoolYearByDate(weekdayDates.monday);
        const allSubjects = await this.getAllSubjects();


        selectedCurriculaIds.forEach(id => {
            const curriculum = schoolYear.getCurriculumById(id);
            const matchingSpans = schoolYear.getCurriculumSpansInDateRange(id, weekdayDates.monday, weekdayDates.sunday);
            const subject = allSubjects.find((subject) => { return subject.subject == curriculum.subject });
            const colorCssClass = subject ? subject.colorCssClass : null;

            View.renderCurriculumSpans(matchingSpans, colorCssClass, curriculum.id, schoolYear.id);
        })
    }

    static async openCurriculumSpanDialog(clickedElement) {
        const spanData = View.getClickedCurriculumSpanData(clickedElement);
        const schoolYear = await SchoolYearController.getSchoolYearById(spanData.schoolYearId);
        const curriculum = schoolYear.getCurriculumById(spanData.curriculumId);
        const span = curriculum.getCurriculumSpanById(spanData.spanId);

        View.openCurriculumSpanDialog(span, curriculum, schoolYear);
    }

    static async closeCurriculumSpanDialog() {
        View.closeCurriculumSpanDialog();
    }

    static async saveCurriculumSpanNote() {
        const formData = View.getCurriculumSpanNoteDataFromForm();
        const schoolYear = await SchoolYearController.getSchoolYearById(formData.schoolYearId);
        const spanData = { id: formData.spanId, note: formData.spanNote };

        schoolYear.updateCurriculumSpan(formData.curriclumId, spanData)

        this.renderSelectedCurricula();

        View.toggleSaveCurriculumSpanNoteButton(false);
        View.showCurriculumNoteSavedMessage();
    }

    static toggleSaveCurriculumSpanNoteButton(event) {
        if (event.target.id != 'curriculumNoteContentEditor' && event.target.id != 'spanTitle') return;
        View.toggleSaveCurriculumSpanNoteButton(true);
    }

    static removeAllCurriculumSpans(element = null) {
        View.removeAllCurriculumSpans(element);
    }

    static toggleCurriculumSelectionItem(event) {
        View.toggleCurriculumSelectionItem(event);
    }

    // event handler //
    static timetableClickHandler(event) {
        const target = event.target;

        switch (target.id) {
            case 'resizeCurriculumSectionButton':
                View.resizeCurriculaSection();
                break;
            case 'resizeCurriculumSelectionButton':
                View.resizeCurriculaSelection();
                break;


            case 'saveCurriculumNotesButton':
                this.saveCurriculumSpanNote();
                break;
            case 'closeCurriculumNotesButton':
                this.closeCurriculumSpanDialog();
                break;
        }

        switch (true) {
            case target.classList.contains('lessonIndicatorContainer'):
                if (View.hasLessonNoteIndicator(target)) this.renderLessonNote(event);
                break;
            case target.classList.contains('lessonNoteIcon'):
                this.renderLessonNote(event);
                break;

            case target.classList.contains('curriculumSelectionItem'):
                if (!target.classList.contains('mainView')) return;
                this.toggleCurriculumSelectionItem(event);
                this.renderSelectedCurricula();
                break;

            case target.classList.contains('curriculaSpanNoteIcon'):
                this.openCurriculumSpanDialog(target);
                break;
        }
    }

    static #lessonDataToLessonObject(lessonData) {
        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.id = lessonData.id;
        lesson.weekday = lessonData.weekday;
        lesson.date = lessonData.date;
        lesson.timeslot = lessonData.timeslot;
        lesson.canceled = lessonData.canceled = undefined ? 'false' : lessonData.canceled;
        lesson.type = lessonData.type = undefined ? 'normal' : lessonData.type;
        lesson.created = lessonData.created;

        return lesson;
    }
}