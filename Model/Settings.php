<?php

namespace Model;

use Model\AbstractModel;
use Exception;
use DateTime;

class Settings extends AbstractModel
{
    public function saveSubject($subject)
    {
        $tableName = TABLEPREFIX . 'subjects';
        $subject = $this->preprocessDataToWrite($subject);

        $query = "INSERT INTO $tableName (userId, itemId, subject, colorCssClass, created, lastEdited) VALUES (:userId, :itemId, :subject, :colorCssClass, :created, :lastEdited)";

        $result = $this->write($query, $subject);

        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($tableName, new DateTime($subject['lastEdited']));

        return $result;
    }

    public function deleteSubjects($subjects)
    {
        global $user;

        if (is_null($user)) {
            echo json_encode(['status' => 'failed', 'error' => 'User not logged in']);
            exit;
        }

        $tableName = TABLEPREFIX . 'subjects';
        $finalResult['status'] = 'success';

        $query = "DELETE FROM $tableName WHERE userId = :userId AND itemId = :itemId AND created = :created";

        foreach ($subjects as $entry) {
            $queryData = [
                'userId' => $user->getId(),
                'itemId' => $entry['id'],
                'created' => $entry['created']
            ];

            $result = $this->delete($query, $queryData);

            if ($result['status'] == 'failed') $finalResult['status'] = 'failed';
        };

        if ($finalResult['status'] == 'success') $this->setDbUpdateTimestamp($tableName, new DateTime($subjects[0]['lastEdited']));

        return $finalResult;
    }

    public function saveTimetable($timetableData)
    {
        $tableName = TABLEPREFIX . 'timetable';
        $timetableData = $this->preprocessDataToWrite($timetableData);
        $finalResult['status'] = 'success';

        $query = "
            INSERT INTO $tableName (userId, itemId, validFrom, validUntil, class, subject, weekday, timeslot, created, lastEdited) 
            VALUES (:userId, :itemId, :validFrom, :validUntil, :class, :subject, :weekday, :timeslot, :created, :lastEdited)
            ";

        foreach ($timetableData as $lesson) {
            if (empty($lesson['validUntil'])) {
                $lesson['validUntil'] = null;
            }

            $result = $this->write($query, $lesson);

            if ($result['status'] == 'failed') {
                $finalResult['status'] = 'failed';
                $finalResult['error'] = $result['error'];
                $finalResult['message'] = $result['message'];
            }
        }

        if ($finalResult['status'] == 'success') $this->setDbUpdateTimestamp($tableName, new DateTime($timetableData[0]['lastEdited']));

        return $finalResult;
    }

    // saving timetable changes is devided in two parts: deleting the old timetable and saving the new one afterwards
    // only if this order is maintained, it is garantued that the timetable will be displayed correctly later
    public function saveTimetableUpdates($timetableData)
    {
        global $user;

        if (is_null($user)) {
            echo json_encode(['status' => 'failed', 'error' => 'User not logged in']);
            exit;
        }

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

            if ($result['status'] == 'failed') {
                $finalResult['status'] = 'failed';
                $finalResult['error'] = $result['error'];
                $finalResult['message'] = $result['message'];
            }
        }

        if ($finalResult['status'] == 'success') $this->setDbUpdateTimestamp($tableName, new DateTime($timetableData[0]['lastEdited']));

        return $finalResult;
    }

    //query function necessary for the saveTimetableUpdates function
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

        if (is_null($user)) {
            echo json_encode(['status' => 'failed', 'error' => 'User not logged in']);
            exit;
        }

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'timetable';
        $validUntilDate = $dates['validUntil'];
        $validFromDate = $dates['dateOfAffectedLessons'];
        $lastEdited = $dates['lastEdited'];

        $query = "UPDATE $tableName SET validUntil = '$validUntilDate', lastEdited = '$lastEdited' WHERE userId = $userId AND validFrom = '$validFromDate'";

        return $this->write($query, []);
    }

    public function syncSubjects($subjectsToSync)
    {
        global $user;

        $tableName = TABLEPREFIX . 'subjects';
        $subjectsToSync = $this->preprocessDataToWrite($subjectsToSync);
        $finalResult['status'] = 'success';

        $storedSubjects = $this->read("SELECT * FROM $tableName WHERE userId = :userId", ['userId' => $user->getId()]);
        error_log(print_r($storedSubjects, true));

        $lookup = [];

        foreach ($storedSubjects as $storedSubject) {
            $lookup[$storedSubject['itemId']] = $storedSubject;
        }

        foreach ($subjectsToSync as $subject) {
            $matchingStoredEntry = $lookup[$subject['itemId']] ?? null;

            //no duplicate id found
            if (is_null($matchingStoredEntry)) {
                $query = "INSERT INTO $tableName (userId, itemId, subject, colorCssClass, created, lastEdited) VALUES (:userId, :itemId, :subject, :colorCssClass, :created, :lastEdited)";
            }

            //duplicate id, same creation datetime -> update
            if (!is_null($matchingStoredEntry)) {
                if ($subject['created'] == $matchingStoredEntry['created']) {
                    $query = "UPDATE $tableName SET userId = :userId, itemId = :itemId, subject = :subject, colorCssClass = :colorCssClass, created = :created, lastEdited = :lastEdited WHERE userId = :userId AND itemId = :itemId And created = :created";
                } else {
                    return [
                        'status' => 'failed',
                        'error' => 'id collision'
                    ];
                }
            }

            $result = $this->write($query, $subject);

            if ($result['status'] == 'failed') {
                $finalResult['status'] = 'failed';
                $finalResult['error'] = $result['error'];
            }

            if ($result['status'] == 'success') $this->setDbUpdateTimestamp($tableName, new DateTime($subject['lastEdited']));
        }

        return $finalResult;
    }
}
