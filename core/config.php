<?php

const ALLOWEDCONTROLLER = ['task', 'lesson', 'abstract', 'settings', 'user'];
const ALLOWEDACTIONS = ['getSubjects', 'getTimetable', 'getTimetableChanges', 'getAllTasks', 
    'save', 'update', 'updateDate', 'addCanceled', 'cancel', 'uncancel', 'delete', 'setInProgress', 'setDone',
    'deleteSubject', 'saveSubject', 'saveTimetable', 'saveTimetableChanges',
    'login', 'createAccount', 'authenticateMail', 'updateValidUntil'];

const TABLEPREFIX = '';
const ROOTURL = 'https://localhost/projects/stundenplaner/index.php';
