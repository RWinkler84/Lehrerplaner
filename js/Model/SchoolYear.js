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

export default class SchoolYear extends AbstractModel {
    #id;
    #startDate;
    #endDate;
    #name;
    #holidays = [];
    #created;
    #lastEdited;

    static schoolYearMockup = [
        {
            id: 1,
            name: '2023/24',
            startDate: new Date('2023-08-01'),
            endDate: new Date('2024-07-31'),
            holidays: [
                new Holiday(1, 'Herbstferien', '2023-10-02', '2023-10-14'),
                new Holiday(2, 'Weihnachtsferien', '2023-12-22', '2024-01-05'),
                new Holiday(3, 'Winterferien', '2024-02-12', '2024-02-16'),
                new Holiday(4, 'schulintern', '2024-03-01'),
                new Holiday(5, 'Osterferien', '2024-03-23', '2024-04-06'),
                new Holiday(6, 'Sommerferien', '2024-06-20', '2024-07-31'),
            ],
            created: '2023-07-23',
            lastEdited: '2023-11-08',
        },
        {
            id: 2,
            name: '2024/25',
            startDate: new Date('2024-08-01'),
            endDate: new Date('2025-07-31'),
            holidays: [
                new Holiday(1, 'Herbstferien', '2024-09-30', '2024-10-12'),
                new Holiday(2, 'Weihnachtsferien', '2024-12-23', '2025-01-03'),
                new Holiday(3, 'schulintern', '2025-02-14'),
                new Holiday(4, 'Winterferien', '2025-02-03', '2025-02-08'),
                new Holiday(5, 'Osterferien', '2025-04-07', '2025-04-19'),
                new Holiday(6, 'Sommerferien', '2025-06-28', '2025-08-08'),
            ],
            created: '2024-11-08',
            lastEdited: '2024-11-08',
        },
        {
            id: 3,
            name: '2025/26',
            startDate: new Date('2025-08-01'),
            endDate: new Date('2026-07-31'),
            holidays: [
                new Holiday(1, 'Herbstferien', '2025-10-06', '2025-10-18'),
                new Holiday(2, 'Weihnachtsferien', '2025-12-22', '2026-01-03'),
                new Holiday(3, 'Winterferien', '2026-02-16', '2026-02-21'),
                new Holiday(4, 'Osterferien', '2026-04-07', '2026-04-17'),
                new Holiday(5, 'schulintern', '2026-05-14'),
                new Holiday(6, 'Sommerferien', '2026-07-04', '2026-08-14'),
            ],
            created: '2024-11-08',
            lastEdited: '2024-11-08',
        }
    ];

    static async writeMockupDataToDB() {
        const db = new AbstractModel();
        const mockupData = [];

        this.schoolYearMockup.forEach(item => {
            let year = this.writeDataToInstance(item);
            mockupData.push(year);
        })

        mockupData.forEach(item => {
            db.writeToLocalDB('schoolYears', item.serialize());
        })
    }

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

    async save() {
        const allSchoolYears = await SchoolYear.getAllSchoolYears();
        this.id = Fn.generateId(allSchoolYears);
        this.lastEdited = this.formatDateTime(new Date());

        await this.writeToLocalDB('schoolYears', this.serialize());
    }

    async update() {
        this.lastEdited = this.formatDateTime(new Date());

        await this.updateOnLocalDB('schoolYears', this.serialize());
    }

    async delete() {
        await this.deleteFromLocalDB('schoolYears', this.id);
    }

    updateStartAndEndDate(dates) {
        this.startDate = dates.startDate;
        this.endDate = dates.endDate;

        this.#updateName();
        this.update();
    }

    // holiday instance functions
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
        let matchIndex;

        this.holidays.forEach((holiday, index) => {
            if (holiday.id == id) matchIndex = index;
        });

        if (!matchIndex) throw new Error('Holiday not found');
        this.#holidays.splice(matchIndex, 1);

        this.update();
    }

    getHolidayById(id) {
        return this.#holidays.find(holiday => { return holiday.id == id });
    }

    #updateName() {
        let startFullYear = this.startDate.getFullYear().toString();
        let endFullYear = this.endDate.getFullYear().toString();

        this.name = `${startFullYear}/${endFullYear[2]}${endFullYear[3]}`;
    }

    serialize() {
        const serialized = {
            id: this.id,
            name: this.name,
            startDate: this.formatDate(this.startDate),
            endDate: this.formatDate(this.endDate),
            holidays: [],
            created: this.created,
            lastEdited: this.lastEdited,
        }

        this.holidays.forEach(holiday => {
            let item = holiday.serialize();
            serialized.holidays.push(item);
        })

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
        if (yearData.holidays) {
            yearData.holidays.forEach(holiday => {
                let holidayInstance = new Holiday(holiday.id, holiday.name, holiday.startDate, holiday.endDate);
                instance.#holidays.push(holidayInstance);
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
    get holidays() {
        this.#holidays.sort((a, b) => { return a.startDate.setHours(12, 0, 0, 0) - b.startDate.setHours(12, 0, 0, 0) });
        return [...this.#holidays];
    }

    //setter
    set id(value) { this.#id = value; }
    set name(value) { this.#name = value; }
    set created(value) { this.#created = value; }
    set lastEdited(value) { this.#lastEdited = value; }

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
}

