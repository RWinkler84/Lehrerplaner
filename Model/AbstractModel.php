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
            $stmt->bindParam(...$params);
        }

        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $result;
    }

    protected function write($query, $params)
    {
        global $db;
                error_log(print_r($params, true));


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
        $query = 'SELECT * FROM subjects';
        $params = [];

        return $this->read($query, $params);
    }

    public function getTimetable()
    {
        $query = 'SELECT * FROM timetable';
        $params = [];

        return $this->read($query, $params);
    }

    public function getTimetableChanges()
    {
        $query = 'SELECT * FROM timetableChanges';
        $params = [];

        return $this->read($query, $params);
    }

    public function getAllTasks()
    {
        $query = 'SELECT * FROM tasks';
        $params = [];

        return $this->read($query, $params);
    }
}
