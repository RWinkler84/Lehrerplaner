<?php

namespace Model;

use DateTime;
use Model\AbstractModel;

class Lesson extends AbstractModel
{
    private $tableName = TABLEPREFIX . 'timetableChanges';

    public function save($lessonData)
    {
        $lessonData = $this->preprocessDataToWrite($lessonData);

        $query = "INSERT INTO $this->tableName (userId, itemId, date, weekday, timeslot, class, subject, type, canceled, created, lastEdited) VALUES (:userId, :itemId, :date, :weekday, :timeslot, :class, :subject, :type, :canceled, :created, :lastEdited)";

        $result = $this->write($query, $lessonData);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonData['lastEdited']));

        return $result;
    }

    public function cancel($lessonData)
    {
        $lessonData = $this->preprocessDataToWrite($lessonData);
        $query = "UPDATE $this->tableName SET canceled = 'true', lastEdited = :lastEdited WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $queryData = [
            'userId' => $lessonData['userId'],
            'itemId' => $lessonData['itemId'],
            'created' => $lessonData['created'],
            'lastEdited' => $lessonData['lastEdited']
        ];

        $result = $this->write($query, $queryData);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonData['lastEdited']));

        return $result;
    }

    public function uncancel($lessonData)
    {
        $lessonData = $this->preprocessDataToWrite($lessonData);
        $query = "UPDATE $this->tableName SET canceled = 'false', lastEdited = :lastEdited WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $queryData = [
            'userId' => $lessonData['userId'],
            'itemId' => $lessonData['itemId'],
            'created' => $lessonData['created'],
            'lastEdited' => $lessonData['lastEdited']
        ];

        $result = $this->write($query, $queryData);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonData['lastEdited']));

        return $result;
    }

    public function deleteLesson($lesson)
    {

        $lesson = $this->preprocessDataToWrite($lesson);

        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $queryData = [
            'userId' => $lesson['userId'],
            'itemId' => $lesson['itemId'],
            'created' => $lesson['created'],
        ];

        $result = $this->delete($query, $queryData);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lesson['lastEdited']));

        return $result;
    }

    public function syncTimetableChanges($changesToSync, $changesToDelete)
    {
        global $user;
        $finalResult = ['status' => 'success'];

        //remove deleted lessonChanges, preprocessing an picking of the right db entries is handeled by deleteLesson()
        if (!empty($changesToDelete)) {
            foreach ($changesToDelete as $lesson) {
                $result = $this->deleteLesson($lesson);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }
        }

        //insert or update lessonChanges
        if (!empty($changesToSync)) $changesToSync = $this->preprocessDataToWrite($changesToSync);

        $storedChanges = $this->read("SELECT * FROM $this->tableName WHERE userId = :userId", ['userId' => $user->getId()]);
        $storedLessonsLookup = [];

        foreach ($storedChanges as $lesson) {
            $storedLessonsLookup[$lesson['itemId']] = $lesson;
        }

        foreach ($changesToSync as $lessonToSync) {
            $query = '';
            $matchingElement = $storedLessonsLookup[$lessonToSync['itemId']] ?? null;

            //no id matches -> insert lesson to db
            if (is_null($matchingElement)) {
                $result = $this->save($lessonToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }

            if (!is_null($matchingElement)) {
                if ($lessonToSync['created'] == $matchingElement['created'] && $lessonToSync['lastEdited'] > $matchingElement['lastEdited']) {
                    $query = "UPDATE $this->tableName SET 
                    userId=userId:,itemId=itemId:,date=date:,weekday=weekday:,timeslot=timeslot:,class=class:,subject=subject:,canceled=canceled:,type=type:,created=created:,lastEdited=lastEdited: 
                    WHERE userId = :userId AND itemId = :itemId And created = :created";
                }

                //duplicate Ids
                if ($lessonToSync['created'] != $matchingElement['created']) {
                    $newId = max(array_column($storedChanges, 'itemId')) + 1;
                    $lessonToSync['itemId'] = $newId;
                    $storedChanges[] = $lessonToSync;

                    $query = "INSERT INTO $this->tableName (userId, itemId, date, weekday, timeslot, class, subject, type, canceled, created, lastEdited) VALUES (:userId, :itemId, :date, :weekday, :timeslot, :class, :subject, :type, :canceled, :created, :lastEdited)";
                }
            }

            if ($query != '') {
                $result = $this->write($query, $lessonToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }

                if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonToSync['lastEdited']));
            }
        }

        return $finalResult;
    }
}
