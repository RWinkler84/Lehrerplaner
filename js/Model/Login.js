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
            temporarilyOffline: true,
            plusActive: false
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
            { "id": "9", "date": "2025-06-27", "timeslot": "3", "class": "7c", "subject": "Ge", "canceled": "true", "type": "normal", "lastEdited": "2025-06-19 13:58:31" },
            { "id": 10, "class": "6a", "subject": "De", "timeslot": "1", "weekday": 1, "date": "2025-07-28", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 11, "class": "6a", "subject": "De", "timeslot": "3", "weekday": 2, "date": "2025-07-29", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 12, "class": "6a", "subject": "De", "timeslot": "4", "weekday": 3, "date": "2025-07-30", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 13, "class": "6a", "subject": "De", "timeslot": "2", "weekday": 4, "date": "2025-07-31", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 14, "class": "6b", "subject": "De", "timeslot": "3", "weekday": 1, "date": "2025-07-28", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 15, "class": "6b", "subject": "De", "timeslot": "1", "weekday": 2, "date": "2025-07-29", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 16, "class": "6b", "subject": "De", "timeslot": "2", "weekday": 3, "date": "2025-07-30", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 17, "class": "6b", "subject": "De", "timeslot": "5", "weekday": 4, "date": "2025-07-31", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 18, "class": "7c", "subject": "Ge", "timeslot": "4", "weekday": 1, "date": "2025-07-28", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 19, "class": "9b", "subject": "Ge", "timeslot": "5", "weekday": 1, "date": "2025-07-28", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 20, "class": "8a", "subject": "Ge", "timeslot": "2", "weekday": 2, "date": "2025-07-29", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 21, "class": "8a", "subject": "Ge", "timeslot": "1", "weekday": 4, "date": "2025-07-31", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 22, "class": "8a", "subject": "Sk", "timeslot": "5", "weekday": 2, "date": "2025-07-29", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 23, "class": "10a", "subject": "Ge", "timeslot": "1", "weekday": 3, "date": "2025-07-30", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 24, "class": "10a", "subject": "Ge", "timeslot": "4", "weekday": 4, "date": "2025-07-31", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 25, "class": "8b", "subject": "Sk", "timeslot": "3", "weekday": 3, "date": "2025-07-30", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 26, "class": "8b", "subject": "Sk", "timeslot": "6", "weekday": 4, "date": "2025-07-31", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" },
            { "id": 27, "class": "9a", "subject": "Sk", "timeslot": "6", "weekday": 3, "date": "2025-07-30", "type": "holiday", "canceled": "true", "created": "2026-01-23 12:35:05", "lastEdited": "2026-01-23 12:35:05" }
        ];

        await this.writeToLocalDB('timetableChanges', data);

        data = { "id": "1", "class": "8a", "content": "<p><b>Stundenthemen:</b></p><ul><li>​Arbeit in der Manufaktur</li><li>Erfindung der Dampfmaschine</li><li>​Wechsel von Handarbeit zur maschinellen Fertigung</li></ul><p>abschließend kurze Diskussion zum Thema:</p><p>Welche Veränderungen könnte die Automatisierung der Arbeit für die Arbeiter mit sich bringen?</p>", "created": "2025-11-17 10:08:38", "date": "2025-06-24", "lastEdited": "2025-11-17 10:08:38", "subject": "Ge", "timeslot": "2", "weekday": "2" };

        await this.writeToLocalDB('lessonNotes', data);

        data = { "id": 1, "name": "2024/25", "startDate": "2024-08-01", "endDate": "2025-07-31", "holidays": [{ "id": 1, "name": "Sommerferien", "startDate": "2024-08-01T10:00:00.000Z", "endDate": "2024-09-01T10:00:00.000Z" }, { "id": 2, "name": "Feiertag", "startDate": "2024-10-03T10:00:00.000Z", "endDate": "2024-10-03T10:00:00.000Z" }, { "id": 3, "name": "Herbstferien", "startDate": "2024-10-21T10:00:00.000Z", "endDate": "2024-11-01T11:00:00.000Z" }, { "id": 4, "name": "Weihnachtsferien", "startDate": "2024-12-19T11:00:00.000Z", "endDate": "2025-01-07T11:00:00.000Z" }, { "id": 5, "name": "Osterferien", "startDate": "2025-04-11T10:00:00.000Z", "endDate": "2025-04-25T10:00:00.000Z" }, { "id": 6, "name": "Feiertag", "startDate": "2025-05-01T10:00:00.000Z", "endDate": "2025-05-01T10:00:00.000Z" }, { "id": 7, "name": "Pfingsten", "startDate": "2025-05-30T10:00:00.000Z", "endDate": "2025-06-02T10:00:00.000Z" }, { "id": 8, "name": "Sommerferien", "startDate": "2025-07-28T10:00:00.000Z", "endDate": "2025-07-31T10:00:00.000Z" }], "curricula": [{ "id": 1, "grade": "6", "subject": "De", "curriculumSpans": [{ "id": 1, "name": "Miteinander sprechen/Alltagssituationen", "startDate": "2024-09-02T10:00:00.000Z", "endDate": "2024-09-06T10:00:00.000Z", "note": "<ul><li>Ferienerlebnisse erzählen</li><li>Wiederholen Gesprächsinhalte​</li></ul>" }, { "id": 2, "name": "Informationen gewinnen und austauschen", "startDate": "2025-05-05T10:00:00.000Z", "endDate": "2025-05-09T10:00:00.000Z", "note": "<ul><li>spontan über Begriffe reden (freies Sprechen)</li><li>Sprechspiele</li><li>Artikulation​</li></ul>" }, { "id": 3, "name": "Informationen aus Texten", "startDate": "2025-05-12T10:00:00.000Z", "endDate": "2025-05-16T10:00:00.000Z", "note": "<ul><li>Sachtexte gemeinsam erarbeiten</li><li>Gedicht 'Der Wahlfisch'</li><li>Klassenlektüre gemeinsam auswählen​</li></ul>" }, { "id": 4, "name": "Selbst schreiben: vorbereiten, schreiben, korrigieren", "startDate": "2025-05-19T10:00:00.000Z", "endDate": "2025-05-23T10:00:00.000Z", "note": "<p><br></p>" }, { "id": 5, "name": "Verbformen", "startDate": "2025-05-26T10:00:00.000Z", "endDate": "2025-05-29T10:00:00.000Z", "note": "<p><br></p>" }, { "id": 6, "name": "Information aus Texten gewinnen", "startDate": "2025-06-03T10:00:00.000Z", "endDate": "2025-06-06T10:00:00.000Z", "note": "<p>Gedicht 'Sommer' erarbeiten</p>" }, { "id": 7, "name": "Klassenlektüre", "startDate": "2025-06-09T10:00:00.000Z", "endDate": "2025-06-20T10:00:00.000Z", "note": "<ul><li>​Lesetagebuch vorbereiten und führen</li></ul>" }, { "id": 8, "name": "Sprache untersuchen", "startDate": "2025-06-23T10:00:00.000Z", "endDate": "2025-06-27T10:00:00.000Z", "note": "<ul><li>Satzartzen erkennen</li><li>Fremdwörter</li></ul>" }, { "id": 9, "name": "Informationen gewinnen und teilen", "startDate": "2025-06-30T10:00:00.000Z", "endDate": "2025-07-04T10:00:00.000Z", "note": "<ul><li>Telefongespräche führen</li><li>Sprechtempo und Lautstärke trainieren</li><li>Übung: Sprecht über Eure Ferienpläne​</li></ul>" }, { "id": 10, "name": "Ausklang", "startDate": "2025-07-21T10:00:00.000Z", "endDate": "2025-07-25T10:00:00.000Z", "note": "<p><br></p>" }, { "id": 11, "name": "Zeitungsartikel", "startDate": "2025-07-07T10:00:00.000Z", "endDate": "2025-07-11T10:00:00.000Z", "note": "<p><br></p>" }, { "id": 12, "name": "Kreatives Schreiben", "startDate": "2025-07-14T10:00:00.000Z", "endDate": "2025-07-18T10:00:00.000Z", "note": "<ul><li>​Thema 'Sommer'</li><li>Verwendung von Wörterbüchern</li></ul>" }] }], "grades": ["6", "7", "8", "9", "10"], "created": "2026-01-23 11:05:52", "lastEdited": "2026-01-23 11:32:51" };

        await this.writeRemoteToLocalDB('schoolYears', data);

        data = {id: 1, date: '2025-06-27', content: '<p>7c Wandertag</p><p><b>Abwesenheit:</b></p><p>Emily (6b) freigestellt</p>', created: '2026-09-01 09:51:28', lastEdited: '2026-09-01 10:00:07'};

        await this.writeRemoteToLocalDB('dayNotes', data);

        data = [
            {content: "<p>TOP 1 & 2: Zeugnisse, Notenschluss & Gutachten</p><ul><li><p><b>Noteneingabe-Deadline:</b> Absolut letzer Termin ist der <b>08.07., 12:00 Uhr</b>! Das System wird pünktlich gesperrt – wer danach noch was ändern muss, muss direkt zu Weber ins Büro.</p></li><li><p><b>Zeugniskonferenzen:</b> Läuft ab nächsten Montag. Räume im A-Trakt beachten, wurden wegen der Hitze verlegt.</p></li><li><p><b>Bemerkungen & Arbeits-/Sozialverhalten:</b> Neumann erinnert noch mal nachdrücklich: Keine Textbausteine doppeln bei Geschwistern und Notizen sachlich halten! Bei gefährdeten Versetzungen müssen die Akten vollständig sein.</p></li><li><p><b>Fehlzeiten:</b> Bitte bei allen Klassen noch einmal die Entschuldigungen abgleichen. Unentschuldigte Tage müssen korrekt auf dem Zeugnis stehen.</p></li></ul><p>TOP 3: Rückgabe, Inventar & Raumwechsel</p><ul><li><p><b>Schulbücher:</b> Rücknahme läuft nächste Woche nach Sonderplan (Weber hängt den Aushang morgen früh ins Treppenhaus).</p></li><li><p><b>Fachräume:</b> Inventarlisten (v. a. Physik/Chemie und Kunst) müssen bis <b>15.07.</b> abgegeben werden.</p></li><li><p><b>Klassenraumwechsel:</b> Tische und Stühle am vorletzten Schultag bitte hochstellen und persönliche Sachen aus den Fachschränken ausräumen. Die Reinigungsfirma kommt direkt am ersten Ferientag!</p></li></ul><p>TOP 4: Letzte Schulwoche & Schuljahresabschluss</p><ul><li><p><b>Sportfest / Wandertag:</b> Dienstag Wandertag (Wetterberichte beobachten – bei über 30 Grad greift die Hitze-Regelung, dann nur kurze Touren!).</p></li><li><p><b>Zeugnisausgabe (Freitag):</b> Unterricht endet nach der 3. Stunde.</p></li><li><p><b>Kollegiumsabschluss:</b> Freitag ab 12:30 Uhr kleines Grillen auf dem Schulhof. Organisation liegt bei der Fachschaft Sport (Getränkeliste hängt an der Pinnwand – bitte noch eintragen!).</p></li></ul><p>TOP 5: Ausblick aufs neue Schuljahr (Vorläufiges)</p><ul><li><p><b>Personalsituation:</b> Die Vertretungsstelle für Kunst/Geo ist immer noch nicht final ausgeschrieben… Könnte zu Schuljahresbeginn eng werden.</p></li><li><p><b>Präsenztage:</b> Erster Präsenztag nach den Sommerferien ist der <b>10.08.</b> um 09:00 Uhr.</p></li></ul>", created: "2026-09-01 10:04:18",id: 1, lastEdited: "2026-09-01 10:09:09", parentFolderId: 1001, parentIdBeforeDelete: null, title: "09.06.2025"},
            {content : "<p>Hey,</p><p>schön, dass du Interesse an Eduplanio hast. Die App wird entwickelt, um dir als Lehrperson das Leben etwas leichter zu machen. Sie hilft dir, deinen Arbeitstag zu strukturieren und deinen Papierkram entrümpelt. Praktisch dafür sind unter anderem die Notizfunktionen. </p><p>Hier in der Notizansicht kannst du zum Beispiel längere Protokolle, Ideensammlungen oder Listen anlegen und in Ordnern sortieren. Das ist ideal für alles, was nicht direkt mit einer Stunde oder einem Unterrichtstag zusammenhängt. Für solche Themen gibt es Stunden- und Tagesnotizen, die du über die Hauptansicht anlegen und bearbeiten kannst.</p><p>Damit du die Übersicht nicht verlierst, wird es bald eine Suchfunktion geben, die all deine Notizen durchsuchbar macht. Die App ist ständig im Wandel. Falls du etwas vermisst oder ein Problem entdeckst, schreib mir gern eine Mail an support@eduplanio.app. Dein Feedback hilft mir, Eduplanio noch besser zu machen.</p><p>Viel Spaß mit der Demo</p><p>Ralf</p>", created : "2026-09-01 10:28:07", id : 2, lastEdited : "2026-09-01 10:28:07", parentFolderId : 0, parentIdBeforeDelete : null, title : "Willkommen"}
            ]

        await this.writeRemoteToLocalDB('globalNotes', data);

        data = {created : "2026-09-01 10:14:16", id : 1001, lastEdited : "2026-09-01 10:14:16", name : "Dienstberatungen", parentFolderId : 0, parentIdBeforeDelete : null}

        await this.writeRemoteToLocalDB('globalNoteFolders', data);
    }

    async updateAccountType() {
        let accountInfo = await this.getAccountInfo();

        if (accountInfo.status == 'failed' || accountInfo.accountType == 'guestUser') {
            let db = await this.openIndexedDB();
            db.transaction('settings', 'readwrite').objectStore('settings').put({ id: 1, accountType: 'registeredUser', temporarilyOffline: false, plusActive: true  });
        }
    }

    async attemptAccountCreation(accountData) {

        let result = await this.makeAjaxQuery('user', 'createAccount', accountData);
        if (result.status == 'success') this.updateOnLocalDB('settings', { id: 1, accountType: 'registeredUser', temporarilyOffline: false, plusActive: true })

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