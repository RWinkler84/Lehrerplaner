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

    public function syncTimetableChanges($timetableChanges)
    {
        $timetableChanges = $this->preprocessDataToWrite($timetableChanges);
        $finalResult = ['status' => 'success'];

        $query = "
            INSERT INTO $this->tableName (userId, itemId, date, timeslot, class, weekday, subject, type, canceled, created, lastEdited)
            VALUES (:userId, :itemId, :date, :timeslot, :class, :weekday, :subject, :type, :canceled, :created, :lastEdited)
            ON DUPLICATE KEY UPDATE
                date = IF (VALUES(lastEdited) > lastEdited, VALUES(date), date),
                timeslot = IF (VALUES(lastEdited) > lastEdited, VALUES(timeslot), timeslot),
                class = IF (VALUES(lastEdited) > lastEdited, VALUES(class), class),
                weekday = IF (VALUES(lastEdited) > lastEdited, VALUES(weekday), weekday),
                subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
                type = IF (VALUES(lastEdited) > lastEdited, VALUES(type), type),
                canceled = IF (VALUES(lastEdited) > lastEdited, VALUES(canceled), canceled),
                lastEdited = IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
            ";

        foreach ($timetableChanges as $lesson) {
            $result = $this->write($query, $lesson);

            if ($result['status'] == 'failed') {
                $finalResult['status'] = 'failed';
                $finalResult['error'] = $result['error'];
            }

            if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lesson['lastEdited']));
        }

        return $finalResult;
    }
}
