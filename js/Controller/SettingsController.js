import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";

export default class SettingsController {

    static saveSubject(subject) {
        
        if (subject.name == '') {
            View.alertSubjectNameInput();
        }
        
        if (subject.colorCssClass == undefined) {
            View.alertColorSelection();
        }

        console.log('jo!')
    }

    static deleteSubject(id){
        let model = new Settings;
        
        model.deleteSubject(id);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
    }
}