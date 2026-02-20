import AbstractModel from "./AbstractModel.js";
import { ONEDAY } from "../index.js";
import Fn from '../inc/utils.js';
import LessonController from "../Controller/LessonController.js";


export default class Lesson extends AbstractModel {

    #id;
    #class;
    #subject;
    #weekday;
    #date;
    #timeslot;
    #type;
    #canceled;
    #validFrom; //date a regular lesson was added to the scheduled timetable
    #validUntil;
    #cssColorClass
    #created;
    #lastEdited;

    constructor(className, subject) {
        super();

        this.#class = className;
        this.#subject = subject;
    }

    // static class methods
    static async getAllRegularLessons() {
        let db = new AbstractModel;
        let standardTimetable = await db.readAllFromLocalDB('timetable');
        let regularLessons = [];

        standardTimetable.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.id = entry.id;
            lesson.weekday = entry.weekday;
            lesson.timeslot = entry.timeslot;
            lesson.validFrom = entry.validFrom;
            lesson.type = 'normal';
            lesson.validFrom = entry.validFrom;
            lesson.validUntil = entry.validUntil;
            lesson.created = entry.created;
            lesson.lastEdited = entry.lastEdited;

            regularLessons.push(lesson);
        });

        regularLessons.sort((a, b) => {
            return new Date(a.validFrom).setHours(12, 0, 0, 0) - new Date(b.validFrom).setHours(12, 0, 0, 0);
        });

        return regularLessons;
    }

    static async getRegularLessonsForCurrentWeek(monday, sunday) {
        let scheduledLessons = await this.getAllRegularLessons()
        let mondayDate = new Date(monday).setHours(12, 0, 0, 0);
        let sundayDate = new Date(sunday).setHours(12, 0, 0, 0);
        let validLessons = [];

        scheduledLessons.forEach(lesson => {
            let lessonValidFrom = new Date(lesson.validFrom).setHours(12, 0, 0, 0)
            let lessonValidUntil = new Date(lesson.validUntil).setHours(12, 0, 0, 0);

            //to check whether a lesson is valid for the current week it needs a validUntil date even it has none yet
            //which is the standard for the latest timetable in the database
            if (!lesson.validUntil) lessonValidUntil = new Date().setHours(12, 0, 0, 0) + ONEDAY * 365

            //to make sure weeks with two valid timetables are displayed correctly, every day of the week has to be checked individually
            let currentDayDate = mondayDate;

            while (currentDayDate < sundayDate) {
                //only check against the day, if it's the day the lesson is scheduled for or all lessons will be pushed
                //that would be valid on monday
                if (new Date(currentDayDate).getDay() != lesson.weekday) {
                    currentDayDate += ONEDAY;
                    continue;
                }

                if (lessonValidFrom <= currentDayDate && currentDayDate <= lessonValidUntil) {
                    if (!validLessons.includes(lesson)) validLessons.push(lesson);
                }

                currentDayDate += ONEDAY;
            }
        });

        return validLessons;
    }

    static async getAllTimetableChanges() {
        let db = new AbstractModel;
        let dbData = await db.readAllFromLocalDB('timetableChanges');
        let changes = [];

        dbData.forEach((entry) => {
            let lesson = new Lesson(entry.class, entry.subject);
            lesson.id = entry.id;
            lesson.weekday = entry.weekday;
            lesson.date = new Date(entry.date);
            lesson.timeslot = entry.timeslot;
            lesson.validFrom = entry.validFrom;
            lesson.type = entry.type;
            lesson.canceled = entry.canceled;
            lesson.validFrom = entry.validFrom;
            lesson.validUntil = entry.validUntil;
            lesson.created = entry.created;
            lesson.lastEdited = entry.lastEdited;

            lesson.date.setHours(12, 0, 0, 0);

            changes.push(lesson);
        });

        changes.sort(Fn.sortByDate);

        return changes;
    }

    static async getTimetableChanges(startDate, endDate) {
        let timetableChanges = await this.getAllTimetableChanges();
        let changes = [];

        timetableChanges.forEach((entry) => {
            if (Fn.isDateInTimespan(entry.date, startDate, endDate)) changes.push(entry);
        });

        if (changes.length > 1) changes.sort(Fn.sortByDate);

        return changes;
    }

    static async getLessonById(id) {
        let db = new AbstractModel;
        let lessonData = await db.readFromLocalDB('timetableChanges', id)

        if (!lessonData) {
            console.error('No lesson found!');
            return;
        }

        let lesson = new Lesson(lessonData.class, lessonData.subject);
        lesson.id = lessonData.id;
        lesson.date = lessonData.date;
        lesson.weekday = lessonData.weekday;
        lesson.timeslot = lessonData.timeslot;
        lesson.canceled = lessonData.canceled;
        lesson.type = lessonData.type;
        lesson.created = lessonData.created;
        lesson.lastEdited = lessonData.lastEdited;

        return lesson;
    }

    static async getOldTimetableCopy() {
        return await this.getAllRegularLessons();
    };

    static async getOldTimetableChanges() {
        return await this.getAllTimetableChanges();

    };

    async filterAffectedLessonChanges(affectedLessonChanges, timetable, isNewTimetable) {
        let filteredLessonChanges = [];
        let lessonsToDelete = [];

        //a new timetable deletes all canceled lessons, but keeps substitute lessons and appointements after its valid date, 
        //because they could potentially still be valid
        if (isNewTimetable) {
            for (let lesson of affectedLessonChanges) {
                if (lesson.type == 'appointement' || lesson.type == 'sub') {
                    filteredLessonChanges.push(lesson);
                    continue;
                }

                lessonsToDelete.push(lesson);
                await this.deleteFromLocalDB('timetableChanges', lesson.id);
            }
        }

        //an updated timetable deletes canceled lessons, if the canceled lessons don't exist anymore according to the new plan
        //other canceled lessons, substitute lessons and appointements are kept for the user to review
        if (!isNewTimetable) {
            for (let lesson of affectedLessonChanges) {
                if (lesson.type == 'appointement' || lesson.type == 'sub') {
                    filteredLessonChanges.push(lesson);
                    continue;
                }

                //does the canceled lesson still exist and is not a lesson canceled because of holidays?
                let match = false;

                if (lesson.canceled == 'true' && lesson.type != 'holiday') {
                    timetable.forEach(entry => {
                        if (
                            lesson.class == entry.class &&
                            lesson.subject == entry.subject &&
                            lesson.weekday == entry.weekday &&
                            lesson.timeslot == entry.timeslot
                        ) {
                            match = true;
                        }
                    });
                }

                if (match) {
                    filteredLessonChanges.push(lesson);
                } else {
                    lessonsToDelete.push(lesson);
                    await this.deleteFromLocalDB('timetableChanges', lesson.id);
                }
            }
        }

        await Lesson.batchDelete(lessonsToDelete);

        return filteredLessonChanges;
    }

    //this function handles rare cases, where there is a new or updated timetable and the user chose to keep substitute lessons, that
    //fall in the period of the new timetable. If those occupy a timeslot of a regular lesson of the new timetable, this regular lessons
    //must be canceled automatically to ensure correct reordering of tasks later on
    async handleTimetableChangesCarryover(remainingLessonIds, timetableValidFromDate) {
        let allTimetables = await Lesson.getAllRegularLessons();
        let timetable = [];

        allTimetables.forEach(lesson => { if (lesson.validFrom == timetableValidFromDate) timetable.push(lesson) });

        for (let id of remainingLessonIds) {
            let allTimetableChanges = await Lesson.getAllTimetableChanges()
            let remainingLesson = await Lesson.getLessonById(id);

            if (remainingLesson.canceled == 'true') continue;

            timetable.forEach(regularLesson => {
                if (regularLesson.weekday == remainingLesson.weekday && regularLesson.timeslot == remainingLesson.timeslot) {

                    //if there is a match, the regular lesson and the remaining substitute lesson need to swap places in the database
                    //in order to be rendered correctly (hence the id swap and update on the regular lesson)
                    regularLesson.canceled = 'true';
                    regularLesson.date = remainingLesson.date;
                    regularLesson.created = remainingLesson.created;
                    regularLesson.lastEdited = regularLesson.created;
                    regularLesson.id = remainingLesson.id;
                    regularLesson.validFrom = undefined;
                    regularLesson.validUntil = undefined;

                    remainingLesson.id = Fn.generateId(allTimetableChanges);

                    regularLesson.update();
                    remainingLesson.save();
                }
            });

        }
    }

    static async setLessonsInHolidaysCanceled(schoolYears, startDate = null) {
        startDate ? startDate = new Date(startDate).setHours(12, 0, 0, 0) : startDate = new Date().setHours(12, 0, 0, 0);

        const allLessons = await this.getAllRegularLessons();
        let timetableChanges = await this.getAllTimetableChanges();

        const filteredSchoolYears = schoolYears.filter(schoolYear => {
            return new Date(schoolYear.startDate).setHours(12, 0, 0, 0) <= startDate && new Date(schoolYear.endDate).setHours(12, 0, 0, 0) >= startDate
        });
        const filteredLessons = allLessons.filter(lesson => lesson.validUntil == null || new Date(lesson.validUntil).setHours(12, 0, 0, 0) >= startDate)
        const subjectsByClassName = {};

        filteredLessons.forEach(lesson => {
            if (!subjectsByClassName[lesson.class]) subjectsByClassName[lesson.class] = [];
            if (!subjectsByClassName[lesson.class].includes(lesson.subject)) subjectsByClassName[lesson.class].push(lesson.subject);
        })

        //delete all canceled lessons of type holiday before creating new ones
        const lessonsToDelete = timetableChanges.filter(canceledLesson => canceledLesson.type == 'holiday' && new Date(canceledLesson.date).setHours(12, 0, 0, 0) > startDate);

        await Lesson.batchDelete(lessonsToDelete);

        //get all holidays of all filteredSchoolYears, calculate the lessons that would take place in the timespan of said holidays and cancel them
        const allHolidays = [];
        const lessonsToSave = [];

        filteredSchoolYears.forEach(schoolYear => allHolidays.push(...schoolYear.holidays));

        for (let holiday of allHolidays) {
            if (new Date(holiday.endDate).setHours(12, 0, 0, 0) < startDate) continue;

            for (let className of Object.keys(subjectsByClassName)) {
                for (let subject of subjectsByClassName[className]) {
                    const allLessonDates = await this.calculateAllLessonDates(className, subject, holiday.endDate, startDate);

                    // filter out dates before the holiday starts
                    const lessonsToCancel = allLessonDates.filter(lesson => new Date(lesson.date).setHours(12, 0, 0, 0) >= new Date(holiday.startDate).setHours(12, 0, 0, 0))
                    for (let lessonToCancel of lessonsToCancel) {
                        const lesson = new Lesson(className, subject);
                        lesson.date = lessonToCancel.date;
                        lesson.weekday = lessonToCancel.date.getDay();
                        lesson.timeslot = lessonToCancel.timeslot;
                        lesson.type = 'holiday';
                        lesson.canceled = 'true';

                        lessonsToSave.push(lesson);
                    }
                }
            }
        }

        await Lesson.batchSave(lessonsToSave);
    }

    static async batchSave(lessonsArray) {
        let model = new AbstractModel;
        const serializedArray = [];
        let timetableChanges = await LessonController.getAllTimetableChanges();

        for (const lesson of lessonsArray) {

            if (lesson.subject == 'Termin') lesson.type = 'appointement';

            lesson.id = Fn.generateId(timetableChanges);
            lesson.lastEdited = model.formatDateTime(new Date());
            lesson.created = lesson.lastEdited;

            const serializedLesson = lesson.serialize();
            serializedArray.push(serializedLesson);
            timetableChanges.push(serializedLesson);

            await lesson.writeToLocalDB('timetableChanges', serializedLesson);
        }

        let result = await model.makeAjaxQuery('lesson', 'save', serializedArray);

        if (result.status == 'failed') {
            for (const lesson of serializedArray) {
                model.writeToLocalDB('unsyncedTimetableChanges', lesson);
            }
        }
    }

    static async batchDelete(lessonsArray) {
        let model = new AbstractModel;
        const serializedArray = [];

        for (const lesson of lessonsArray) {
            serializedArray.push(lesson.serialize());

            await lesson.deleteFromLocalDB('timetableChanges', lesson.id);
            await lesson.deleteFromLocalDB('unsyncedTimetableChanges', lesson.id);
            await lesson.deleteFromLocalDB('unsyncedDeletedTimetableChanges', lesson.id);
        }

        let result = await model.makeAjaxQuery('lesson', 'delete', serializedArray);

        if (result.status == 'failed') {
            for (const lesson of serializedArray) {
                model.writeToLocalDB('unsyncedDeletedTimetableChanges', lesson);
            }
        }
    }

    //public class methods
    async save() {
        let timetableChanges = await LessonController.getAllTimetableChanges();

        if (this.subject == 'Termin') this.type = 'appointement';

        this.id = Fn.generateId(timetableChanges);
        this.lastEdited = this.formatDateTime(new Date());
        this.created = this.lastEdited;

        await this.writeToLocalDB('timetableChanges', this.serialize());
        let result = await this.makeAjaxQuery('lesson', 'save', [this.serialize()]);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedTimetableChanges', this.serialize());
    }

    async delete() {
        let deletedItem = await this.readFromLocalDB('timetableChanges', this.id);
        this.deleteFromLocalDB('timetableChanges', this.id);
        this.deleteFromLocalDB('unsyncedTimetableChanges', this.id);

        let result = await this.makeAjaxQuery('lesson', 'delete', [this.serialize()]);

        if (result.status == 'failed') this.writeToLocalDB('unsyncedDeletedTimetableChanges', deletedItem);
    }

    async update() {
        if (this.subject == 'Termin') this.type = 'appointement';
        this.lastEdited = this.formatDateTime(new Date());

        this.updateOnLocalDB('timetableChanges', this.serialize());
        let result = await this.makeAjaxQuery('lesson', 'update', this.serialize());

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedTimetableChanges', this.serialize());
    }

    async cancel() {
        this.canceled = 'true';
        this.lastEdited = this.formatDateTime(new Date());

        //lessons with an id are already on the timetablechanges table and must be updated
        if (this.id != undefined) {

            this.updateOnLocalDB('timetableChanges', this.serialize());
            let result = await this.makeAjaxQuery('lesson', 'cancel', this.serialize());

            if (result.status == 'failed') this.updateOnLocalDB('unsyncedTimetableChanges', this.serialize());

            return;
        }

        let timetableChanges = await LessonController.getAllTimetableChanges();

        this.id = Fn.generateId(timetableChanges);

        this.writeToLocalDB('timetableChanges', this.serialize());
        let result = await this.makeAjaxQuery('lesson', 'addCanceled', this.serialize());

        if (result.status == 'failed') this.writeToLocalDB('unsyncedTimetableChanges', this.serialize());
    }

    async uncancel() {
        this.canceled = 'false';
        this.lastEdited = this.formatDateTime(new Date());

        this.updateOnLocalDB('timetableChanges', this.serialize())
        let result = await this.makeAjaxQuery('lesson', 'uncancel', this.serialize())

        if (result.status == 'failed') this.updateOnLocalDB('unsyncedTimetableChanges', this.serialize());
    }

    serialize() {
        let serialized = {
            id: this.id,
            class: this.class,
            subject: this.subject,
            timeslot: this.timeslot,
        }

        if (this.weekday) serialized.weekday = this.weekday;
        if (this.date) serialized.date = this.formatDate(this.date);
        if (this.type) serialized.type = this.type;
        if (this.canceled) serialized.canceled = this.canceled;
        if (this.validFrom) serialized.validFrom = this.validFrom;
        if (this.validUntil) serialized.validUntil = this.validUntil;
        if (this.created) serialized.created = this.created;
        if (this.lastEdited) serialized.lastEdited = this.lastEdited;

        return serialized;
    }

    //generic getters
    get id() {
        return this.#id;
    }

    get class() {
        return this.#class;
    }

    get subject() {
        return this.#subject;
    }

    get weekday() {
        return this.#weekday;
    }

    get date() {
        return this.#date;
    }

    get timeslot() {
        return this.#timeslot;
    }

    get canceled() {
        return this.#canceled;
    }

    get type() {
        return this.#type;
    }

    get validFrom() {
        return this.#validFrom;
    }

    get validUntil() {
        return this.#validUntil;
    }

    get cssColorClass() {
        return this.#cssColorClass;
    }

    get created() {
        return this.#created;
    }

    get lastEdited() {
        return this.#lastEdited;
    }

    // generic setters
    set id(id) {
        this.#id = id;
    }

    set class(className) {
        this.#class = className;
    }

    set subject(subject) {
        this.#subject = subject;
    }

    set weekday(weekday) {
        this.#weekday = weekday;
    }

    set date(date) {
        this.#date = new Date(date);
    }

    set timeslot(timeslot) {
        this.#timeslot = timeslot;
    }

    set type(type) {
        this.#type = type;
    }

    set canceled(bool) {
        this.#canceled = bool;
    }

    set validFrom(date) {
        this.#validFrom = date;
    }

    set validUntil(date) {
        this.#validUntil = date;
    }

    set cssColorClass(cssClass) {
        this.#cssColorClass = cssClass;
    }

    set created(created) {
        this.#created = created;
    }

    set lastEdited(lastEdited) {
        this.#lastEdited = lastEdited;
    }
}