<?php

namespace Model;

use Model\AbstractModel;

class Task extends AbstractModel
{
    private $tableName = TABLEPREFIX . 'tasks';

    public function save($taskData)
    {
        if ($taskData['fixedTime'] == '') {
            $taskData['fixedTime'] = 0;
        }

        $taskData = $this->preprocessDataToWrite($taskData);

        $query = "INSERT INTO $this->tableName (userId, itemId, date, timeslot, class, subject, description, status, fixedTime) VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :description, :status, :fixedTime)";
        return $this->write($query, $taskData);
    }

    public function update($taskData)
    {
        if ($taskData['fixedTime'] == '') {
            $taskData['fixedTime'] = 0;
        }

        $taskData = $this->preprocessDataToWrite($taskData);

        $query = "UPDATE $this->tableName SET class=:class, subject=:subject, date=:date, timeslot=:timeslot, description=:description, status=:status, fixedTime=:fixedTime WHERE userId = :userId AND itemId=:itemId";

        return $this->write($query, $taskData);
    }

    public function updateDate($taskData)
    {
        $taskData = $this->preprocessDataToWrite($taskData);

        $query = "UPDATE $this->tableName SET date=:date WHERE userId=:userId AND itemId = :itemId";

        return $this->write($query, $taskData);
    }

    public function setInProgress($taskId)
    {
        $taskId = $this->preprocessDataToWrite($taskId);

        $query = "UPDATE $this->tableName SET status='inProgress' WHERE userId=:userId AND itemId = :itemId";

        return $this->write($query, $taskId);
    }

    public function setDone($taskId)
    {
        $taskId = $this->preprocessDataToWrite($taskId);

        $query = "UPDATE $this->tableName SET status='done' WHERE userId=:userId AND itemId = :itemId";

        return $this->write($query, $taskId);
    }
}
