// handlers for lesson fields and weekOverview
document.querySelectorAll('.lesson').forEach((element) => {
    element.addEventListener('mouseover', highlightTask);
});

document.querySelectorAll('.lesson').forEach((element) => {
    element.addEventListener('mouseout', removeTaskHighlight);
});

// handlers for empty timeslots

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('mouseenter', showAddTaskButton);
});

document.querySelectorAll('.timeslot').forEach((element) => {
    if (hasLesson(element)) return;
    element.addEventListener('click', createTaskForm);
});

// handlers for switching between weeks

document.querySelector('#weekBackwardButton').addEventListener('click', switchToPreviousWeek);
document.querySelector('#weekForwardButton').addEventListener('click', switchToNextWeek);

// handlers for task tables

document.querySelectorAll('#taskContainer td').forEach((td) => {
    td.addEventListener('dblclick', makeEditable);
});

document.querySelectorAll('#taskContainer td').forEach((td) => {
    td.addEventListener('dblclick', createSaveAndDiscardChangesButton);
});


// on ready

document.addEventListener('DOMContentLoaded', setDateForWeekdays);
document.addEventListener('DOMContentLoaded', setCalendarWeek);
document.addEventListener('DOMContentLoaded', setWeekStartAndEndDate)


const allSubjects = [
        {
            'id': '1',
            'subject': 'Gesch',
            'colorCssClass': 'subjectColorOne'
        },
        {
            'id': '2',
            'subject': 'Deu',
            'colorCssClass': 'subjectColorTwo'
        },
        {
            'id': '3',
            'subject': 'MNT',
            'colorCssClass': 'subjectColorThree'
        }
    ];


//HIGHLIGHTING AND TOGGLING STUFF

function highlightTask(event) {

    let item = event.target;

    document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
        if (taskRow.dataset.taskid === item.dataset.taskid) {
            taskRow.style.backgroundColor = "blue)";
            taskRow.style.backgroundColor = "var(--lightergrey)";
        }
    });

    removeAddTaskButton();
}

function removeTaskHighlight(event) {
    item = event.target;

    document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
        if (taskRow.dataset.taskid === item.dataset.taskid) {
            taskRow.style.backgroundColor = "var(--contentContainerBackground)";
        }
    });
}

function makeEditable(event) {
    if (event.target.classList.contains('taskDone') || event.target.dataset.noEntriesFound) return;

    if (event.target.dataset.subject) {
        event.target.innerHTML = getSubjectSelectHTML();
        event.target.style.padding = '0';
        event.target.addEventListener('focusout', removeEditability);
        createSaveAndDiscardChangesButton(event);


        return;
    }

    event.target.setAttribute('contenteditable', '');
    event.target.focus();
    window.getSelection().removeAllRanges();

    createSaveAndDiscardChangesButton(event);

    event.target.addEventListener('focusout', removeEditability);
}

function removeEditability(item) {

    item.target ? item = item.target : item;

    item.closest('tr').querySelectorAll('td').forEach((td) => {

        // removes the lesson select and transforms td to a normal td
        if (td.dataset.subject || item.dataset.subject == '') {

            if (!td.firstElementChild) return;

            let selection = td.firstElementChild.value;
            td.removeAttribute('style');
            td.innerHTML = selection;
        }

        td.removeAttribute('contenteditable');
    });
}


// HANDLING TASKS

function createTaskForm(item) {

    let dataSource = item.target;

    if (item.target.classList.contains('addTaskButton')) dataSource = item.target.parentElement;

    let taskTable = document.querySelector('#upcomingTasksTable tbody');
    let subjectSelect = getSubjectSelectHTML();

    let trContent = `
        <td contenteditable data-class></td>
        <td data-subject="" style="padding: 0">${subjectSelect}</td>
        <td class="taskDescription" data-taskDescription contenteditable></td>
        <td class="taskDone"><button class="saveNewTaskButton" onclick="saveNewTask(this)">&#x2714;</button><button class="discardNewTaskButton" onclick="discardNewTask(this)">&#x2718;</button></td>
        `;

    let newTableRow = document.createElement('tr');

    taskTable.append(newTableRow);

    let tr = taskTable.lastElementChild;

    tr.dataset.taskid = '';
    tr.dataset.date = dataSource.dataset.date;
    tr.dataset.timeslot = dataSource.dataset.lesson_number;
    tr.innerHTML = trContent;

    tr.firstElementChild.focus();
}

function getSubjectSelectHTML() {
    //make an fetch-query to get all subject the teacher is teaching and create an select with those as options
    //for now it is static and stored in the global const allSubjects

    let optionsHTML = '<option value="-" selected>   -</option>';

    allSubjects.forEach((entry) => {
        optionsHTML += `<option value="${entry.subject}">${entry.subject}</option>`;
    });

    return `<select class="lessonSelect">${optionsHTML}</select>`;
}

function saveNewTask(item) {

    let form = item.closest('tr');
    let classTd = form.querySelector('td[data-class]');
    let subjectTd = form.querySelector('td[data-subject]');

    let formData = new FormData();
    let taskData = {
        'id': generateTaskId(),
        'class': form.querySelector('td[data-class]').innerText,
        'subject': form.querySelector('td[data-subject] select').value,
        'date': form.dataset.date,
        'timeslot': form.dataset.timeslot,
        'description': form.querySelector('td[data-taskDescription]').innerText
    }

    Object.entries(taskData).forEach((key, value) => { formData.append(key, value) });

    //send this stuff to the backend via fetch-API
    //.then => remove discard-button and reasign create-Button to use it as a setDone-Button and add taskid to the saved tr

    //apply changes to datasets
    form.dataset.taskid = taskData.id;
    classTd.dataset.class = form.querySelector('td[data-class]').innerText;
    subjectTd.dataset.subject = subjectTd.querySelector('select').value;

    addLessonToTimetable(taskData);
    removeEditability(item);
    removeDiscardButton(item);
    saveTaskToSetDoneButton(item);

    form.querySelectorAll('td').forEach((td) => { td.addEventListener('dblclick', makeEditable) });
}

function updateTask(item) {
    let form = item.closest('tr');
    let formData = new FormData();
    let taskData = {};

    let classTd = form.querySelector('td[data-class]');
    let subjectTd = form.querySelector('td[data-subject]');

    //apply changes to datasets
    classTd.dataset.class = form.querySelector('td[data-class]').innerText;
    if (subjectTd.querySelector('td[data-subject] select')) {
        subjectTd.dataset.subject = subjectTd.querySelector('select').value;
    } else {
        subjectTd.dataset.subject = subjectTd.innerText;
    }


    taskData = {
        'id': form.dataset.taskid,
        'class': form.querySelector('td[data-class]').innerText,
        'subject': form.querySelector('td[data-subject] select') // select or not?
            ? form.querySelector('td[data-subject] select').value
            : form.querySelector('td[data-subject]').innerText,
        'date': form.dataset.date,
        'timeslot': form.dataset.timeslot,
        'description': form.querySelector('td[data-taskDescription]').innerText
    }


    Object.entries(taskData).forEach((key, value) => { formData.append(key, value) });


    //send this stuff to the backend via fetch-API
    //then =>
    removeEditability(item);
    removeDiscardButton(item);
    saveTaskToSetDoneButton(item);
    updateLessonOnTimetable(taskData);
}

function discardNewTask(item) {
    item.closest('tr').remove();
}

function setTaskDone(item) {
    console.log('task erledigt');
    console.log(item);
}

function addLessonToTimetable(lessonData) {
    let lessonDate = lessonData.date;
    let lessonNumber = lessonData.timeslot

    if (!isDateInCurrentWeek(lessonDate)) return;

    let weekday;
    let timeslot;
    let cssClass = getLessonColorCssClass(lessonData);
    let lessonHTML = `
        <div class="lesson ${cssClass}" data-taskid="${lessonData.id}">${lessonData.class} ${lessonData.subject}</div>
    `;

    document.querySelectorAll('.weekday').forEach((day) => {
        if (day.dataset.date == lessonDate) weekday = day;
    })
    weekday.querySelectorAll('.timeslot').forEach((slot) => {
        if (slot.dataset.lesson_number == lessonNumber) timeslot = slot;
    });


    timeslot.innerHTML = lessonHTML;
    
    timeslot.removeEventListener('click', createTaskForm);
    timeslot.firstElementChild.addEventListener('mouseover', highlightTask);
    timeslot.firstElementChild.addEventListener('mouseout', removeTaskHighlight);
}

function updateLessonOnTimetable(lessonData) {
    document.querySelectorAll('.lesson').forEach((lesson) => {
        if (lesson.dataset.taskid == lessonData.id){
            let cssColorClass = getLessonColorCssClass(lessonData);

            lesson.removeAttribute('class');
            lesson.classList.add('lesson');
            lesson.classList.add(cssColorClass);
            lesson.innerText = `${lessonData.class} ${lessonData.subject}`;
        }
    })
}

// BUTTONS!!!

function showAddTaskButton(event) {

    lessonNumber = event.target.dataset.lesson_number;
    date = event.target.parentElement.dataset.date;

    removeAddTaskButton();

    if (hasLesson(event.target)) return;

    event.target.innerHTML = `<div class="addTaskButtonWrapper" data-lesson_number="${lessonNumber}" data-date="${date}"><div class="addTaskButton">+</div></div>`;

}

function removeAddTaskButton() {

    document.querySelectorAll('.timeslot').forEach((timeslot) => {
        if (timeslot.querySelector('.addTaskButtonWrapper')) {
            timeslot.querySelector('.addTaskButtonWrapper').remove();
        }
    });
}

function createSaveAndDiscardChangesButton(event) {

    let parentTr = event.target.closest('tr');
    let buttonTd = parentTr.querySelector('.taskDone');

    if (buttonTd.querySelector('.setTaskDoneButton')) buttonTd.querySelector('.setTaskDoneButton').remove();

    buttonTd.innerHTML = '<button class="updateTaskButton" onclick="updateTask(this)">&#x2714;</button><button class="discardUpdateTaskButton" onclick="revertChanges(this)">&#x2718;</button>';

}

function removeDiscardButton(item) {
    item = item.target ? item.target : item;
    item.nextSibling.remove()

}

function saveTaskToSetDoneButton(item) {
    item = item.target ? item.target : item;
    let buttonTd = item.parentElement;

    item.remove();
    buttonTd.innerHTML = '<button class="setTaskDoneButton" onclick="setTaskDone(this)">&#x2714;</button>';
}

// FIDDLING WITH DATE

function setCalendarWeek() {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = 1;
    let currentYear = new Date().getFullYear();
    let referenceDate = new Date().getTime();
    let firstThursday = getFirstThirsdayOfTheYear(currentYear);
    let monday = firstThursday - 86400000 * 3
    let sunday = firstThursday + 86400000 * 3;

    //checks, if the reference date lies in the current week. if not, tests against the next week
    while (monday < referenceDate && sunday < referenceDate) {

        monday += 86400000 * 7; // + 7 days
        sunday += 86400000 * 7; // + 7 days
        weekCounter++;
    }

    //check whether the year changes and reset weekcounter, if so
    calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
}

function setDateForWeekdays() {
    let todayUnix = new Date().setHours(0, 0, 0);
    let today = new Date;

    document.querySelectorAll('.weekday').forEach((weekday) => {
        let dateDifference = weekday.dataset.weekday_number - today.getDay();
        let weekdayDateUnix = todayUnix + (dateDifference * 86400000);    // 86400000 = ms/day
        let weekdayDateString = new Date(weekdayDateUnix).toString();

        weekday.dataset.date = weekdayDateString;

    })
}

function setWeekStartAndEndDate() {
    let startDateSpan = document.querySelector('#weekStartDate');
    let endDateSpan = document.querySelector('#weekEndDate');
    let mondayDate = document.querySelector('.weekday[data-weekday_number="1"]').dataset.date;
    let sundayDate = document.querySelector('.weekday[data-weekday_number="7"]').dataset.date;

    mondayDate = new Date(mondayDate);
    sundayDate = new Date(sundayDate);

    startDateSpan.innerText = formatDate(mondayDate);
    endDateSpan.innerText = formatDate(sundayDate);
}

function switchToPreviousWeek() {

    cancelWeekSwitchAnimation(); //necessary to prevent animation from bugging out, if week is switched multipe times fast
    runWeekSwitchAnimation(false);

    // iterates over all weekday columns and adjusts date of weekdays
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date).getTime();
        let newDate = currentDate - 86400000 * 7; // -7 days

        weekday.dataset.date = new Date(newDate).toString();
    });

    setWeekStartAndEndDate();
    calcCalendarWeek(false)
}

function switchToNextWeek() {

    cancelWeekSwitchAnimation(); //necessary to prevent animation from bugging out, if week is switched multipe times fast
    runWeekSwitchAnimation(true);

    // iterates over all weekday columns and adjusts date of weekdays
    document.querySelectorAll('.weekday').forEach((weekday) => {
        let currentDate = new Date(weekday.dataset.date).getTime();
        let newDate = currentDate + 86400000 * 7; // +7 days

        weekday.dataset.date = new Date(newDate).toString();
    });

    setWeekStartAndEndDate();
    calcCalendarWeek(true)
}

function calcCalendarWeek(countUp = true) {
    let calendarWeekCounterDiv = document.querySelector('#calendarWeekCounter');
    let weekCounter = document.querySelector('#calendarWeekCounter').innerText;

    let mondayDate = new Date(document.querySelector('.weekday[data-weekday_number="1"]').dataset.date);
    let sundayDate = new Date(document.querySelector('.weekday[data-weekday_number="7"]').dataset.date);

    let weeksPerYear = getNumberOfWeeksPerYear(mondayDate.getFullYear());

    countUp ? weekCounter++ : weekCounter--;

    if (weekCounter < 1) weekCounter = weeksPerYear;
    if (weekCounter > weeksPerYear) weekCounter = 1;

    calendarWeekCounterDiv.innerText = String(weekCounter).padStart(2, '0');
}

// ANIMATION FUNCTIONS

function runWeekSwitchAnimation(nextWeek = true) {
    let timetableContainer = document.querySelector('#timetableContainer');
    let timetableContainerInitialHeight = timetableContainer.getBoundingClientRect().height;
    let weekOverview = document.querySelector('#weekOverview');
    let weekOverviewPosition = weekOverview.getBoundingClientRect();
    let blankWeekTable = weekOverview.cloneNode(true);
    let verticalOffset;

    //should blankWeekTable come in from left or right?
    if (nextWeek == true) verticalOffset = window.innerWidth;
    if (nextWeek == false) verticalOffset = window.innerWidth * -1;

    removeAllLessons(blankWeekTable);

    //setup for the animation
    weekOverview.style.left = '0px';
    blankWeekTable.style.position = 'relative';
    blankWeekTable.classList.add('blankWeekTable');
    blankWeekTable.style.top = -1 * weekOverviewPosition.height + 'px';
    blankWeekTable.style.left = verticalOffset + 'px';
    blankWeekTable.style.width = weekOverviewPosition.width + 'px';
    blankWeekTable.style.height = weekOverviewPosition.height + 'px';

    timetableContainer.append(blankWeekTable);

    timetableContainer.style.height = timetableContainerInitialHeight + 'px';

    setTimeout(() => {
        blankWeekTable.style.left = '0px';
        weekOverview.style.left = verticalOffset * -1 + 'px';
    }, 10);
    setTimeout(() => {
        blankWeekTable.remove()
        weekOverview.style.left = 'auto';
        removeAllLessons(weekOverview);
    }, 350);
}

function cancelWeekSwitchAnimation() {
    if (document.querySelector('.blankWeekTable')) {
        document.querySelector('.blankWeekTable').remove();
        document.querySelector('#weekOverview').style.left = 'auto';
    }
}

// HELPER FUNCTIONS

function hasLesson(element) {
    let bool = false;

    if (element.classList.contains('lesson')) {
        return true;
    }

    element.querySelectorAll('*').forEach(child => {
        if (child.classList.contains('lesson')) {
            bool = true;
        }
    });

    return bool;
}

function isDateInCurrentWeek(date) {
    let dateToTest = new Date(date);
    let monday = new Date(document.querySelector('div[data-weekday_number="1"]').dataset.date);
    let sunday = new Date(document.querySelector('div[data-weekday_number="7"]').dataset.date);

    if (monday <= dateToTest && dateToTest <= sunday) return true;

    return false;
}

function formatDate(date) {
    let formatter = new Intl.DateTimeFormat('de-DE', {
        month: '2-digit',
        day: '2-digit'
    });

    return formatter.format(date);
}

function getNumberOfWeeksPerYear(year) {
    let nextNewYear = new Date('1.1.' + (year + 1)).getTime();
    let firstThursday = getFirstThirsdayOfTheYear(year);

    let weeksPerYear = 0;

    //count up until it is the next year starting with 0 because the first 
    while (firstThursday < nextNewYear) {
        firstThursday = firstThursday + 86400000 * 7;

        weeksPerYear++;
    }

    return weeksPerYear;
}

//find the first thursday of the year, which marks the first calendar week
function getFirstThirsdayOfTheYear(year) {
    let firstDay = new Date('1.1.' + year);

    if (firstDay.getDay() != 4) {
        while (firstDay.getDay() != 4) {
            firstDay = firstDay.getTime() + 86400000;
            firstDay = new Date(firstDay);
        }
    }

    return firstDay.getTime();
}

function removeAllLessons(element) {
    element.querySelectorAll('.lesson').forEach((lesson) => {
        lesson.remove();
    })
}

function generateTaskId() {
    let lessons = document.querySelectorAll('.lesson');
    let lessonIds = [];

    lessons.forEach((lesson) => {
        lessonIds.push(Number(lesson.dataset.taskid));
    })

    return Math.max(...lessonIds) + 1; //adds 1 to the highest existing lesson id
}

function getLessonColorCssClass(lessonData){
    let lessonColorCssClass;

    allSubjects.forEach((subject) => {
        if (subject.subject == lessonData.subject) lessonColorCssClass = subject.colorCssClass;
    })

    return lessonColorCssClass;
}