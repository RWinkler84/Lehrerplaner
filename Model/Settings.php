<?php

namespace Model;

use Model\AbstractModel;
use Exception;

class Settings extends AbstractModel
{
    public function saveSubject($subject)
    {
        $query = 'INSERT INTO subjects (id, subject, colorCssClass) VALUES (:id, :subject, :colorCssClass)';

        return $this->write($query, $subject);
    }

    public function deleteSubject($id)
    {
        $query = 'DELETE FROM subjects WHERE id=:id';

        $result = $this->delete($query, $id);

        echo json_encode($result);
    }

    public function saveTimetable($timetableData)
    {
        $allResults = [];
        $query = 'INSERT INTO timetable (validFrom, class, subject, weekdayNumber, timeslot) VALUES (:validFrom, :class, :subject, :weekdayNumber, :timeslot)';

        foreach ($timetableData as $k => $values) {
            $result = $this->write($query, $values);
            array_push($allResults, $result);
        }

        return $allResults;
    }

    // saving timetable changes is devided in two parts: deleting the old timetable and saving the new one afterwards
    // only if this order is maintained, it is garantued that the timetable will be displayed correctly later
    public function saveTimetableChanges($timetableData)
    {
        $tries = 0;
        $validFromDate['validFrom'] = $timetableData[0]['validFrom'];

        $query = 'DELETE FROM timetable WHERE validFrom = :validFrom';

        try {
            $deleted = $this->executeQuery($query, $validFromDate);
        } catch (Exception $e) {
            $this->executeQuery($query, $validFromDate);
            $tries++;

            error_log($tries);

            if ($tries == 5) {
                die('Löschen der alten Daten fehlgeschlagen!');
            }
        }

        if ($deleted['message'] == 'Lesson deleted sucessfully') {
            $this->saveTimetable($timetableData);
        }
    }

    private function executeQuery($query, $params)
    {
        return $this->delete($query, $params);
    }
}
