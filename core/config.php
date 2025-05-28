<?php

const ALLOWEDCONTROLLER = ['task', 'lesson', 'abstract', 'settings', 'user'];
const ALLOWEDACTIONS = ['getSubjects', 'getTimetable', 'getTimetableChanges', 'getAllTasks', 'syncDatabase',
    'save', 'update', 'updateDate', 'addCanceled', 'cancel', 'uncancel', 'delete', 'setInProgress', 'setDone',
    'deleteSubject', 'saveSubject', 'saveTimetable', 'saveTimetableChanges',
    'login', 'logout', 'createAccount', 'authenticateMail', 'resendAuthMail', 'resetPassword', 'sendPasswortResetMail', 'updateValidUntil'];

const TABLEPREFIX = '';
const ROOTURL = 'https://localhost/projects/stundenplaner/index.php';
