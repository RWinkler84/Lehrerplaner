<?php

require_once './core/loader.php';
require_once './vendor/autoload.php';

use Model\User;

session_start(['cookie_secure' => true]);

if (isset($_COOKIE['lprm']) && !isset($_SESSION['isLoggedIn'])){
    $emptyUser = new User;
    $isRemembered = $emptyUser->isRemembered($_COOKIE['lprm']);
}

if (isset($_SESSION['userId'])) {
    $user = new User($_SESSION['userId']);
}

if (
    !isset($user)&&
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
