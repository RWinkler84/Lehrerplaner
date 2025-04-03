<?php 

namespace Model;
use Model\AbstractModel;

class Task extends AbstractModel {


    public function save($taskData) {
        if ($taskData['fixedTime'] == ''){
            $taskData['fixedTime'] = 0;
        }

        $query = 'INSERT INTO tasks (id, date, timeslot, class, subject, description, status, fixedTime) VALUES (:id, :date, :timeslot, :class, :subject, :description, :status, :fixedTime)';
        return $this->write($query, $taskData);
    }
}