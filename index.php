<?php

require_once './core/loader.php';
require_once './vendor/autoload.php';

use Model\User;

ini_set('session.gc_maxlifetime', 86400000);
session_set_cookie_params(86400000);
session_start();

if (isset($_SESSION['userId'])) {
    $user = new User($_SESSION['userId']);
}


if (isset($_GET['c']) && isset($_GET['a'])) {

    if (!in_array($_GET['c'], ALLOWEDCONTROLLER)) {
        die('invalid controller');
    }
    if (!in_array($_GET['a'], ALLOWEDACTIONS)) {
        die('invalid action');
    }

    $controllerName = '\Controller\\' . ucfirst($_GET['c']) .  'Controller';
    $action = $_GET['a'];
    $controller = new $controllerName;

    $controller->$action();
    exit;
}

if (isset($_SESSION['isLoggedIn']) && isset($_SESSION['userId'])) {
    $html = file_get_contents('./View/index.html');
} else {
    $html = file_get_contents('./View/login.html');
}

echo $html;
