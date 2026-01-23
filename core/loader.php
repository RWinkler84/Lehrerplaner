<?php

require_once 'db.php';
require_once 'config.php';
require_once 'mailconfig.php';

//Controller
require_once './Controller/AbstractController.php';
require_once './Controller/LessonController.php';
require_once './Controller/TaskController.php';
require_once './Controller/SettingsController.php';
require_once './Controller/UserController.php';
require_once './Controller/LessonNoteController.php';
require_once './Controller/SchoolYearController.php';

//Models
require_once './Model/AbstractModel.php';
require_once './Model/Lesson.php';
require_once './Model/Task.php';
require_once './Model/Settings.php';
require_once './Model/User.php';
require_once './Model/LessonNote.php';
require_once './Model/SchoolYear.php';
