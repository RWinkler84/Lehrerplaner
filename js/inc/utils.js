import { allTasksArray, timetableChanges } from "../index.js";

export default class Utils {


    static hasLesson(element) {
        let bool = false;

        if (element.classList.contains('lesson') || element.classList.contains('settingsLesson')) {
            return true;
        }

        element.querySelectorAll('*').forEach(child => {
            if (child.classList.contains('lesson') || child.classList.contains('settingsLesson')) {
                bool = true;
            }
        });

        return bool;
    }

    static isDateInWeek(date, mondayDate, sundayDate) {
        let dateToTest = new Date(date).setHours(12, 0, 0, 0);
        let monday = new Date(mondayDate);
        let sunday = new Date(sundayDate);

        if (monday <= dateToTest && dateToTest <= sunday) return true;

        return false;
    }

    static formatDate(date) {
        let formatter = new Intl.DateTimeFormat('de-DE', {
            month: '2-digit',
            day: '2-digit'
        });

        return formatter.format(date);
    }

    static formatDateWithFullYear(date) {
        let formatter = new Intl.DateTimeFormat('de-DE', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });

        return formatter.format(date);
    }

    static formatDateSqlCompatible(date) {
        let dateObject = new Date(date);

        let timeString = dateObject.getFullYear() + '-' + (dateObject.getMonth() + 1).toString().padStart(2,'0') + '-' + dateObject.getDate().toString().padStart(2, '0');

        return timeString;
    }

    static getNumberOfWeeksPerYear(year) {
        let nextNewYear = new Date((year + 1) + '01-01').getTime();
        let firstThursday = Utils.getFirstThirsdayOfTheYear(year);

        let weeksPerYear = 0;

        //count up until it is the next year starting with 0 because the first 
        while (firstThursday < nextNewYear) {
            firstThursday = firstThursday + 86400000 * 7;

            weeksPerYear++;
        }

        return weeksPerYear;
    }

    //find the first thursday of the year, which marks the first calendar week
    static getFirstThirsdayOfTheYear(year) {
        let firstDay = new Date(year + '-01-01');

        if (firstDay.getDay() != 4) {
            while (firstDay.getDay() != 4) {
                firstDay = firstDay.getTime() + 86400000;
                firstDay = new Date(firstDay);
            }
        }

        return firstDay.getTime();
    }

    static getFirstAndLastDayOfWeek(date) {
        let monday = new Date(date).setHours(12, 0, 0, 0);

        while (new Date(monday).getDay() != 1) monday -= 86400000;

        let sunday = monday + 86400000 * 6;

        return {
            'monday': new Date(monday),
            'sunday': new Date(sunday)
        }
    }

    static generateId(baseArray) {
        let allIds = [];

        baseArray.forEach((entry) => {
            allIds.push(Number(entry.id));
        })

        if (allIds.length == 0) allIds = [0];

        return Math.max(...allIds) + 1; //adds 1 to the highest existing lesson id
    }

    static sortByDate(a, b) {
        if (!a.date) {
            a.date = a;
            b.date = b;
        }

        return new Date(a.date).setHours(12, 0, 0, 0) - new Date(b.date).setHours(12, 0, 0, 0);
    }
}