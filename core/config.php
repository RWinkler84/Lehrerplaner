<?php

const ALLOWEDCONTROLLER = ['task', 'lesson', 'lessonNote', 'abstract', 'settings', 'user'];
const ALLOWEDACTIONS = ['getSubjects', 'getTimetable', 'getTimetableChanges', 'getAllTasks', 'syncDatabase', 'getDbUpdateTimestamps', 'getUserLoginStatus',
    'save', 'update', 'addCanceled', 'cancel', 'uncancel', 'delete', 'setInProgress', 'setDbUpdateTimestamp',
    'deleteSubjects', 'saveSubject', 'saveTimetable', 'saveTimetableUpdates',
    'login', 'logout', 'createAccount', 'deleteAccount', 'authenticateMail', 'resendAuthMail', 'resetPassword', 'sendPasswortResetMail', 'updateValidUntil',
    'sendSupportTicket'
    ];

const TABLEPREFIX = '';
const ROOTURL = 'https://localhost/projects/stundenplaner/index.php';
