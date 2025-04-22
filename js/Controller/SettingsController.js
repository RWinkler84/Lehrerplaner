import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";

export default class SettingsController {
    static deleteSubject(id){
        let model = new Settings;
        
        model.deleteSubject(id);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
    }
}