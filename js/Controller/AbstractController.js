import Model from "../Model/AbstractModel.js";

export default class AbstractController {

    #db

    constructor()
    {
        this.#db = new Model();
    }

    async getSubjects(){
       return await this.#db.makeAjaxQuery('abstract','getSubjects');
    }

    async getTimetable() {
        return await this.#db.makeAjaxQuery('abstract', 'getTimetable');
    }

    async getTimetableChanges() {
        return await this.#db.makeAjaxQuery('abstract', 'getTimetableChanges');
    }

    async getAllTasks() {
        return await this.#db.makeAjaxQuery('abstract', 'getAllTasks');
    }
}