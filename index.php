<?php

require_once './core/loader.php';

use Model\User;

ini_set('session.gc_maxlifetime', 86400000);
session_set_cookie_params(86400000);
session_start();

if (isset($_SESSION['userId'])) {
    $user = new User($_SESSION['userId']);
}

error_log(print_r($_GET, true));

if (isset($_GET['c']) && isset($_GET['a'])) {
    
    if ($_GET['c'] == 'user' && $_GET['a'] == 'createAccount') {
        $html = file_get_contents('./View/createAccount.html');
        
        echo $html;
        exit;
        error_log(('jo'));
    } else {

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
}

if (isset($_SESSION['isLoggedIn']) && isset($_SESSION['userId'])) {
    $html = file_get_contents('./View/index.html');
} else {
    $html = file_get_contents('./View/login.html');
}

echo $html;
