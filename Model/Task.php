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

    public function syncTasks($tasksToSync, $tasksToDelete)
    {
        global $user;
        $finalResult = ['status' => 'success'];

        //delete unsynced deleted tasks
        if (!empty($tasksToDelete)) {
            foreach ($tasksToDelete as $task) {
                $result = $this->deleteTask($task);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }
        }

        //store and update new data
        if (!empty($tasksToSync)) {
            $storedTasks = $this->read("SELECT * FROM $this->tableName WHERE userId = :userId", ['userId' => $user->getId()]);
            $tasksToSync = $this->preprocessDataToWrite($tasksToSync);

            $storedTasksLookup = [];

            foreach ($storedTasks as $task) {
                $storedTasksLookup[$task['itemId']] = $task;
            }
        }

        foreach ($tasksToSync as $taskToSync) {
            $query = '';
            $matchingElement = $storedTasksLookup[$taskToSync['itemId']] ?? null;

            //no id matches -> insert task into db
            if (is_null($matchingElement)) {
                $result = $this->save($taskToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }

            if (!is_null($matchingElement)) {
                if ($taskToSync['created'] == $matchingElement['created'] && $taskToSync['lastEdited'] > $matchingElement['lastEdited']) {
                    $query = "UPDATE $this->tableName SET class=:class, subject=:subject, date=:date, timeslot=:timeslot, description=:description, status=:status, fixedTime=:fixedTime, reoccuring=:reoccuring, reoccuringInterval=:reoccuringInterval, created=:created, lastEdited=:lastEdited WHERE userId = :userId AND itemId = :itemId AND created = :created";
                }

                //duplicate Ids
                if ($taskToSync['created'] != $matchingElement['created']) {
                    $newId = max(array_column($storedTasks, 'itemId')) + 1;
                    $taskToSync['itemId'] = $newId;
                    $storedTasks[] = $taskToSync;

                    $query = "INSERT INTO $this->tableName 
                        (userId, itemId, date, timeslot, class, subject, description, status, fixedTime, reoccuring, reoccuringInterval, created, lastEdited) 
                        VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :description, :status, :fixedTime, :reoccuring, :reoccuringInterval, :created, :lastEdited)";
                }
            }

            if ($query != '') {
                $result = $this->write($query, $taskToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
                error_log('taskToSync' . print_r($taskToSync, true));
                if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($taskToSync['lastEdited']));
            }
        }

        return $finalResult;
    }
}
