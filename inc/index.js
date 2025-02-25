document.querySelectorAll('.lesson').forEach((element) => {
    element.addEventListener('mouseover', highlightTask);
});

document.querySelectorAll('.lesson').forEach((element) => {
    element.addEventListener('mouseout', removeTaskHighlight);
});

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('mouseenter', showAddTaskButton);
});

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('click', addTask);
});



function highlightTask(event) {

    let item = event.target;

    document.querySelectorAll('#upcomingTasksTable tr').forEach((taskRow) => {
        if (taskRow.dataset.taskid === item.dataset.taskid) {
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

function showAddTaskButton(event) {

    if (hasLesson(event.target)) {
        return;
    }

    removeAddTaskButton();

    event.target.innerHTML = '<div class="addTaskButtonWrapper"><div class="addTaskButton">+</div></div>';

}

function removeAddTaskButton() {

    document.querySelectorAll('.timeslot').forEach((timeslot) => {
        if (timeslot.querySelector('.addTaskButtonWrapper')) {
            timeslot.querySelector('.addTaskButtonWrapper').remove();
        }
    });
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