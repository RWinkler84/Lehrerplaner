<?php 

try {
$db = new PDO('mysql:host=localhost;dbname=teacherPlaner', 'root', '');
}
catch (Exception $e){
    error_log($e);
}