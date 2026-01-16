import AbstractModel from "./AbstractModel.js";
import Fn from '../inc/utils.js';

export class Holiday {
    #id;
    #name;
    #startDate;
    #endDate;

    constructor(id, name, startDate, endDate = null) {
        this.#id = Number(id);
        this.#name = name;
        this.#startDate = new Date(startDate);

        if (!endDate) {
            this.#endDate = this.#startDate;
        } else {
            this.#endDate = new Date(endDate);
        }

        this.#startDate.setHours(12);
        this.#endDate.setHours(12);
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            startDate: this.startDate,
            endDate: this.endDate
        }
    }

    get id() { return this.#id };
    get name() { return this.#name };
    get startDate() { return this.#startDate };
    get endDate() { return this.#endDate };

    set id(value) { this.#id = Number(value) };
    set name(value) { this.#name = value };
    set startDate(value) { this.#startDate = new Date(value) };
    set endDate(value) { this.#endDate = new Date(value) };
}

export class Curriculum {
    #id;
    #grade;
    #subject;
    #curriculumSpans = [];

    constructor(id, grade, subject, curriculumSpans = null) {
        this.#id = Number(id);
        this.#grade = grade;
        this.#subject = subject;

        if (curriculumSpans) {
            curriculumSpans.forEach(spanData => {
                const spanInstance = new CurriculumSpan(spanData.id, spanData.name, spanData.startDate, spanData.endDate, spanData.note);
                this.addCurriculumSpan(spanInstance);
            })
        }
    }

    //CurriculumSpans
    addCurriculumSpan(spanInstance) {
        if (!spanInstance instanceof CurriculumSpan) throw new TypeError('The given argument is not of type CurriculumSpan!');

        this.#curriculumSpans.push(spanInstance);
    }

    updateCurriculumSpan(spanData) {
        const span = this.getCurriculumSpanById(spanData.id);

        if (!span) {
            const newSpan = new CurriculumSpan(spanData.id, spanData.name, spanData.startDate, spanData.endDate, spanData.note);
            this.addCurriculumSpan(newSpan);

            return;
        }

        span.update(spanData);
    }

    removeCurriculumSpanById(id) {
        let matchIndex = null;

        this.curriculumSpans.forEach((span, index) => {
            if (span.id == id) matchIndex = index;
        });

        if (matchIndex == null) throw new Error('Curriculum span not found!');
        this.#curriculumSpans.splice(matchIndex, 1);
    }

    getCurriculumSpanById(spanId) {
        return this.#curriculumSpans.find(entry => { return entry.id == spanId });
    }


    serialize() {
        const serialized = {
            id: Number(this.id),
            grade: this.grade,
            subject: this.subject,
            curriculumSpans: []
        }

        this.curriculumSpans.forEach(span => {
            serialized.curriculumSpans.push(span.serialize());
        })

        return serialized;
    }

    get id() { return this.#id };
    get grade() { return this.#grade };
    get subject() { return this.#subject };
    get curriculumSpans() { return [...this.#curriculumSpans]; }

    set curriculumSpans(value) {
        throw new Error('Curriculum span entries can only be added by calling the addSpan method! Add one instance of a span at a time.');
    }
    set grade(value) { this.#grade = value };
    set subject(value) { this.#subject = value };
}

export class CurriculumSpan {
    #id;
    #name;
    #note;
    #startDate;
    #endDate;

    constructor(id, name, startDate, endDate = null, note = null) {
        this.#id = Number(id);
        this.#name = name;
        this.#startDate = new Date(startDate);
        this.#note = note;

        if (!endDate) {
            this.#endDate = this.#startDate;
        } else {
            this.#endDate = new Date(endDate);
        }

        this.#startDate.setHours(12);
        this.#endDate.setHours(12);
    }
    update(spanData) {
        if (spanData.name) this.name = spanData.name;
        if (spanData.startDate) this.startDate = spanData.startDate;
        if (spanData.endDate) this.endDate = spanData.endDate;
        if (spanData.note) this.note = spanData.note;
    }

    serialize() {
        return {
            id: Number(this.id),
            name: this.name,
            startDate: this.startDate,
            endDate: this.endDate,
            note: this.note
        }
    }

    get id() { return this.#id };
    get name() { return this.#name };
    get startDate() { return this.#startDate };
    get endDate() { return this.#endDate };
    get note() { return this.#note };

    set id(value) { this.#id = Number(value) };
    set name(value) { this.#name = value };
    set startDate(value) { this.#startDate = new Date(value) };
    set endDate(value) { this.#endDate = new Date(value) };
    set note(value) { this.#note = value; }
}

export default class SchoolYear extends AbstractModel {
    #id;
    #startDate;
    #endDate;
    #name;
    #grades = [];
    #holidays = [];
    #curricula = [];
    #created;
    #lastEdited;

    static async getSchoolYearById(id) {
        const db = new AbstractModel();
        const yearData = await db.readFromLocalDB('schoolYears', id);
        const schoolYear = this.writeDataToInstance(yearData)

        return schoolYear;
    }

    static async getSchoolYearByDate(date) {
        const allSchoolYears = await this.getAllSchoolYears();
        let today = new Date(date).setHours(12);

        let schoolYear = allSchoolYears.find(year => {
            return year.startDate.setHours(12) <= today && today <= year.endDate.setHours(12);
        })

        return schoolYear;
    }

    static async getCurrentSchoolYear() {
        const allSchoolYears = await this.getAllSchoolYears();
        let today = new Date().setHours(12);

        let schoolYear = allSchoolYears.find(year => {
            return year.startDate.setHours(12) <= today && today <= year.endDate.setHours(12);
        })

        if (!schoolYear) schoolYear = allSchoolYears[allSchoolYears.length - 1];

        return schoolYear;
    }

    static async getAllSchoolYears() {
        const db = new AbstractModel();
        const instanceArray = [];
        const allSchoolYears = await db.readAllFromLocalDB('schoolYears');

        allSchoolYears.forEach(schoolYear => {
            schoolYear = this.writeDataToInstance(schoolYear);
            instanceArray.push(schoolYear);
        })

        return instanceArray;
    }

    ///////////////////////////////////
    // schoolYear instance functions //
    ///////////////////////////////////
    async save() {
        const allSchoolYears = await SchoolYear.getAllSchoolYears();
        this.id = Fn.generateId(allSchoolYears);
        this.lastEdited = this.formatDateTime(new Date());

        const dataToSave = this.serialize();

        await this.writeToLocalDB('schoolYears', dataToSave);

        let result = await this.makeAjaxQuery('schoolYear', 'save', dataToSave);
        if (result.status == 'failed') this.writeToLocalDB('unsyncedSchoolYears', dataToSave);

    }

    async update() {
        this.lastEdited = this.formatDateTime(new Date());

        await this.updateOnLocalDB('schoolYears', this.serialize());

        let result = await this.makeAjaxQuery('schoolYear', 'update', this.serialize());

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedSchoolYears', this.serialize());
    }

    async delete() {
        await this.deleteFromLocalDB('schoolYears', this.id);
        await this.deleteFromLocalDB('unsyncedSchoolYears', this.id);

        let result = await this.makeAjaxQuery('schoolYear', 'delete', this.serialize());

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedDeletedSchoolYears', this.serialize());
    }

    updateStartAndEndDate(dates) {
        this.startDate = dates.startDate;
        this.endDate = dates.endDate;

        this.#updateName();
        this.update();
    }

    #updateName() {
        let startFullYear = this.startDate.getFullYear().toString();
        let endFullYear = this.endDate.getFullYear().toString();

        this.name = `${startFullYear}/${endFullYear[2]}${endFullYear[3]}`;
    }

    async updateGrades(value) {
        if (!Array.isArray(value)) throw new TypeError('The given value must be of type array!');

        this.#grades = value;
        await this.update();
    }

    ////////////////////////////////
    // holiday instance functions //
    ////////////////////////////////
    async addHoliday(holidayData) {
        const holiday = new Holiday(holidayData.id, holidayData.name, holidayData.startDate, holidayData.endDate);
        this.#holidays.push(holiday);

        await this.update();
    }

    async updateHoliday(holidayData) {
        const holiday = this.getHolidayById(holidayData.id);

        if (!holiday) {
            this.addHoliday(holidayData);

            return;
        }

        holiday.name = holidayData.name;
        holiday.startDate = holidayData.startDate;
        holiday.endDate = holidayData.endDate;

        await this.update();
    }

    async removeHolidayById(id) {
        let matchIndex = null;

        this.holidays.forEach((holiday, index) => {
            if (holiday.id == id) matchIndex = index;
        });

        if (matchIndex == null) throw new Error('Holiday not found');
        this.#holidays.splice(matchIndex, 1);

        await this.update();
    }

    getHolidayById(id) {
        return this.#holidays.find(holiday => { return holiday.id == id });
    }

    getHolidaysInDateRange(startDate, endDate) {
        if (startDate instanceof Date == false) startDate = new Date(startDate);
        if (endDate instanceof Date == false) endDate = new Date(endDate);

        const matchingHolidays = [];

        const startTimestamp = startDate.setHours(12, 0, 0, 0);
        const endTimestamp = endDate.setHours(12, 0, 0, 0);

        this.holidays.forEach(holiday => {
            const spanStartDate = new Date(holiday.startDate).setHours(12, 0, 0, 0);
            const spanEndDate = new Date(holiday.endDate).setHours(12, 0, 0, 0);

            if (spanStartDate <= endTimestamp && spanEndDate >= startTimestamp) {
                matchingHolidays.push(holiday);
            }
        });

        return matchingHolidays;
    }

    ///////////////////////////////////
    // curriculum instance functions //
    ///////////////////////////////////
    async addCurriculum(curriculumData) {
        if (!curriculumData.id) curriculumData.id = Fn.generateId(this.curricula);
        const curriculum = new Curriculum(curriculumData.id, curriculumData.grade, curriculumData.subject, curriculumData.curriculumSpans);
        this.#curricula.push(curriculum);

        await this.update();
    }

    async addCurriculumSpan(curriculumId, spanData) {
        const curriculum = this.getCurriculumById(curriculumId);
        const span = new CurriculumSpan(spanData.id, spanData.name, spanData.startDate, spanData.endDate, spanData.note);

        curriculum.addCurriculumSpan(span)
        await this.update();
    }

    async updateCurriculum(curriculumData) {
        const curriculum = this.getCurriculumById(curriculumData.id);

        if (!curriculum) {
            this.addCurriculum(curriculumData);

            return;
        }

        curriculum.grade = curriculumData.grade;
        curriculum.subject = curriculumData.subject;

        await this.update();
    }

    async updateCurriculumSpan(curriculumId, spanData) {
        const curriculum = this.getCurriculumById(curriculumId);
        curriculum.updateCurriculumSpan(spanData)

        await this.update();
    }

    async removeCurriculumById(id) {
        let matchIndex;

        this.curricula.forEach((curriculum, index) => {
            if (curriculum.id == id) matchIndex = index;
        });

        if (matchIndex == null) throw new Error('Curriculum not found');
        this.#curricula.splice(matchIndex, 1);

        await this.update();
    }

    async removeCurriculumSpanById(curriculumId, spanId) {
        const curriculum = this.getCurriculumById(curriculumId);
        curriculum.removeCurriculumSpanById(spanId);

        await this.update();
    }

    getCurriculumById(id) {
        return this.#curricula.find(curriculum => { return curriculum.id == id });
    }

    getCurriculumSpansInDateRange(curriculumId, startDate, endDate) {
        if (startDate instanceof Date == false) startDate = new Date(startDate);
        if (endDate instanceof Date == false) endDate = new Date(endDate);

        const curriculum = this.getCurriculumById(curriculumId);
        const matchingSpans = [];

        const startTimestamp = startDate.setHours(12, 0, 0, 0);
        const endTimestamp = endDate.setHours(12, 0, 0, 0);

        curriculum.curriculumSpans.forEach(span => {
            const spanStartDate = new Date(span.startDate).setHours(12, 0, 0, 0);
            const spanEndDate = new Date(span.endDate).setHours(12, 0, 0, 0);

            if (spanStartDate <= endTimestamp && spanEndDate >= startTimestamp) {
                matchingSpans.push(span);
            }
        });

        return matchingSpans;
    }

    //class helper functions
    serialize() {
        const serialized = {
            id: this.id,
            name: this.name,
            startDate: this.formatDate(this.startDate),
            endDate: this.formatDate(this.endDate),
            holidays: [],
            curricula: [],
            grades: this.grades,
            created: this.created,
            lastEdited: this.lastEdited,
        }

        this.holidays.forEach(holiday => {
            let item = holiday.serialize();
            serialized.holidays.push(item);
        });

        this.curricula.forEach(curriculum => {
            let item = curriculum.serialize();
            serialized.curricula.push(item);
        });

        return serialized;
    }

    static writeDataToInstance(yearData, instance = null) {
        const model = new AbstractModel;

        if (!instance) instance = new SchoolYear;

        instance.id = instance.id ?? yearData.id;
        instance.startDate = new Date(yearData.startDate);
        instance.endDate = new Date(yearData.endDate);
        if (yearData.name) { instance.name = yearData.name; } else { instance.#updateName() };
        if (yearData.created) { instance.created = yearData.created } else { instance.created = model.formatDateTime(new Date()) };
        if (yearData.lastEdited) { instance.lastEdited = yearData.lastEdited } else { instance.lastEdited = model.formatDateTime(new Date()) };
        if (yearData.grades) { yearData.grades.forEach(grade => instance.#grades.push(grade)); };
        if (yearData.holidays) {
            yearData.holidays.forEach(holiday => {
                let holidayInstance = new Holiday(holiday.id, holiday.name, holiday.startDate, holiday.endDate);
                instance.#holidays.push(holidayInstance);
            });
        }
        if (yearData.curricula) {
            yearData.curricula.forEach(curriculum => {
                let curriculumInstance = new Curriculum(curriculum.id, curriculum.grade, curriculum.subject, curriculum.curriculumSpans);
                instance.#curricula.push(curriculumInstance);
            });
        }

        return instance;
    }

    //getter
    get id() { return this.#id; }
    get startDate() { return this.#startDate; }
    get endDate() { return this.#endDate; }
    get name() { return this.#name; }
    get created() { return this.#created; }
    get lastEdited() { return this.#lastEdited; }
    get grades() { return [...this.#grades] }
    get holidays() {
        this.#holidays.sort((a, b) => { return a.startDate.setHours(12, 0, 0, 0) - b.startDate.setHours(12, 0, 0, 0) });
        return [...this.#holidays];
    }
    get curricula() { return [...this.#curricula]; }

    //setter
    set id(value) { this.#id = value; }
    set name(value) { this.#name = value; }
    set created(value) { this.#created = value; }
    set lastEdited(value) { this.#lastEdited = value; }
    set grades(value) {
        throw new Error('Teached grade entries can only be added by calling the updateGrades method! Provide an array with the grades as an argument.');
    }

    set startDate(value) {
        let date = new Date(value);
        if (isNaN(date)) throw new TypeError(`${value} is not a valid date!`);
        this.#startDate = date;
    }

    set endDate(value) {
        let date = new Date(value);
        if (isNaN(date)) throw new TypeError(`${value} is not a valid date!`);
        this.#endDate = date;
    }

    set holidays(value) {
        throw new Error('Holidays can only be added by calling the addHoliday method! Add one Instance of Holiday at a time.');
    }
    set curriculum(value) {
        throw new Error('Curriculum entries can only be added by calling the addCurriculum method! Add one Instance of Curriculum at a time.');
    }
}

