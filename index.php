<?php

require_once './core/loader.php';
require_once './vendor/autoload.php';

use Model\User;

session_start(['cookie_secure' => true]);

if (isset($_COOKIE['lprm']) && !isset($_SESSION['isLoggedIn'])) {
    $emptyUser = new User;
    $isRemembered = $emptyUser->isRemembered($_COOKIE['lprm']);
}

if (isset($_SESSION['userId'])) {
    $user = new User($_SESSION['userId']);
}

if (
    !isset($user) &&
    isset($_GET['reset'])
) {
    header('/index.php');
}

if (isset($_GET['c']) && isset($_GET['a'])) {

    if (!in_array($_GET['c'], ALLOWEDCONTROLLER)) {
        die('invalid controller');
    }
    if (!in_array($_GET['a'], ALLOWEDACTIONS)) {
        die('invalid action');
    }

    //if a user account expires its licence, only user actions and deletions (includes timetable updates) actions are allowed
    if (isset($user) && $user->isActive() == false) {   
        if (!in_array($_GET['c'], ALLOWED_CONTROLLER_FREE_USER) && $_GET['a'] != 'delete' && $_GET['a'] != 'saveTimetableUpdates') { 
            echo json_encode([
                'status' => 'failed',
                'error' => 'Plus licence expired',
                'message' => 'You need an active Eduplanio Plus licence to perform this action.'
            ]);

            exit;
        }
    }

    $controllerName = '\Controller\\' . ucfirst($_GET['c']) .  'Controller';
    $action = $_GET['a'];
    $controller = new $controllerName;

    $controller->$action();
    exit;
}

$html = file_get_contents('./View/index.html');


echo $html;
