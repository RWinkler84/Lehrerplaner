<?php

namespace Model;
use PDO;

class AbstractModel
{

    private function read($query, $params)
    {
        global $db;
        
        $stmt = $db->prepare($query);

        if (count($params) > 0){
        $stmt->bindParam(...$params);
        }
 
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log(print_r($result,true));

        return $result;
    }

    public function getSubjects() {
        $query = 'select * from subjects';
        $params = [];
        
        return $this->read($query, $params);
    }

    public function getTimetable() {
        $query = 'select * from timetable';
        $params = [];

        return $this->read($query, $params);
    }

    public function getTimetableChanges() {
        $query = 'select * from timetableChanges';
        $params = [];

        return $this->read($query, $params);
    }

    public function getAllTasks() {
        $query = 'select * from tasks';
        $params = [];

        return $this->read($query, $params);
    }
}