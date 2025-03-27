<?php

require_once './core/loader.php';


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

$html = file_get_contents('./View/index.html');

echo $html;

