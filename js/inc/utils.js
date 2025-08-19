import { allTasksArray, timetableChanges, ONEDAY } from "../index.js";

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

    static isDateInTimespan(date, startDate, endDate) {
        let dateToTest = new Date(date).setHours(12, 0, 0, 0);
        let start = new Date(startDate).setHours(12, 0, 0, 0);
        let end = new Date(endDate).setHours(12, 0, 0, 0);

        if (start <= dateToTest && dateToTest <= end) return true;

        return false;
    }

    static formatSubjectName(name) {
        let reformated = []

        for (let i = 0; i < name.length; i++) {
            if (i == 0) {
                reformated[i] = name[i].toUpperCase()
            } else {
                reformated[i] = name[i].toLowerCase();
            }
        }

        return reformated.join('');
    }

    static formatClassName(name) {
        //if the first character is a number, it is most likely a class name and should be reformated to lowercase
        //otherwise just return the unchanged string
        if (isNaN(Number(name[0]))) return name;

        return name.toLowerCase();
    }

    static formatDate(date) {
        date = new Date(date);
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

        let timeString = dateObject.getFullYear() + '-' + (dateObject.getMonth() + 1).toString().padStart(2, '0') + '-' + dateObject.getDate().toString().padStart(2, '0');

        return timeString;
    }

    static getNumberOfWeeksPerYear(year) {
        let nextNewYear = new Date((year + 1), 0 ,1).getTime();
        let firstThursday = Utils.getFirstThirsdayOfTheYear(year);

        let weeksPerYear = 0;

        //count up until it is the next year starting with 0 because the first 
        while (firstThursday < nextNewYear) {
            firstThursday = firstThursday + ONEDAY * 7;

            weeksPerYear++;
        }

        return weeksPerYear;
    }

    //find the first thursday of the year, which marks the first calendar week
    static getFirstThirsdayOfTheYear(year) {
        let firstDay = new Date(year + '-01-01');

        if (firstDay.getDay() != 4) {
            while (firstDay.getDay() != 4) {
                firstDay = firstDay.getTime() + ONEDAY;
                firstDay = new Date(firstDay);
            }
        }

        return firstDay.getTime();
    }

    static getFirstAndLastDayOfWeek(date) {
        let monday = new Date(date).setHours(12, 0, 0, 0);

        while (new Date(monday).getDay() != 1) monday -= ONEDAY;

        let sunday = monday + ONEDAY * 6;

        return {
            'monday': new Date(monday),
            'sunday': new Date(sunday)
        }
    }

    static generateId(baseArray) {
        let allIds = [];

        baseArray.forEach((entry) => {
            if (entry.id == undefined) return;
            allIds.push(Number(entry.id));
        })

        if (allIds.length == 0) allIds = [0];
        return Math.max(...allIds) + 1; //adds 1 to the highest existing lesson id
    }

    static sortByDate(a, b) {

        let firstDate = a.date;
        let secondDate = b.date;
        if (!a.date) {

            firstDate = a;
            secondDate = b;
        }

        return new Date(firstDate).setHours(12, 0, 0, 0) - new Date(secondDate).setHours(12, 0, 0, 0);
    }

    static sortByDateAndTimeslot(data) {
        let grouped = {};
        let groupedKeys;
        let sorted = [];

        data.forEach(entry => {
            grouped[entry.date] ? grouped[entry.date].push(entry) : grouped[entry.date] = [entry];
        });

        groupedKeys = Object.keys(grouped);
        groupedKeys.sort(this.sortByDate);

        groupedKeys.forEach(key => {
            if (grouped[key].length > 1) grouped[key].sort((a, b) => {
                return a.timeslot - b.timeslot;
            });
            grouped[key].forEach(entry => sorted.push(entry));
        });

        return sorted;
    }

    static getCssColorClass(lesson, allSubjects) {
            let match;

            allSubjects.forEach((subject) => {
                if (subject.subject == lesson.subject) match = subject.colorCssClass;
            })
    
            return match;
        }
}