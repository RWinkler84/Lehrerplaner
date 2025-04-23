import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";

export default class SettingsController {

    static saveSubject(subject) {
        let model = new Settings;

        if (subject.name == '') {
            View.alertSubjectNameInput();

            return;
        }

        if (subject.colorCssClass == undefined) {
            View.alertColorSelection();

            return;
        }

        model.saveSubject(subject);

    }

    static deleteSubject(id) {
        let model = new Settings;

        model.deleteSubject(id);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
    }
}