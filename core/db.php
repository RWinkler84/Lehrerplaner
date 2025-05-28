<?php 

try {
$db = new PDO('mysql:host=localhost;dbname=teacherPlaner', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
catch (Exception $e){
    error_log($e);
}