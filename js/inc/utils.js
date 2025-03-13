export default class Utils {


    static hasLesson(element) {
        let bool = false;

        if (element.classList.contains('lesson')) {
            return true;
        }

        element.querySelectorAll('*').forEach(child => {
            if (child.classList.contains('lesson')) {
                bool = true;
            }
        });

        return bool;
    }

    static isDateInWeek(date, mondayDate, sundayDate) {
        let dateToTest = new Date(date).setHours(0, 0, 0, 0);
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

    static getNumberOfWeeksPerYear(year) {
        let nextNewYear = new Date('1.1.' + (year + 1)).getTime();
        let firstThursday = getFirstThirsdayOfTheYear(year);

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
        let firstDay = new Date('1.1.' + year);

        if (firstDay.getDay() != 4) {
            while (firstDay.getDay() != 4) {
                firstDay = firstDay.getTime() + 86400000;
                firstDay = new Date(firstDay);
            }
        }

        return firstDay.getTime();
    }


    static generateTaskId() {
        let lessons = document.querySelectorAll('.lesson');
        let lessonIds = [];

        lessons.forEach((lesson) => {
            lessonIds.push(Number(lesson.dataset.taskid));
        })

        return Math.max(...lessonIds) + 1; //adds 1 to the highest existing lesson id
    }

    static sortByDate(a, b) {
        if (a.date < b.date) return -1;
        if (a.date == b.date) return 0;
        if (a.date > b.date) return 1;

    }

}