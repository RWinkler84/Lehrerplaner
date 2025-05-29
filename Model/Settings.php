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

    public function deleteSubject($ids)
    {
        global $user;

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'subjects';
        $results = [];


        $query = "DELETE FROM $tableName WHERE userId = $userId AND itemId=:id";

        foreach ($ids as $entry) {
            $item['id'] = $entry['id'];

            $result = $this->delete($query, $item);
            $result['id'] = $entry['id'];
            array_push($results, $result);
        };

        return $results;
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

    public function saveTimetableChanges($timetableData)
    {
        $timetableData = $this->preprocessDataToWrite($timetableData);
        $tableName = TABLEPREFIX . 'timetable';
        $results = [];

        $query = "
            INSERT INTO $tableName (userId, itemId, validFrom, validUntil, class, subject, weekdayNumber, timeslot, lastEdited)
            VALUES (:userId, :itemId, :validFrom, :validUntil, :class, :subject, :weekdayNumber, :timeslot, :lastEdited)
            ON DUPLICATE KEY UPDATE
                validFrom = IF (VALUES(lastEdited) > lastEdited, VALUES(validFrom), validFrom),
                validUntil = IF (VALUES(lastEdited) > lastEdited, VALUES(validUntil), validUntil),
                class = IF (VALUES(lastEdited) > lastEdited, VALUES(class), class),
                subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
                weekdayNumber = IF (VALUES(lastEdited) > lastEdited, VALUES(weekdayNumber), weekdayNumber),
                timeslot = IF (VALUES(lastEdited) > lastEdited, VALUES(timeslot), timeslot),
                lastEdited =  IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
        ";

        foreach ($timetableData as $lesson) {

            if (empty($lesson['validUntil'])) $lesson['validUntil'] = null;

            $result = $this->write($query, $lesson);
            array_push($results, $result);
        }

        return $results;
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

    public function syncSubjects($subjectsData)
    {
        $tableName = TABLEPREFIX . 'subjects';
        $subjectsData = $this->preprocessDataToWrite($subjectsData);
        $results = [];

        foreach ($subjectsData as $subject) {
            $query = "
                INSERT INTO $tableName (userId, itemId, subject, colorCssClass, lastEdited) VALUES (:userId, :itemId, :subject, :colorCssClass, :lastEdited)
                ON DUPLICATE KEY UPDATE
                subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
                colorCssClass = IF (VALUES(lastEdited) > lastEdited, VALUES(colorCssClass), colorCssClass),
                lastEdited =  IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
            ";

            $result = $this->write($query, $subject);
            array_push($results, $result);
        }

        return $results;
    }

    public function syncTimetable($timetableData)
    {
        $timetableData = $this->preprocessDataToWrite($timetableData);
        $results = [];
        $tableName = TABLEPREFIX . 'timetable';

        $query = "
            INSERT INTO $tableName (userId, itemId, validFrom, validUntil, class, subject, weekdayNumber, timeslot, lastEdited)
            VALUES (:userId, :itemId, :validFrom, :validUntil, :class, :subject, :weekdayNumber, :timeslot, :lastEdited)
            ON DUPLICATE KEY UPDATE
                validFrom = IF (VALUES(lastEdited) > lastEdited, VALUES(validFrom), validFrom),
                validUntil = IF (VALUES(lastEdited) > lastEdited, VALUES(validUntil), validUntil),
                class = IF (VALUES(lastEdited) > lastEdited, VALUES(class), class),
                subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
                weekdayNumber = IF (VALUES(lastEdited) > lastEdited, VALUES(weekdayNumber), weekdayNumber),
                timeslot = IF (VALUES(lastEdited) > lastEdited, VALUES(timeslot), timeslot),
                lastEdited =  IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
            ";

        foreach ($timetableData as $lesson) {
            if (!isset($lesson['validUntil']) || empty($lesson['validUntil'])) $lesson['validUntil'] = null;
            
            $result = $this->write($query, $lesson);
            array_push($results, $result);
        }
        // error_log(print_r($results, true));
        return $results;
    }
}
