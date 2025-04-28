import Model from "../Model/AbstractModel.js";

export default class AbstractController {

    #db

    constructor()
    {
        this.#db = new Model();
    }

    async getSubjectsFromDatabase(){
       return await this.#db.makeAjaxQuery('abstract','getSubjects');
    }

    async getTimetableFromDatabase() {
        return await this.#db.makeAjaxQuery('abstract', 'getTimetable');
    }

    async getTimetableChangesFromDatabase() {
        return await this.#db.makeAjaxQuery('abstract', 'getTimetableChanges');
    }

    async getAllTasksFromDatabase() {
        return await this.#db.makeAjaxQuery('abstract', 'getAllTasks');
    }

    static getAllSubjects(){
        return Model.getAllSubjects();
    }
}