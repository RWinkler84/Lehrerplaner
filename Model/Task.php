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

        $query = "INSERT INTO $this->tableName 
            (userId, itemId, date, timeslot, class, subject, description, status, fixedTime, reoccuring, reoccuringInterval) 
            VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :description, :status, :fixedTime, :reoccuring, :reoccuringInterval)";
        return $this->write($query, $taskData);
    }

    public function update($taskData)
    {
        if ($taskData['fixedTime'] == '') {
            $taskData['fixedTime'] = 0;
        }

        if ($taskData['reoccuring'] == '') {
            $taskData['reoccuring'] = 0;
        }

        $taskData = $this->preprocessDataToWrite($taskData);

        $query = "UPDATE $this->tableName SET class=:class, subject=:subject, date=:date, timeslot=:timeslot, description=:description, status=:status, fixedTime=:fixedTime, reoccuring=:reoccuring, reoccuringInterval=:reoccuringInterval WHERE userId = :userId AND itemId=:itemId";

        return $this->write($query, $taskData);
    }

    public function deleteTaskById($taskId) {
        global $user;

        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId";

        return $this->delete($query, ['userId' => $user->getId(), 'itemId' => $taskId]);
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

    public function syncTasks($tasks)
    {
        $results = [];
        $tasks = $this->preprocessDataToWrite($tasks);

        $query = "
            INSERT INTO $this->tableName (userId, itemId, date, timeslot, class, subject, description, status, fixedTime, lastEdited) 
            VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :description, :status, :fixedTime, :lastEdited)
            ON DUPLICATE KEY UPDATE
                date = IF (VALUES(lastEdited) > lastEdited, VALUES(date), date),
                timeslot = IF (VALUES(lastEdited) > lastEdited, VALUES(timeslot), timeslot),
                class = IF (VALUES(lastEdited) > lastEdited, VALUES(class), class),
                subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
                description = IF (VALUES(lastEdited) > lastEdited, VALUES(description), description),
                status = IF (VALUES(lastEdited) > lastEdited, VALUES(status), status),
                fixedTime = IF (VALUES(lastEdited) > lastEdited, VALUES(fixedTime), fixedTime),
                lastEdited = IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
        ";

        foreach ($tasks as $task) {

            if ($task['fixedTime'] == '') {
                $task['fixedTime'] = 0;
            }

            $result = $this->write($query, $task);
            $result['id'] = $task['itemId'];
            array_push($results, $result);
        }

        return $results;
    }
}
