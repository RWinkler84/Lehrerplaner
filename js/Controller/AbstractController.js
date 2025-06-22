import Model from "../Model/AbstractModel.js";
import AbstractView from "../View/AbstractView.js";

export default class AbstractController {

    #db

    constructor() {
        this.#db = new Model();
    }

    static getAllSubjects() {
        return Model.getAllSubjects();
    }
}