<?php

const ALLOWEDCONTROLLER = ['task', 'lesson', 'lessonNote', 'abstract', 'settings', 'user', 'schoolYear'];
const ALLOWEDACTIONS = ['getSubjects', 'getTimetable', 'getTimetableChanges', 'getAllTasks', 'getAllLessonNotes', 'getAllSchoolYears', 'syncDatabase', 'getDbUpdateTimestamps', 'getUserInfo',
    'save', 'update', 'addCanceled', 'cancel', 'uncancel', 'delete', 'setInProgress', 'setDbUpdateTimestamp',
    'deleteSubjects', 'saveSubject', 'saveTimetable', 'saveTimetableUpdates',
    'login', 'logout', 'createAccount', 'deleteAccount', 'authenticateMail', 'resendAuthMail', 'resetPassword', 'sendPasswortResetMail', 'updateValidUntil',
    'sendSupportTicket',
    'processPurchase', 'createStripeSession', 'receivePaymentStatusUpdate'
    ];

const ALLOWED_FREE_ACTIONS = [
    
];

const TABLEPREFIX = '';
const ROOTURL = 'https://localhost/projects/stundenplaner/index.php';
