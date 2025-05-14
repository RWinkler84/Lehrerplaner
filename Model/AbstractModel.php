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
        $tableName = TABLEPREFIX . 'subjects';
        $query = "SELECT * FROM $tableName";
        $params = [];

        $dataFromDb = $this->read($query, $params);

        return $this->escapeDbData($dataFromDb);
    }

    public function getTimetable()
    {
        $tableName = TABLEPREFIX . 'timetable';
        $query = "SELECT * FROM $tableName";
        $params = [];

        $dataFromDb = $this->read($query, $params);

        return $this->escapeDbData($dataFromDb);
    }

    public function getTimetableChanges()
    {
        $tableName = TABLEPREFIX . 'timetableChanges';
        $query = "SELECT * FROM $tableName";
        $params = [];

        $dataFromDb = $this->read($query, $params);

        return $this->escapeDbData($dataFromDb);
    }

    public function getAllTasks()
    {
        $tableName = TABLEPREFIX . 'tasks';
        $query = "SELECT * FROM $tableName";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        
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
}
