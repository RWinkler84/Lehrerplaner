<?php

namespace Model;

use DateTime;
use Model\AbstractModel;

class Task extends AbstractModel
{
    private $tableName = TABLEPREFIX . 'tasks';

    public function save($taskData)
    {
        $taskData = $this->preprocessDataToWrite($taskData);

        $query = "INSERT INTO $this->tableName 
            (userId, itemId, date, timeslot, class, subject, description, status, fixedTime, reoccuring, reoccuringInterval, created, lastEdited) 
            VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :description, :status, :fixedTime, :reoccuring, :reoccuringInterval, :created, :lastEdited)";
        $result = $this->write($query, $taskData);

        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($taskData['lastEdited']));

        return $result;
    }

    public function update($taskData)
    {
        $taskData = $this->preprocessDataToWrite($taskData);

        $query = "UPDATE $this->tableName SET class=:class, subject=:subject, date=:date, timeslot=:timeslot, description=:description, status=:status, fixedTime=:fixedTime, reoccuring=:reoccuring, reoccuringInterval=:reoccuringInterval, created=:created, lastEdited=:lastEdited WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $result = $this->write($query, $taskData);

        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($taskData['lastEdited']));

        return $result;
    }

    public function deleteTask($taskData)
    {
        global $user;
        $taskData = $this->preprocessDataToWrite($taskData);

        if (is_null($user)) {
            echo json_encode(['status' => 'failed', 'error' => 'User not logged in']);
            exit;
        }

        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $queryData = [
            'userId' => $taskData['userId'],
            'itemId' => $taskData['itemId'],
            'created' => $taskData['created']
        ];
        $result = $this->delete($query, $queryData);

        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($taskData['lastEdited']));

        return $result;
    }

    public function syncTasks($tasks)
    {
        $finalResult = ['status' => 'success'];
        $tasks = $this->preprocessDataToWrite($tasks);

        $query = "
            INSERT INTO $this->tableName (userId, itemId, date, timeslot, class, subject, description, status, fixedTime, reoccuring, reoccuringInterval, created, lastEdited) 
            VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :description, :status, :fixedTime, :reoccuring, :reoccuringInterval, :created, :lastEdited)
            ON DUPLICATE KEY UPDATE
                date = IF (VALUES(lastEdited) > lastEdited, VALUES(date), date),
                timeslot = IF (VALUES(lastEdited) > lastEdited, VALUES(timeslot), timeslot),
                class = IF (VALUES(lastEdited) > lastEdited, VALUES(class), class),
                subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
                description = IF (VALUES(lastEdited) > lastEdited, VALUES(description), description),
                status = IF (VALUES(lastEdited) > lastEdited, VALUES(status), status),
                fixedTime = IF (VALUES(lastEdited) > lastEdited, VALUES(fixedTime), fixedTime),
                reoccuring = IF (VALUES(lastEdited) > lastEdited, VALUES(reoccuring), reoccuring),
                reoccuringInterval = IF (VALUES(lastEdited) > lastEdited, VALUES(reoccuringInterval), reoccuringInterval),
                lastEdited = IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
        ";

        foreach ($tasks as $task) {

            if ($task['fixedTime'] == '') {
                $task['fixedTime'] = 0;
            }

            $result = $this->write($query, $task);
            if ($result['status'] == 'failed') {
                $finalResult['status'] = 'failed';
                $finalResult['error'] = $result['error'];
            }

            if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($task['lastEdited']));
        }

        return $finalResult;
    }
}
