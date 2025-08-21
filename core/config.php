<?php

const ALLOWEDCONTROLLER = ['task', 'lesson', 'abstract', 'settings', 'user'];
const ALLOWEDACTIONS = ['getSubjects', 'getTimetable', 'getTimetableChanges', 'getAllTasks', 'syncDatabase',
    'save', 'update', 'addCanceled', 'cancel', 'uncancel', 'delete', 'setInProgress', 'setDone',
    'deleteSubjects', 'saveSubject', 'saveTimetable', 'saveTimetableUpdates',
    'login', 'logout', 'createAccount', 'deleteAccount', 'authenticateMail', 'resendAuthMail', 'resetPassword', 'sendPasswortResetMail', 'updateValidUntil'];

const TABLEPREFIX = '';
const ROOTURL = 'https://localhost/projects/stundenplaner/index.php';
