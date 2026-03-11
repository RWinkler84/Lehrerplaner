import { tourStatus } from "./index.js";

export default class Tour {

    static dialog = document.querySelector('#tourDialog');
    static headline = this.dialog.querySelector('#tourDialogHeadline');
    static image = this.dialog.querySelector('#tourImage');
    static text = this.dialog.querySelector('#tourText');
    static backwardBtn = this.dialog.querySelector('#goBackBtn');
    static forwardBtn = this.dialog.querySelector('#goForwardBtn');

    static openTourModal() {
        this.dialog.addEventListener('click', (event) => { Tour.clickHandler(event) });

        this.dialog.querySelector('#startTourButton').addEventListener('click', () => { Tour.runTour() });
        this.setOpenedViewOnDialog('weekOverview');
        this.dialog.showModal();
    }

    static closeTourModal() {
        this.dialog.close();
    }

    static runTour() {
        tourStatus.running = true;
        this.dialog.querySelector('#tourButtonContainer').classList.remove('notDisplayed');

        this.openSlide('forward');
    }

    /** @param direction 'forward' or 'backward' or null, if the current slide should not be changed */
    static openSlide(direction = null) {
        if (tourStatus.running == false) return;

        const currentSlide = Number(this.dialog.dataset.current_slide);
        const viewName = this.dialog.dataset.viewname;
        let nextSlide = currentSlide;

        if (direction) nextSlide = direction == 'forward' ? currentSlide + 1 : currentSlide - 1;

        const slideData = this.slides[viewName][nextSlide];

        if (slideData) {
            this.dialog.dataset.current_slide = nextSlide;

            this.headline.textContent = slideData.headline;
            this.image.src = slideData.image;
            this.text.innerHTML = slideData.text;

            slideData.backwardBtn ?
                this.backwardBtn.classList.remove('hidden') :
                this.backwardBtn.classList.add('hidden');
            slideData.forwardBtn ?
                this.forwardBtn.classList.remove('hidden') :
                this.forwardBtn.classList.add('hidden');

            if (this.dialog.querySelector('#tourButtonContainer').classList.contains('notDisplayed')) this.dialog.querySelector('#tourButtonContainer').classList.remove('notDisplayed');
        }

        this.dialog.showModal();
    }

    /** @param viewName 'weekOverview', 'timetableOverview', 'yearOverview' */
    static setOpenedViewOnDialog(viewName) {
        this.dialog.dataset.viewname = viewName;
    }

    static setSlideIdOnDialog(slideId) {
        this.dialog.dataset.current_slide = slideId;
    }

    static clickHandler(event) {
        let target = event.target;

        switch (target.id) {
            case 'endTourButton':
                this.closeTourModal();
                break;

            case 'goForwardBtn':
                this.openSlide('forward');
                break;

            case 'goBackBtn':
                this.openSlide('backward');
                break;

            //top menu clicks
            case 'openTimetableViewButton':
                Tour.setOpenedViewOnDialog('timetableOverview');
                Tour.setSlideIdOnDialog(0);
                Tour.openSlide();
                break;

            case 'openSchoolYearViewButton':
                Tour.setOpenedViewOnDialog('yearOverview');
                Tour.setSlideIdOnDialog(0);
                Tour.openSlide();
                break;
        }
    }

    static slides = {
        weekOverview: [
            {
                //empty by default
            },
            {
                headline: 'Die Hauptansicht',
                image: './tour_img/schulplaner_gesamt.jpg',
                text: `
                    <p>Du befindest dich aktuell in der Hauptansicht von Eduplanio. Hier wirst du die meiste Zeit arbeiten, 
                    weil du hier deinen aktuellen Stundenplan, deine Termine, deine Stundennotizen und deine Aufgaben 
                    verwalten kannst.</p>
                    <p>Schauen wir uns zuerst die Wochenübersicht an.</p>
                `,
                forwardBtn: true,
                backwardBtn: false
            },
            {
                headline: 'Die Wochenübersicht',
                image: './tour_img/weekoverview.jpeg',
                text: `
                    <p>Die Wochenübersicht zeigt dir den Stundenplan der aktuellen Woche an. Um zwischen den Wochen hin- 
                    und herzuschalten, kannst du die Datumsauswahl in der rechten oberen Ecke nutzen. </p>
                    <p>Neben deinem Stundenplan siehst du hier auch Planänderungen, die du eingetragen hast. Um zum Beispiel
                    Termine oder Vertretungsstunden anzulegen, musst du nur auf ein freies Feld in der Wochenübersicht klicken.</p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Wochenübersicht 2',
                image: './tour_img/stunde_erstellen.gif',
                text: `
                    <p>Hast du auf ein freies Feld geklickt, öffnet sich ein Formular, in das du die Klasse oder den Anlass der Änderung
                    einträgst. Anschließend wählst du das Fach oder "Termin" aus. Wie du die Fachauswahl ändern kannst, erfährst du im
                    Bereich "Stundenplan".</p>
                    <p>Einen neuen Termin oder eine Vertretung in einer Freistunde anzulegen, ist einfach. Aber wie gehst du vor, 
                    wenn du im fraglichen Zeitraum bereits eine Stunde hast?</p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Wochenübersicht 3',
                image: './tour_img/stunde_bearbeiten.gif',
                text: `
                    <p>Jede Stunde hat ein <span class="symbol">&#x2630;</span>-Symbol. Dahinter verbergen sich in Eduplanio die zusätzlichen Optionen.
                    Im Falle von Stunden und Terminen findest du hier die Möglichkeit, eine Aufgabe oder eine Notiz zu ihnen anzulegen, sie ausfallen 
                    zu lassen oder sie zu bearbeiten.</p>
                    <p>Willst du eine Stunde durch eine andere ersetzen, wählst du "bearbeiten" aus und das bereits bekannte Formular erscheint. 
                    Trage hier deine neue Stunde ein und bestätige die Änderung. Anschließend taucht die Stunde im Wochenplan auf.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Wochenübersicht 4',
                image: './tour_img/stunde_bearbeiten.gif',
                text: `
                    <p>Vielleicht hast du schon gesehen, dass einige Stunden Punkte in der linken, oberen Ecke haben. Dabei handelt es sich
                    um den Hinweis, dass es zu dieser Stunde eine Aufgabe gibt. Schaust du dir das obige Video genauer an, fällt dir
                    sicher auch auf, dass sich diese Punkte verschieben, sobald die Stunde in der 10a durch die Stunde in der 6b ersetzt wird.</p>
                    <p>Eduplanio reagiert hier auf den geänderten Stundenplan und sortiert deine Aufgaben neu. Weil eine Deutsch-Stunde in der
                    6b dazugekommen ist, zieht die App sämtliche Aufgaben nach vorn, die mit Deutsch in der 6b in Verbindung stehen. Die zu 
                    Geschichte in der 10a gehörenden Aufgaben werden hingegen nach hinten verlegt.</p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Wochenübersicht 5',
                image: './tour_img/stundennotiz_anzeigen.gif',
                text: `
                    <p>
                    Die zweite Stunde am Dienstag besitzt unterhalb des Aufgaben-Symbols ein weiteres kleines Icon (<span class="icon noteIcon"></span>). Dabei handelt es sich um
                    das Notiz-Symbol, welches auftaucht, sobald du zu einer Stunde eine Notiz angelegt hast. Klickst du es an, öffnet sich der
                    Eintrag und du kannst ihn bearbeiten.
                    </p>
                    <p>
                    Notizen verhalten sich bei Stundenplanänderungen genauso wie Aufgaben und ziehen mit um - es sei denn, du verhinderst es, 
                    indem du festlegst, dass sie ein festes Datum haben sollen.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Aufgabenübersicht',
                image: './tour_img/task_overview.jpg',
                text: `
                    <p>
                    Im unteren Teil der Hauptansicht findest du die Aufgabenübersicht. Hier werden alle aktuell offenen oder in Bearbeitung 
                    befindlichen Aufgaben angezeigt, die du angelegt hast. Die Sortierung folgt der chronologischen Reihenfolge der Aufgaben.
                    Oben steht also immer, was als nächstes erledigt werden muss. Ist eine Aufgabe am gleichen Tag fällig oder bereits überfällig,
                    wird sie mit einer roten Linie markiert.
                    </p>
                    <p>
                    Mit dem <button class="confirmationButton" style="padding: 0 0.5rem"><span class="icon checkIcon"></span></button> und dem
                    <button class="orangeButton" style="padding: 0 0.5rem"><span class="icon inProgressIcon"></span></button>-Button kannst du den
                    Status einer Aufgabe ändern. Mit <button class="orangeButton" style="padding: 0 0.5rem"><span class="icon inProgressIcon"></span></button> 
                    setzt du sie auf "in Arbeit", während <button class="confirmationButton" style="padding: 0 0.5rem"><span class="icon checkIcon"></span></button> 
                    sie als erledigt markiert und aus der Aufgabenübersicht löscht.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Aufgabenübersicht 2',
                image: './tour_img/aufgabe_bearbeiten.gif',
                text: `
                    <p>
                    Hast du eine Aufgabe angelegt und willst sie anschließend bearbeiten, kannst du sie per Doppelklick (oder Doppeltipp auf Touch-Geräten) 
                    zum Editieren öffnen. Das erlaubt es dir, ihren Termin manuell zu ändern, den Beschreibungstext anzupassen und festzulegen, ob sie einen
                    festen Termin haben soll. Es ist sogar möglich, wiederkehrende Aufgaben anzulegen, die wöchentlich, zweiwöchentlich oder monatlich
                    wiederholt werden.
                    </p>
                    <p>
                    Bist du mit deinen Änderungen zufrieden, speicherst du sie über den 
                    <button class="confirmationButton" style="padding: 0 0.5rem"><span class="icon checkIcon"></span></button>-Button. Willst du die sie 
                    rückgängig machen, klickst du auf 
                    <button class="cancelButton" style="padding: 0 0.5rem"><span class="icon crossIcon"></span></button> und die ursprüngliche Aufgabe 
                    wird wiederhergestellt.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Hauptansicht 2',
                image: './tour_img/top_menu_stundenplan.jpg',
                text: `
                    <p>
                    Die Grundlagen der Hauptansicht kennst du damit. Probiere dich gern selbst aus und erstelle Stunden, lege Vertretungen an oder
                    spiele mit der Aufgabenansicht herum. Keine Sorge, sämtliche deiner Änderungen am Demokonto werden rückgängig gemacht, sobald du die
                    Seite schließt.
                    </p>
                    <p>
                    Schau vorher aber unbedingt in der Stundenplan-Ansicht vorbei und absolviere die dortige Tour. Die Stundenplan-Ansicht ist für die 
                    Einrichtung deines eigenen Eduplanio-Kontos zentral. Du solltest sie also kennen, um Eduplanio richtig nutzen zu können.
                    </p>
                `,
                forwardBtn: false,
                backwardBtn: true
            },
        ],
        timetableOverview: [
            {
                headline: 'Die Stundenplanansicht',
                image: './tour_img/stundenplan_ansicht_gesamt.jpg',
                text: `
                    <p>
                    Die Stundenplanansicht ähnelt auf den ersten Blick der Wochenansicht, dient aber ausschließlich zur Verwaltung deiner festen 
                    Stundenpläne und deiner Fächer. Im oberen Teil kannst du deine Fächer eintragen. Wie das funktioniert, klären wir gleich. Der 
                    untere Teil dient zur Arbeit an den Stundenplänen. Hier kannst du sie anlegen, ändern und dir ältere Pläne anzeigen lassen, 
                    solltest du mehrere eingetragen haben.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: false
            },
            {
                headline: 'Die Stundenplanansicht 2',
                image: './tour_img/faecher_eintragen.gif',
                text: `
                    <p>
                    Beginnst du mit der Nutzung von Eduplanio, musst du zuerst deine Fächer anlegen. Andernfalls hast du keine Möglichkeit, 
                    einen Stundenplan einzutragen. Auch beim Eintragen von Stunden in der Wochenansicht bist du ohne Fächer auf das Erstellen von 
                    Terminen beschränkt. Dein erster Weg beim Einrichten der App führt deshalb in die Stundenplan-Ansicht in den Abschnitt 
                    "Fächer anlegen".
                    </p>
                    <p>
                    Das Eintragen der Fächer ist schnell erledigt. Gib ein Fachkürzel ein, wähle eine Farbe aus, in der dieses Fach künftig in 
                    Eduplanio angezeigt werden soll und klicke auf "Anlegen". Die Farbe kannst du jederzeit ändern, indem du das Fach neu anlegst.
                    Das Fachkürzel solltest du dann allerdings beibehalten, damit Einträge aus der Zeit vor der Änderung weiterhin korrekt zugeordnet 
                    werden können.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Stundenplanansicht 3',
                image: './tour_img/stundenplan_eintragen.gif',
                text: `
                    <p>
                    Das Anlegen der Pläne funktioniert wie das Anlegen von Stunden in der Hauptansicht. Klicke auf "Plan anlegen" und dir wird eine
                    leere Woche bereitgestellt, in die du deinen Unterricht eintragen kannst. Damit sich der Plan speichern lässt, musst du angeben, 
                    ab wann er gültig ist. Danach kannst du deine Stunden wie gehabt erstellen: Klicke auf ein freies Feld, und fülle das sich öffnende 
                    Formular mit Klasse und Fach aus. Hast du alle Stunden eingetragen, speicherst du den Plan. 
                    </p>
                    <p>
                    Änderungen am Plan sind später noch möglich, solltest du einen Fehler gemacht haben. Deinen Plan zu bearbeiten, wenn sich dein Stundenplan 
                    ändert, ist allerdings keine gute Idee, weil dadurch ältere Daten wie Stundennotizen verloren gehen können. In diesem Fall solltest du in 
                    Eduplanio einen neuen Plan erstellen.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Stundenplanansicht 4',
                image: './tour_img/top_menu_jahresansicht.jpg',
                text: `
                    <p>
                    Damit weißt du, wie die Stundenplan-Ansicht funktioniert. Hast du deine Fächer und deinen Stundenplan eingetragen, ist Eduplanio grundsätzlich 
                    für den Einsatz im Schulalltag startklar. Willst du das volle Potenzial der App für dich nutzen, solltest du aber auch die Schuljahransicht
                    kennenlernen. Dort kannst du Informationen verwalten, die das gesamte Schuljahr betreffen, wie zum Beispiel deine Stoffverteilungspläne.
                    </p>
                `,
                forwardBtn: false,
                backwardBtn: true
            },
        ],
        yearOverview: [
            {
                headline: 'Die Jahresansicht',
                image: './tour_img/jahresansicht.jpg',
                text: `
                    <p>
                    Die Jahresansicht erlaubt es dir wichtige Informationen zum Schuljahr in Eduplanio einzutragen. Dazu gehören das Start- und Enddatum des 
                    Schuljahres, die unterrichteten Klassenstufen und die Ferien und freien Tage. Die App funktioniert auch, ohne dass du ein Schuljahr anlegst, 
                    das Nutzungserlebnis ist dann aber eventuell etwas schlechter.
                    </p>
                    <p>
                    Verzichtest du zum Beispiel darauf, Ferienzeiten einzutragen, kann Eduplanio diese 
                    nicht beim Neuterminieren deiner Aufgaben berücksichtigen oder Stunden an freien Tagen automatisch als ausfallend markieren. Stoffverteilungspläne 
                    zu erstellen ist ohne Schuljahr, dem sie zugeordnet werden, ist ebenfalls unmöglich. 
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: false
            },
            {
                headline: 'Die Jahresansicht 2',
                image: './tour_img/jahresansicht.jpg',
                text: `
                    <p>
                    Die Jahresansicht erlaubt es dir wichtige Informationen zum Schuljahr in Eduplanio einzutragen. Dazu gehören das Start- und Enddatum des 
                    Schuljahres, die unterrichteten Klassenstufen und die Ferien und freien Tage. Die App funktioniert auch, ohne dass du ein Schuljahr anlegst, 
                    das Nutzungserlebnis ist dann aber eventuell etwas schlechter.
                    </p>
                    <p>
                    Verzichtest du zum Beispiel darauf, Ferienzeiten einzutragen, kann Eduplanio diese 
                    nicht beim Neuterminieren deiner Aufgaben berücksichtigen oder Stunden an freien Tagen automatisch als ausfallend markieren. Stoffverteilungspläne 
                    zu erstellen ist ohne Schuljahr, dem sie zugeordnet werden, ist ebenfalls unmöglich. 
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: false
            },
        ]
    };
}