import Settings from "../Model/Settings.js";
import View from "../View/SettingsView.js";

export default class SettingsController {

    static saveSubject(subject) {
        let model = new Settings;

        if (subject.subject == '') {
            View.alertSubjectNameInput();

            return;
        }

        if (subject.colorCssClass == undefined) {
            View.alertColorSelection();

            return;
        }

        model.saveSubject(subject);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
    }

    static deleteSubject(id) {
        let model = new Settings;

        model.deleteSubject(id);

        View.renderExistingSubjects();
        View.renderSelectableLessonColors();
    }
}