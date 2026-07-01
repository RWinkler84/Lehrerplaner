<?php

const ALLOWEDCONTROLLER = ['task', 'lesson', 'lessonNote', 'abstract', 'settings', 'user', 'schoolYear', 'dayNote'];
const ALLOWEDACTIONS = [
    'getSubjects', 'getTimetable', 'getTimetableChanges', 'getAllTasks', 'getAllLessonNotes', 'getAllSchoolYears', 'getAllDayNotes', 
    'syncDatabase', 'getDbUpdateTimestamps', 'getUserInfo',
    'save', 'update', 'addCanceled', 'cancel', 'uncancel', 'delete', 'setInProgress', 'setDbUpdateTimestamp',
    'deleteSubjects', 'saveSubject', 'saveTimetable', 'saveTimetableUpdates', 'updateValidUntil',
    'login', 'logout', 'createAccount', 'deleteAccount', 'authenticateMail', 'resendAuthMail', 'resetPassword', 'sendPasswortResetMail', 
    'sendSupportTicket',
    'processPurchase', 'createStripeSession', 'receivePaymentStatusUpdate', 'sendPlusRevocation'
    ];

const ALLOWED_CONTROLLER_FREE_USER = [
    'user', 'abstract'
];

const TABLEPREFIX = '';
const ROOTURL = 'https://localhost/projects/stundenplaner/index.php';
