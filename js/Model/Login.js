import AbstractModel from "./AbstractModel.js";
import Controller from "../Controller/LoginController.js";
import { mailStatus, ONEMIN } from "../index.js";

export default class Login extends AbstractModel {

    async attemptLogin(loginData) {

        const errorMessageDisplay = loginDialog.querySelector('.errorMessageDisplay');
        let result;

        if (loginData) {
            result = await this.makeAjaxQuery('user', 'login', loginData);
            if (result.status == 'success') await this.updateAccountType();

            return result;
        }
    }

    async attemptPasswordReset(formData) {

        let result = await this.makeAjaxQuery('user', 'resetPassword', formData);
        return result;
    }

    async createGuestAccount() {
        let data = {
            id: 1,
            accountType: 'guestUser',
            temporarilyOffline: true
        }

        await this.writeToLocalDB('settings', data);

        data = [
            { "id": "1", "subject": "De", "colorCssClass": "subjectColorOne", "lastEdited": "2025-06-13 12:14:18" },
            { "id": "3", "subject": "Sk", "colorCssClass": "subjectColorFive", "lastEdited": "2025-06-19 13:18:25" },
            { "id": "4", "subject": "Ge", "colorCssClass": "subjectColorThree", "lastEdited": "2025-06-19 13:54:17" }
        ];

        await this.writeToLocalDB('subjects', data);

        data = [
            { "id": "3", "date": "2025-06-24", "timeslot": "2", "class": "8a", "subject": "Ge", "description": "Beginnende Industrialisierung vorbereiten", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:46:50" },
            { "id": "6", "date": "2025-06-23", "timeslot": "4", "class": "7c", "subject": "Ge", "description": "Steckbrief Ludwig XIV", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:47:26" },
            { "id": "7", "date": "2025-06-24", "timeslot": "3", "class": "6a", "subject": "De", "description": "Arbeitsblatt Wortarten", "status": "inProgress", "fixedTime": "0", "lastEdited": "2025-06-19 13:57:59" },
            { "id": "8", "date": "2025-06-25", "timeslot": "3", "class": "8b", "subject": "Sk", "description": "Leben in der Gemeinde", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:48:42" },
            { "id": "9", "date": "2025-06-25", "timeslot": "4", "class": "6a", "subject": "De", "description": "Kk Wortarten", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:57:59" },
            { "id": "10", "date": "2025-06-25", "timeslot": "2", "class": "6b", "subject": "De", "description": "Kk Wortarten", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:49:23" },
            { "id": "11", "date": "2025-06-27", "timeslot": "1", "class": "6b", "subject": "De", "description": "Rückgabe Kk", "status": "open", "fixedTime": "0", "lastEdited": "2025-06-19 13:49:58" },
            { "id": "13", "date": "2025-06-26", "timeslot": "4", "class": "10a", "subject": "Ge", "description": "Gruppenarbeit Wiedervereinigung", "status": "inProgress", "fixedTime": "0", "lastEdited": "2025-06-19 13:51:02" }
        ];

        await this.writeToLocalDB('tasks', data);

        data = [
            { "id": "1", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekday": "1", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "2", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekday": "1", "timeslot": "3", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "3", "validFrom": "2025-06-13", "validUntil": null, "class": "7c", "subject": "Ge", "weekday": "1", "timeslot": "4", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "4", "validFrom": "2025-06-13", "validUntil": null, "class": "9b", "subject": "Ge", "weekday": "1", "timeslot": "5", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "5", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekday": "2", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "6", "validFrom": "2025-06-13", "validUntil": null, "class": "8a", "subject": "Ge", "weekday": "2", "timeslot": "2", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "7", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekday": "2", "timeslot": "3", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "8", "validFrom": "2025-06-13", "validUntil": null, "class": "8a", "subject": "Sk", "weekday": "2", "timeslot": "5", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "9", "validFrom": "2025-06-13", "validUntil": null, "class": "10a", "subject": "Ge", "weekday": "3", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "10", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekday": "3", "timeslot": "2", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "11", "validFrom": "2025-06-13", "validUntil": null, "class": "8b", "subject": "Sk", "weekday": "3", "timeslot": "3", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "12", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekday": "3", "timeslot": "4", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "13", "validFrom": "2025-06-13", "validUntil": null, "class": "9a", "subject": "Sk", "weekday": "3", "timeslot": "6", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "14", "validFrom": "2025-06-13", "validUntil": null, "class": "8a", "subject": "Ge", "weekday": "4", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "15", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekday": "4", "timeslot": "2", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "16", "validFrom": "2025-06-13", "validUntil": null, "class": "10a", "subject": "Ge", "weekday": "4", "timeslot": "4", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "17", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekday": "4", "timeslot": "5", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "18", "validFrom": "2025-06-13", "validUntil": null, "class": "8b", "subject": "Sk", "weekday": "4", "timeslot": "6", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "19", "validFrom": "2025-06-13", "validUntil": null, "class": "6b", "subject": "De", "weekday": "5", "timeslot": "1", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "20", "validFrom": "2025-06-13", "validUntil": null, "class": "8a", "subject": "Sk", "weekday": "5", "timeslot": "2", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "21", "validFrom": "2025-06-13", "validUntil": null, "class": "7c", "subject": "Ge", "weekday": "5", "timeslot": "3", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "22", "validFrom": "2025-06-13", "validUntil": null, "class": "9b", "subject": "Ge", "weekday": "5", "timeslot": "4", "lastEdited": "2025-06-19 13:36:09" },
            { "id": "23", "validFrom": "2025-06-13", "validUntil": null, "class": "6a", "subject": "De", "weekday": "5", "timeslot": "5", "lastEdited": "2025-06-19 13:36:09" }
        ];

        await this.writeToLocalDB('timetable', data);

        data = [
            { "id": "1", "date": "2025-06-11", "timeslot": "5", "class": "6a", "subject": "Termin", "canceled": "false", "type": "appointement", "lastEdited": "2025-06-10 18:11:15" },
            { "id": "5", "date": "2025-06-30", "timeslot": "1", "class": "6a", "subject": "De", "canceled": "true", "type": "normal", "lastEdited": "2025-06-13 20:08:46" },
            { "id": "6", "date": "2025-06-20", "timeslot": "1", "class": "Fobi", "subject": "Termin", "canceled": "false", "type": "appointement", "lastEdited": "2025-06-18 11:38:04" },
            { "id": "7", "date": "2025-06-27", "timeslot": "6", "class": "Egs", "subject": "Termin", "canceled": "false", "type": "appointement", "lastEdited": "2025-06-19 13:43:37" },
            { "id": "8", "date": "2025-06-23", "timeslot": "1", "class": "6a", "subject": "De", "canceled": "true", "type": "normal", "lastEdited": "2025-06-19 13:57:59" },
            { "id": "9", "date": "2025-06-27", "timeslot": "3", "class": "7c", "subject": "Ge", "canceled": "true", "type": "normal", "lastEdited": "2025-06-19 13:58:31" }
        ];

        await this.writeToLocalDB('timetableChanges', data);

        data = {"id": "1", "class": "8a", "content": "<p><b>Stundenthemen:</b></p><ul><li>​Arbeit in der Manufaktur</li><li>Erfindung der Dampfmaschine</li><li>​Wechsel von Handarbeit zur maschinellen Fertigung</li></ul><p>abschließend kurze Diskussion zum Thema:</p><p>Welche Veränderungen könnte die Automatisierung der Arbeit für die Arbeiter mit sich bringen?</p>", "created": "2025-11-17 10:08:38", "date": "2025-06-24", "lastEdited": "2025-11-17 10:08:38", "subject": "Ge", "timeslot": "2", "weekday": "2" };

        await this.writeToLocalDB('lessonNotes', data)
    }

    async updateAccountType() {
        let accountInfo = await this.getAccountInfo();

        if (accountInfo.status == 'failed' || accountInfo.accountType == 'guestUser') {
            let db = await this.openIndexedDB();
            db.transaction('settings', 'readwrite').objectStore('settings').put({ id: 1, accountType: 'registeredUser', temporarilyOffline: false });
        }
    }

    async attemptAccountCreation(accountData) {

        let result = await this.makeAjaxQuery('user', 'createAccount', accountData);
        if (result.status == 'success') this.updateOnLocalDB('settings', { id: 1, accountType: 'registeredUser', temporarilyOffline: false })

        return result;
    }
    async toggleTemperaryOfflineUsage(offlineStatus) {
        let accountInfo = await this.getAccountInfo();

        if (accountInfo.status == 'failed') {
            await Controller.createGuestAccount();
            accountInfo = await this.getAccountInfo();
        }

        this.updateOnLocalDB('settings', { id: 1, accountType: accountInfo.accountType, temporarilyOffline: offlineStatus });
    }

    async getAccountInfo() {
        let accountInfo = await this.readFromLocalDB('settings', 1);

        if (!accountInfo) return { status: 'failed' };

        return {
            status: 'success',
            ...accountInfo
        }
    }

    async resendAuthMail(formData) {

        if (!mailStatus.authMailAlreadySend) {
            mailStatus.authMailAlreadySend = true;
            setTimeout(() => { mailStatus.authMailAlreadySend = false; }, ONEMIN * 5); //after 5 minutes you can resend the Authmail again, prevents spam

            let result = await this.makeAjaxQuery('user', 'resendAuthMail', { 'userEmail': formData.userEmail });

            if (result.status == 'failed') mailStatus.authMailAlreadySend = false;

            return result;
        }
    }

    static isAuthMailAlreadySend() {
        if (mailStatus.authMailAlreadySend == true) return true;

        return false;
    }

    async sendResetPasswordMail(formData) {

        if (!mailStatus.resetMailAlreadySend) {
            mailStatus.resetMailAlreadySend = true;
            setTimeout(() => { mailStatus.resetMailAlreadySend = false; }, ONEMIN * 5);

            let result = await this.makeAjaxQuery('user', 'sendPasswortResetMail', { 'userEmail': formData.userEmail });

            if (result.status == 'failed') mailStatus.resetMailAlreadySend = false;

            return result;
        }

        return {
            status: 'failed',
            message: 'Es wurde bereits eine Reset-Mail geschickt. Überprüfe bitte deinen Posteingang oder Spam-Ordner.'
        };
    }
}