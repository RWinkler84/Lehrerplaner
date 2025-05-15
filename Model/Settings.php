<?php

namespace Model;

use Model\AbstractModel;
use Exception;

class Settings extends AbstractModel
{
    public function saveSubject($subject)
    {
        $tableName = TABLEPREFIX . 'subjects';
        $subject = $this->preprocessDataToWrite($subject);

        $query = "INSERT INTO $tableName (userId, itemId, subject, colorCssClass) VALUES (:userId, :itemId, :subject, :colorCssClass)";

        return $this->write($query, $subject);
    }

    public function deleteSubject($id)
    {
        global $user;

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'subjects';
        $query = "DELETE FROM $tableName WHERE userId = $userId AND itemId=:id";

        $result = $this->delete($query, $id);

        echo json_encode($result);
    }

    public function saveTimetable($timetableData)
    {
        $tableName = TABLEPREFIX . 'timetable';
        $timetableData = $this->preprocessDataToWrite($timetableData);
        $allResults = [];

        $query = "INSERT INTO $tableName (userId, itemId, validFrom, validUntil, class, subject, weekdayNumber, timeslot) VALUES (:userId, :itemId, :validFrom, :validUntil, :class, :subject, :weekdayNumber, :timeslot)";

        foreach ($timetableData as $k => $values) {
            if (!isset($values['validUntil'])) {
                $values['validUntil'] = null;
            }

            $result = $this->write($query, $values);
            array_push($allResults, $result);
        }

        return $allResults;
    }

    // saving timetable changes is devided in two parts: deleting the old timetable and saving the new one afterwards
    // only if this order is maintained, it is garantued that the timetable will be displayed correctly later
    public function saveTimetableChanges($timetableData)
    {
        global $user;

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'timetable';

        $tries = 0;
        $validFromDate['validFrom'] = $timetableData[0]['validFrom'];

        $query = "DELETE FROM $tableName WHERE userId = $userId AND validFrom = :validFrom";

        try {
            $deleted = $this->executeQuery($query, $validFromDate);
        } catch (Exception $e) {
            $this->executeQuery($query, $validFromDate);
            $tries++;

            if ($tries == 5) {
                die('Löschen der alten Daten fehlgeschlagen!');
            }
        }

        if ($deleted['message'] == 'Lesson deleted sucessfully') {
            $this->saveTimetable($timetableData);
        }
    }

    public function updateValidUntil($dates)
    {
        global $user;

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'timetable';
        $validUntilDate = $dates['validUntil'];
        $validFromDate = $dates['dateOfAffectedLessons'];

        $query = "UPDATE $tableName SET validUntil = '$validUntilDate' WHERE userId = $userId AND validFrom = '$validFromDate'";

        return $this->write($query, []);
    }

    //query function necessary for the saveTimetableChanges function
    private function executeQuery($query, $params)
    {
        return $this->delete($query, $params);
    }
}
