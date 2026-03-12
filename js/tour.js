import { tourStatus } from "./index.js";

export default class Tour {

    static minimizedTourDialog = document.querySelector('#minimizedTourIcon');
    static dialog = document.querySelector('#tourDialog');
    static headline = this.dialog.querySelector('#tourDialogHeadline');
    static image = this.dialog.querySelector('#tourImage');
    static text = this.dialog.querySelector('#tourText');
    static backwardBtn = this.dialog.querySelector('#goBackBtn');
    static forwardBtn = this.dialog.querySelector('#goForwardBtn');

    static openTourModal() {
        this.dialog.addEventListener('click', (event) => { Tour.clickHandler(event) });
        this.minimizedTourDialog.addEventListener('click', (event) => { Tour.clickHandler(event) });

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
        if (this.minimizedTourDialog.classList.contains('minimized')) return;

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

            if (!slideData.backwardBtn && !slideData.forwardBtn) {
                this.dialog.querySelector('#tourButtonContainer').classList.add('notDisplayed');
            } else {
                this.dialog.querySelector('#tourButtonContainer').classList.remove('notDisplayed');
            }
        }

        this.dialog.showModal();
    }

    static resizeTourModal() {
        const dialogProps = this.dialog.getBoundingClientRect();

        if (this.minimizedTourDialog.classList.contains('minimized')) {
            this.minimizedTourDialog.classList.remove('minimized');

            this.openSlide();

            return;
        }

        document.documentElement.style.setProperty('--dialogBottom', `${dialogProps.y}px`);
        document.documentElement.style.setProperty('--dialogRight', `${dialogProps.x}px`);
        document.documentElement.style.setProperty('--dialogWidth', `${dialogProps.width}px`);
        document.documentElement.style.setProperty('--dialogHeight', `${dialogProps.height}px`);

        this.dialog.close();
        this.minimizedTourDialog.classList.add('minimized');
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
            case 'startTourButton':
                Tour.runTour();
                break;
                
            case 'resizeSlideButton':
                this.resizeTourModal();
                break;

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
            case 'openWeekViewButton':
                Tour.setOpenedViewOnDialog('weekOverview');
                Tour.setSlideIdOnDialog(1);
                Tour.openSlide();
                break;
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

            //minimizedDialogIcon
            case 'minimizedTourIcon':
                this.resizeTourModal();
                break;
        }
    }

    static slides = {
        weekOverview: [
            {
                headline: 'Eduplanio-Einführung',
                image: '',
                text: `
                <p>Hey, willkommen auf dem Eduplanio Demo-Konto!</p>
                <p>Falls du Eduplanio noch nicht kennst und eine kurze Einführung möchtest, kannst du eine kleine
                    Einführungstour machen.</p>
                <p>Zu jedem Abschnitt der App erhältst du dann die wichtigsten Infos zur Verwendung. Wenn du dich 
                erst einmal umschauen willst, minimiere dieses Fenster und leg später los.</p>
                <div class="divider"></div>
                <div class="flex justifyCenter"><button id="startTourButton" class="confirmationButton">Tour
                        starten</button></div>
                </div>
                `,
                forwardBtn: false,
                backwardBtn: false
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
                    <button class="confirmationButton" style="padding: 0 0.5rem"><span class="icon checkIcon"></span></button>-Button. Willst du sie 
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
                    spiele mit der Aufgabenansicht herum. Keine Sorge, alle deine Änderungen am Demokonto werden rückgängig gemacht, sobald du die
                    Seite schließt.
                    </p>
                    <p>
                    Schau vorher aber unbedingt in der Stundenplanansicht vorbei und absolviere die dortige Tour. Die Stundenplanansicht ist für die 
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
                    Die Stundenplanansicht ähnelt auf den ersten Blick der Wochenübersicht, dient aber ausschließlich zur Verwaltung deiner festen 
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
                    Terminen beschränkt. Dein erster Weg beim Einrichten der App führt deshalb in die Stundenplanansicht in den Abschnitt 
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
                    Das Anlegen der Pläne ist unkompliziert und schnell erledigt. Klicke auf "Plan anlegen" und dir wird eine
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
                    Damit weißt du, wie die Stundenplanansicht funktioniert. Hast du deine Fächer und deinen Stundenplan eingetragen, ist Eduplanio grundsätzlich 
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
                    Die Jahresansicht erlaubt es dir, wichtige Informationen zum Schuljahr in Eduplanio einzutragen. Dazu gehören das Start- und Enddatum des 
                    Schuljahres, die unterrichteten Klassenstufen und die Ferien sowie freie Tage. Die App funktioniert auch, ohne dass du ein Schuljahr anlegst, 
                    das Nutzungserlebnis ist dann aber eventuell etwas schlechter.
                    </p>
                    <p>
                    Verzichtest du zum Beispiel darauf, Ferienzeiten einzutragen, kann Eduplanio diese 
                    nicht beim Neuterminieren deiner Aufgaben berücksichtigen oder Stunden an freien Tagen automatisch als ausfallend markieren. Stoffverteilungspläne 
                    zu erstellen ist ohne Schuljahr, dem sie zugeordnet werden, ebenfalls nicht möglich. 
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: false
            },
            {
                headline: 'Die Jahresansicht 2',
                image: './tour_img/schuljahr_anlegen.gif',
                text: `
                    <p>
                    Nachdem du "Schuljahr anlegen" geklickt hast, erhältst du die Möglichkeit, ein Start- und ein Enddatum für das Schuljahr festzulegen. 
                    Sie markieren den Beginn und das Ende des Schuljahreskalenders in Eduplanio. Dieser wird sicht- und nutzbar, nachdem du die Daten gespeichert hast. 
                    Willst du deine Stoffverteilungspläne mit Eduplanio verwalten, musst du außerdem die unterrichteten Klassenstufen anhaken.
                    </p>
                    <p>
                    Hast du deine Eingaben erledigt, drückst du auf "Speichern" und kannst beginnen, mit dem Jahreskalender zu arbeiten.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Die Jahresansicht 3',
                image: './tour_img/ferien_eintragen.gif',
                text: `
                    <p>
                    Damit der Jahreskalender dir die Ferienzeiten anzeigt, was das Erstellen von Stoffverteilungsplänen erleichtert, solltest du 
                    zuerst die Ferien und freien Tage eintragen. Den Ferienkalender öffnest du mit einem Klick auf "Anlegen" rechts im Bereich 
                    "Ferien und freie Tage".
                    </p>
                    <p>
                    Zeiträume im Kalender können einen oder mehrere Tage überspannen. Um einen neuen Zeitraum anzulegen, klicke auf einen leeren 
                    Tag im Kalender und passe die Länge nach Bedarf an. Vergib anschließend einen Namen und speichere den Zeitraum. Solltest du ihn 
                    später bearbeiten wollen, musst du ihn nur anklicken.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Stoffverteilungspläne',
                image: './tour_img/stoffverteilungsplan_anlegen.gif',
                text: `
                    <p>
                    Hast du dein neu angelegtes Schuljahr gespeichert, wird der Editor für Stoffverteilungspläne verfügbar. Er befindet sich wie der 
                    Ferienkalender unterhalb der Schuljahresübersicht. Um den ersten Stoffverteilungsplan anzulegen, klicke auf "Plan anlegen", 
                    wähle die benötigte Fach- und Klassenstufenkombination aus und beginne dann, deine Sequenzen einzutragen.
                    </p>
                    <p>
                    Wichtig ist, dass du vorher alle deine Fächer in der Stundenplanansicht eingetragen hast. Andernfalls kannst du keinen Stoffverteilungsplan 
                    für die fehlenden Fächer anlegen.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Stoffverteilungspläne 2',
                image: './tour_img/sequenz_anlegen.gif',
                text: `
                    <p>
                    Im nächsten Schritt trägst du deine geplanten Sequenzen ein. Das funktioniert wie schon bei den Schulferien gezeigt. Klicke auf 
                    einen leeren Tag im Kalender, passe den Zeitraum an und vergib einen Namen für die Sequenz. Anders als bei Ferien hast du hier 
                    zusätzlich die Möglichkeit, eine Notiz anzulegen. Diese kannst du beispielsweise zur Ideensammlung nutzen.
                    </p>
                    <p>
                    Bearbeiten kannst du eine Sequenz nach dem Speichern, indem du sie erneut anklickst. Sowohl die Notiz als auch die 
                    Zeitspanne können dann angepasst werden, was die Arbeit mit Stoffverteilungsplänen sehr flexibel macht.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Stoffverteilungspläne 3',
                image: './tour_img/stoffverteilungsplan_wochenansicht.jpg',
                text: `
                    <p>
                    Hast du deinen Stoffverteilungsplan gespeichert, kannst du dessen Inhalt nicht nur über die Schuljahresansicht abrufen. Er 
                    taucht auch in der Wochenansicht auf. Über dem Kalender kannst du dort im Bereich "Stoffverteilungspläne" einen oder mehrere 
                    Pläne auswählen, die dir angezeigt werden sollen. Gibt es für die jeweilige Woche eine geplante Sequenz, wird diese nun über 
                    dem Wochenplan eingeblendet.
                    </p>
                    <p>
                    Du erhältst darüber auch die Möglichkeit, die Notiz für die jeweilige Sequenz anzusehen, zu bearbeiten oder neu anzulegen, 
                    falls es noch keine gibt. Dafür musst du einfach auf das Notiz-Symbol (<span class="icon noteIcon"></span>) klicken, das vor 
                    dem Sequenznamen angezeigt wird.
                    </p>
                `,
                forwardBtn: true,
                backwardBtn: true
            },
            {
                headline: 'Jahrensansicht 4',
                image: './tour_img/stoffverteilungsplan_wochenansicht.jpg',
                text: `
                    <p>
                    Damit bist du mit den wichtigsten Funktionen der Jahresansicht vertraut. 
                    </p>
                `,
                forwardBtn: false,
                backwardBtn: true
            },
        ]
    };
}