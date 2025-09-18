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
                'itemId' => $entry['id'] ?? $entry['itemId'],
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

    public function syncSubjects($subjectsToSync, $subjectsToDelete)
    {
        global $user;

        $tableName = TABLEPREFIX . 'subjects';
        if (!empty($subjectsToSync)) $subjectsToSync = $this->preprocessDataToWrite($subjectsToSync);
        if (!empty($subjectsToDelete)) $subjectsToDelete = $this->preprocessDataToWrite($subjectsToDelete);
        $finalResult['status'] = 'success';

        $storedSubjects = $this->read("SELECT * FROM $tableName WHERE userId = :userId", ['userId' => $user->getId()]);

        //delete undeleted subjects
        if (!empty($subjectsToDelete)) {
            $storedSubjects = $this->removeDeletedSubjects($storedSubjects, $subjectsToDelete);

            if (!is_array($storedSubjects) && $storedSubjects == 'false') {
                return ['status' => 'failed', 'error' => 'Subject deletion failed'];
            }
        }
        if (!empty($subjectsToSync)) {
            $lookup = [];

            foreach ($storedSubjects as $storedSubject) {
                $lookup[$storedSubject['itemId']] = $storedSubject;
            }

            foreach ($subjectsToSync as $subject) {
                $result = ['status' => 'success'];
                $query = '';
                $matchingStoredEntry = $lookup[$subject['itemId']] ?? null;

                //no duplicate id found
                if (is_null($matchingStoredEntry)) {
                    $query = "INSERT INTO $tableName (userId, itemId, subject, colorCssClass, created, lastEdited) VALUES (:userId, :itemId, :subject, :colorCssClass, :created, :lastEdited)";
                }

                //duplicate id, same creation datetime -> update
                if (!is_null($matchingStoredEntry)) {
                    if ($subject['created'] == $matchingStoredEntry['created'] && $subject['lastEdited'] > $matchingStoredEntry['lastEdited']) {
                        $query = "UPDATE $tableName SET userId = :userId, itemId = :itemId, subject = :subject, colorCssClass = :colorCssClass, created = :created, lastEdited = :lastEdited WHERE userId = :userId AND itemId = :itemId And created = :created";
                    }

                    if ($subject['created'] != $matchingStoredEntry['created']) {
                        $newId = max(array_column($storedSubjects, 'itemId')) + 1;
                        $subject['itemId'] = $newId;
                        $storedSubjects[] = $subject;

                        $query = "INSERT INTO $tableName (userId, itemId, subject, colorCssClass, created, lastEdited) VALUES (:userId, :itemId, :subject, :colorCssClass, :created, :lastEdited)";
                    }
                }

                if ($query != '') {
                    $result = $this->write($query, $subject);

                    if ($result['status'] == 'failed') {
                        return [
                            'status' => 'failed',
                            'error' => $result['error']
                        ];
                    }

                    if ($result['status'] == 'success') $this->setDbUpdateTimestamp($tableName, new DateTime($subject['lastEdited']));
                }
            }
        }

        return $finalResult;
    }

    public function removeDeletedSubjects($storedSubjects, $subjectsToDelete)
    {
        $removalResult = $this->deleteSubjects($subjectsToDelete);

        if ($removalResult['status'] == 'failed') return $removalResult;

        $lookup = [];

        foreach ($subjectsToDelete as $subject) {
            $lookup["{$subject['itemId']} - {$subject['created']}"] = 'true';
        }

        $filteredStoredSubjects = array_filter($storedSubjects, function ($subject) use ($lookup) {
            return !isset($lookup["{$subject['itemId']} - {$subject['created']}"]);
        });


        return $filteredStoredSubjects;
    }

    public function syncTimetable($timetablesToSync)
    {
        global $user;

        $tableName = TABLEPREFIX . 'timetable';
        $timetablesToSync = $this->preprocessDataToWrite($timetablesToSync);
        $finalResult['status'] = 'success';

        $storedTimetables = $this->read("SELECT * FROM $tableName WHERE userId = :userId", ['userId' => $user->getId()]);

        //updates
        $validFromSyncLookup = [];

        foreach ($timetablesToSync as $lesson) {
            $validFromSyncLookup[$lesson['validFrom']]['lastEdited'] = $lesson['lastEdited'];
        }

        // this loop determines, which of the send lessons need to be stored as an update or inserted and removes those from timetableToSync, 
        // which need neither
        do {
            $isMatch = false;
            $timetableToUpdate = [];
            $result = ['status' => 'success'];

            foreach ($storedTimetables as $storedLesson) {
                //are there lessons in the new data with the same validFrom date, which are newer?
                if (isset($validFromSyncLookup[$storedLesson['validFrom']]) && $validFromSyncLookup[$storedLesson['validFrom']]['lastEdited'] > $storedLesson['lastEdited']) {
                    $isMatch = true;

                    //get those lessons
                    $timetableToUpdate = array_values(array_filter($timetablesToSync, function ($lessonToSync) use ($storedLesson) {
                        return $storedLesson['validFrom'] == $lessonToSync['validFrom'];
                    }));

                    //and filter them out of timetablesToSync since they are getting handled with an update
                    $timetablesToSync = array_values(array_filter($timetablesToSync, function ($lessonToSync) use ($storedLesson) {
                        return $lessonToSync['validFrom'] != $storedLesson['validFrom'];
                    }));

                    break;
                } else if ((isset($validFromSyncLookup[$storedLesson['validFrom']]) && $validFromSyncLookup[$storedLesson['validFrom']]['lastEdited'] <= $storedLesson['lastEdited'])) {
                    $isMatch = true;

                    //lessonsToSync are older or equally old, remove them from the lessonsToSync, because they don't need to be updated or inserted
                    $timetablesToSync = array_values(array_filter($timetablesToSync, function ($lessonToSync) use ($storedLesson) {
                        return $lessonToSync['validFrom'] != $storedLesson['validFrom'];
                    }));
                }
            }

            if ($isMatch) {
                //reduce the entries to iterate for the next loop by filtering out the stored timetable that will be updated
                $storedTimetables = array_filter($storedTimetables, function ($lesson) use ($storedLesson) {
                    return $storedLesson['validFrom'] != $lesson['validFrom'];
                });
            }

            if (!empty($timetableToUpdate)) $result = $this->saveTimetableUpdates($timetableToUpdate);

            if ($result['status'] == 'failed') {
                $finalResult = [
                    'result' => 'failed',
                    'error' => 'Updating timetable failed'
                ];
                $isMatch = false;
            }
        } while ($isMatch);

        //insert new ones
        if (!empty($timetablesToSync)) {
            $storedTimetables = $this->read("SELECT * FROM $tableName WHERE userId = :userId", ['userId' => $user->getId()]);

            $storedItemIdLookup = [];

            foreach ($storedTimetables as $storedLesson) {
                $storedItemIdLookup[$storedLesson['itemId']] = true;
            }

            foreach ($timetablesToSync as &$lessonToSync) {
                if (isset($storedItemIdLookup[$lessonToSync['itemId']])) {
                    $lessonToSync['itemId'] = max(array_column($storedTimetables, 'itemId')) + 1;
                    $storedTimetables[] = $lessonToSync;
                    $storedItemIdLookup[$lessonToSync['itemId']] = true;
                }
            }

            $result = $this->saveTimetable(array_values($timetablesToSync));

            if ($result['status'] == 'failed') {
                return [
                    'status' => 'failed',
                    'error' => 'Saving timetables failed'
                ];
            }

            error_log('timetable to sync ' . print_r($timetablesToSync, true));
            error_log($timetablesToSync[count($timetablesToSync) - 1]['lastEdited']);
            $this->setDbUpdateTimestamp($tableName, new DateTime($timetablesToSync[count($timetablesToSync) - 1]['lastEdited']));
        }

        $this->setValidUntilDatesAfterTimetableSync();

        return $finalResult;
    }

    private function setValidUntilDatesAfterTimetableSync()
    {
        global $user;
        $tableName = TABLEPREFIX . 'timetable';

        $storedTimetables = $this->read("SELECT * FROM $tableName WHERE userId = :userId", ['userId' => $user->getId()]);
        $allTs = $this->read("SELECT * FROM updateTimestamps WHERE userId = :userId", ['userId' => $user->getId()]);
        $timetableTimestamp = $allTs[0]['timetable'];

        usort($storedTimetables, function ($a, $b) {
            $aDate = (new DateTime($a['validFrom']))->getTimestamp();
            $bDate = (new DateTime($b['validFrom']))->getTimestamp();
            return $aDate - $bDate;
        });

        $timetablesGrouped = [];
        $lessonsToUpdate = [];

        foreach ($storedTimetables as $lesson) {
            $timetablesGrouped[$lesson['validFrom']][] = $lesson;
        }

        $allValidFromDates = array_keys($timetablesGrouped);

        for ($i = 0; $i < count($allValidFromDates) - 1; $i++) {

            $validUntilDate = (new DateTime($allValidFromDates[$i + 1]))->modify('-1 day')->format('Y-m-d');

            foreach ($timetablesGrouped[$allValidFromDates[$i]] as $lesson) {
                if (empty($lesson['validUntil'])) {
                    $lesson['validUntil'] = $validUntilDate;
                    $lesson['lastEdited'] = (new DateTime($timetableTimestamp))->modify('+1 minute')->format('Y-m-d H:i:s');
                    unset($lesson['id']);

                    $lessonsToUpdate[] = $lesson;
                }
            }
        }

        if (!empty($lessonsToUpdate)) $this->saveTimetableUpdates($lessonsToUpdate);
    }
}
