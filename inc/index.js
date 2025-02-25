document.querySelectorAll('.lesson').forEach((element) => {
    element.addEventListener('mouseover', highlightTask);
});

document.querySelectorAll('.lesson').forEach((element) => {
    element.addEventListener('mouseout', removeTaskHighlight);
});

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('mouseover', showAddTaskButton);
});

document.querySelectorAll('.timeslot').forEach((element) => {
    element.addEventListener('mouseout', removeAddTaskButton);
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

    event.target.innerHTML = '<div class="addTaskButton">+</div>';
}

function removeAddTaskButton(event) {

    // does not work, needs a different approch

    let parent = event.target.closest('.timeslot') ?
        event.target.closest('.timeslot') :
        event.target;

    let parentPosition = parent.getBoundingClientRect();
    console.log(parentPosition);
    document.querySelector('#x').innerHTML = event.pageX;
    document.querySelector('#y').innerHTML = event.pageY;

    if (event.pageX > parentPosition.left + 1 &&
        event.pageX < parentPosition.right - 1 &&
        event.pageY > parentPosition.top + 1 &&
        event.pageY < parentPosition.bottom - 1
    ) {
        return;
    }


    if (event.target.querySelector('.addTaskButton')) {
        event.target.querySelector('.addTaskButton').remove();
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