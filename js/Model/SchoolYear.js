import AbstractModel from "./AbstractModel.js";

export class Holiday {
    #name;
    #startDate;
    #endDate;

    constructor(name, startDate, endDate = null) {
        this.#name = name;
        this.#startDate = new Date(startDate);
        if (!endDate) {
            this.#endDate = this.#startDate;
        } else {
            this.#endDate = new Date(endDate);
        }
    }

    get name() { return this.#name };
    get startDate() { return this.#startDate };
    get endDate() { return this.#endDate };
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
                new Holiday('Herbstferien', '2023-10-02', '2023-10-14'),
                new Holiday('Weihnachtsferien', '2023-12-22', '2024-01-05'),
                new Holiday('Winterferien', '2024-02-12', '2024-02-16'),
                new Holiday('schulintern', '2024-03-01'),
                new Holiday('Osterferien', '2024-03-23', '2024-04-06'),
                new Holiday('Sommerferien', '2024-06-20', '2024-07-31'),
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
                new Holiday('Herbstferien', '2024-09-30', '2024-10-12'),
                new Holiday('Weihnachtsferien', '2024-12-23', '2025-01-03'),
                new Holiday('schulintern', '2025-02-14'),
                new Holiday('Winterferien', '2025-02-03', '2025-02-08'),
                new Holiday('Osterferien', '2025-04-07', '2025-04-19'),
                new Holiday('Sommerferien', '2025-06-28', '2025-08-08'),
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
                new Holiday('Herbstferien', '2024-09-30', '2024-10-12'),
                new Holiday('Weihnachtsferien', '2024-12-23', '2025-01-03'),
                new Holiday('Winterferien', '2025-02-03', '2025-02-08'),
                new Holiday('Osterferien', '2025-04-07', '2025-04-19'),
                new Holiday('schulintern', '2025-05-14'),
                new Holiday('Sommerferien', '2025-06-28', '2025-08-08'),
            ],
            created: '2024-11-08',
            lastEdited: '2024-11-08',
        }
    ];

    static async getSchoolYearById(id) {
        const allSchoolYears = await this.getAllSchoolYears();
        const schoolYear = allSchoolYears.find(year => { return year.id == id });

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
        const instanceArray = [];
        const allSchoolYears = this.schoolYearMockup;

        allSchoolYears.forEach(schoolYear => {
            schoolYear = this.writeDataToInstance(schoolYear);
            instanceArray.push(schoolYear);
        })

        return instanceArray;
    }

    static writeDataToInstance(yearData) {
        let instance = new SchoolYear;

        instance.id = yearData.id;
        instance.name = yearData.name;
        instance.startDate = new Date(yearData.startDate);
        instance.endDate = new Date(yearData.endDate);
        instance.created = yearData.created;
        instance.lastEdited = yearData.lastEdited;

        yearData.holidays.forEach(holiday => {
            let holidayInstance = new Holiday(holiday.name, holiday.startDate, holiday.endDate);
            instance.#holidays.push(holidayInstance);
        });

        return instance;
    }

    addHoliday(holiday) {
        if (!(holiday instanceof Holiday)) throw new TypeError('Value is not an instance of Holiday.');
        this.#holidays.push(holiday);
    }

    removeHolidayByIndex(index) {
        if (!this.#holidays[index]) throw new Error('Holiday not found');
        this.#holidays.splice(index, 1);
    }

    getHolidayByIndex(index) {
        return this.#holidays[index];
    }


    //getter
    get id() { return this.#id; }
    get startDate() { return this.#startDate; }
    get endDate() { return this.#endDate; }
    get name() { return this.#name; }
    get holidays() { return [...this.#holidays]; }
    get created() { return this.#created; }
    get lastEdited() { return this.#lastEdited; }

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

