<?php

const ALLOWEDCONTROLLER = ['task', 'lesson', 'abstract', 'settings', 'user'];
const ALLOWEDACTIONS = ['getSubjects', 'getTimetable', 'getTimetableChanges', 'getAllTasks', 'syncDatabase', 'getDbUpdateTimestamps',
    'save', 'update', 'addCanceled', 'cancel', 'uncancel', 'delete', 'setInProgress', 'setDone', 'setDbUpdateTimestamp',
    'deleteSubjects', 'saveSubject', 'saveTimetable', 'saveTimetableUpdates',
    'login', 'logout', 'createAccount', 'deleteAccount', 'authenticateMail', 'resendAuthMail', 'resetPassword', 'sendPasswortResetMail', 'updateValidUntil'];

const TABLEPREFIX = '';
const ROOTURL = 'https://localhost/projects/stundenplaner/index.php';
