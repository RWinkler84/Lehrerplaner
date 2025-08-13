import Model from "../Model/AbstractModel.js";
import AbstractView from "../View/AbstractView.js";
import SettingsView from "../View/SettingsView.js";
import SettingsController from "./SettingsController.js";

export default class AbstractController {

    #db

    constructor() {
        this.#db = new Model();
    }

    static getAllSubjects() {
        return Model.getAllSubjects();
    }
}