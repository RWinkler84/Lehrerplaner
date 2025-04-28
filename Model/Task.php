<?php

namespace Model;

use Model\AbstractModel;

class Task extends AbstractModel
{
    private $tableName = TABLEPREFIX . 'users';

    public function save($taskData)
    {
        if ($taskData['fixedTime'] == '') {
            $taskData['fixedTime'] = 0;
        }

        $query = 'INSERT INTO tasks (id, date, timeslot, class, subject, description, status, fixedTime) VALUES (:id, :date, :timeslot, :class, :subject, :description, :status, :fixedTime)';
        return $this->write($query, $taskData);
    }

    public function update($taskData)
    {
        if ($taskData['fixedTime'] == '') {
            $taskData['fixedTime'] = 0;
        }

        $query = 'UPDATE tasks SET class=:class, subject=:subject, date=:date, timeslot=:timeslot, description=:description, status=:status, fixedTime=:fixedTime WHERE id=:id';

        return $this->write($query, $taskData);
    }

    public function setInProgress($taskId) {
        $query = 'UPDATE tasks SET status="inProgress" WHERE id=:id';

        return $this->write($query, $taskId);
    }

    public function setDone($taskId) {
        $query = 'UPDATE tasks SET status="done" WHERE id=:id';

        return $this->write($query, $taskId);
    }
}
