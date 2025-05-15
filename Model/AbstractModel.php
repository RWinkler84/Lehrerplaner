<?php

namespace Model;

use Exception;
use PDO;
use DateTime;

class AbstractModel
{
    protected function read($query, $params)
    {
        global $db;

        $stmt = $db->prepare($query);

        if (count($params) > 0) {
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
        }

        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $result;
    }

    protected function write($query, $params)
    {
        global $db;

        try {
            $stmt = $db->prepare($query);

            foreach ($params as $key => $value) {
                if ($key == 'date') {
                    $date = new DateTime($value);
                    $value = $date->format('Y-m-d');
                }
                $stmt->bindValue($key, $value);
            }

            $stmt->execute();
        } catch (Exception $e) {
            error_log('Fehler beim Speichern der Daten: ' . $e);
            http_response_code(500);
            return ['message' => $e];
        }

        return ['message' => 'Data saved sucessfully'];
    }

    protected function delete($query, $params)
    {
        global $db;

        try {
            $stmt = $db->prepare($query);

            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            $stmt->execute();
        } catch (Exception $e) {
            error_log('Fehler beim Löschen der Daten: ' . $e);
            http_response_code(500);
        }

        return ['message' => 'Lesson deleted sucessfully'];
    }

    public function getSubjects()
    {
        global $user;
        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'subjects';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        return $this->escapeDbData($dataFromDb);
    }

    public function getTimetable()
    {
        global $user;
        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'timetable';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        return $this->escapeDbData($dataFromDb);
    }

    public function getTimetableChanges()
    {
        global $user;
        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'timetableChanges';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        return $this->escapeDbData($dataFromDb);
    }

    public function getAllTasks()
    {
        global $user;
        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'tasks';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        return $this->escapeDbData($dataFromDb);
    }

    //escape
    private function escapeDbData($data)
    {
        foreach ($data as $k => $dataset) {
            foreach ($dataset as $key => $value) {
                $data[$k][$key] = htmlspecialchars($value);
            }
        }

        return $data;
    }

    protected function preprocessReadData($dataArray)
    {
        $dataArray = array_map(function ($data) {
            $data['id'] = $data['itemId'];
            unset($data['userId']);
            unset($data['itemId']);

            return $data;
        }, $dataArray);

        return $dataArray;
    }

    protected function preprocessDataToWrite($dataArray)
    {
        global $user;

        //sometimes dataArray will be a set of associative arrays, sometimes it will just be a single associative array
        if (isset($dataArray[0])) {

            $dataArray = array_map(function ($data) {
                global $user;

                $data['userId'] = $user->getId();
                $data['itemId'] = $data['id'];
                unset($data['id']);

                return $data;
            }, $dataArray);

        } else {
            $dataArray['userId'] = $user->getId();
            $dataArray['itemId'] = $dataArray['id'];
            unset($dataArray['id']);
        }

        return $dataArray;

    }
}
