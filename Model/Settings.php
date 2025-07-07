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

    public function deleteSubjects($ids)
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
        error_log(print_r($timetableData,true));
        
        $tableName = TABLEPREFIX . 'timetable';
        $timetableData = $this->preprocessDataToWrite($timetableData);
        $finalResult['status'] = 'success';

        //edited timetables will have a lastEdited field, new timetables won't
        $query = "
            INSERT INTO $tableName (userId, itemId, validFrom, validUntil, class, subject, weekdayNumber, timeslot) 
            VALUES (:userId, :itemId, :validFrom, :validUntil, :class, :subject, :weekdayNumber, :timeslot)
            ";

        if (isset($timetableData[0]['lastEdited'])) {
            $query = "
            INSERT INTO $tableName (userId, itemId, validFrom, validUntil, class, subject, weekdayNumber, timeslot, lastEdited) 
            VALUES (:userId, :itemId, :validFrom, :validUntil, :class, :subject, :weekdayNumber, :timeslot, :lastEdited)
            ";
        }

        foreach ($timetableData as $lesson) {
            if (empty($lesson['validUntil'])) {
                $lesson['validUntil'] = null;
            }

            $result = $this->write($query, $lesson);

            if ($result['status'] == 'failed') $finalResult['status'] = 'failed';
        }

        return $finalResult;
    }

    // saving timetable changes is devided in two parts: deleting the old timetable and saving the new one afterwards
    // only if this order is maintained, it is garantued that the timetable will be displayed correctly later
    public function saveTimetableChanges($timetableData)
    {
        global $user;

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'timetable';

        $tries = 0;
        $finalResult['status'] = 'success';
        $validFromDates = [];

        foreach ($timetableData as $lesson) {
            if (!in_array($lesson['validFrom'], $validFromDates)) array_push($validFromDates, $lesson['validFrom']);
        }

        $query = "DELETE FROM $tableName WHERE userId = $userId AND validFrom = :validFrom";

        foreach ($validFromDates as $validFromDate) {
            $deleted['status'] = 'failed';

            while ($tries < 5 && $deleted['status'] == 'failed') {
                $deleted = $this->executeQuery($query, ['validFrom' => $validFromDate]);
                $tries++;
            }
        }

        if ($deleted['status'] == 'success') {
            $result = $this->saveTimetable($timetableData);

            if ($result['status'] == 'failed') $finalResult['status'] = 'failed';
        }

        return $finalResult;
    }

    //query function necessary for the saveTimetableChanges function
    private function executeQuery($query, $params)
    {
        try {
            $this->delete($query, $params);
        } catch (Exception $e) {
            return ['status' => 'failed'];
        }

        return ['status' => 'success'];
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
        $finalResult['status'] = 'success';

        foreach ($subjectsData as $subject) {
            $query = "
                INSERT INTO $tableName (userId, itemId, subject, colorCssClass, lastEdited) VALUES (:userId, :itemId, :subject, :colorCssClass, :lastEdited)
                ON DUPLICATE KEY UPDATE
                subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
                colorCssClass = IF (VALUES(lastEdited) > lastEdited, VALUES(colorCssClass), colorCssClass),
                lastEdited =  IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
            ";

            $result = $this->write($query, $subject);

            if ($result['status'] == 'failed') $finalResult['status'] = 'failed';
        }

        return $finalResult;
    }

    // public function syncTimetable($timetableData)
    // {
    //     $timetableData = $this->preprocessDataToWrite($timetableData);
    //     $results = [];
    //     $tableName = TABLEPREFIX . 'timetable';

    //     $query = "
    //         INSERT INTO $tableName (userId, itemId, validFrom, validUntil, class, subject, weekdayNumber, timeslot, lastEdited)
    //         VALUES (:userId, :itemId, :validFrom, :validUntil, :class, :subject, :weekdayNumber, :timeslot, :lastEdited)
    //         ON DUPLICATE KEY UPDATE
    //             validFrom = IF (VALUES(lastEdited) > lastEdited, VALUES(validFrom), validFrom),
    //             validUntil = IF (VALUES(lastEdited) > lastEdited, VALUES(validUntil), validUntil),
    //             class = IF (VALUES(lastEdited) > lastEdited, VALUES(class), class),
    //             subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
    //             weekdayNumber = IF (VALUES(lastEdited) > lastEdited, VALUES(weekdayNumber), weekdayNumber),
    //             timeslot = IF (VALUES(lastEdited) > lastEdited, VALUES(timeslot), timeslot),
    //             lastEdited =  IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
    //         ";

    //     foreach ($timetableData as $lesson) {
    //         if (!isset($lesson['validUntil']) || empty($lesson['validUntil'])) $lesson['validUntil'] = null;

    //         $result = $this->write($query, $lesson);
    //         $result['lesson'] = $lesson;
    //         array_push($results, $result);
    //     }
    //     return $results;
    // }
}
