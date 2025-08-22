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
        $query = "INSERT INTO $this->tableName (userId, itemId, date, timeslot, class, subject, type, canceled, lastEdited) VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :type, :canceled, :lastEdited)";

        return $this->write($query, $lessonData);
    }

    public function cancel($lessonData)
    {
        $lessonData = $this->preprocessDataToWrite($lessonData);
        $query = "UPDATE $this->tableName SET canceled = 'true' WHERE userId=:userId AND itemId = :itemId";

        return $this->write($query, $lessonData);
    }

    public function uncancel($lessonData)
    {
        $lessonData = $this->preprocessDataToWrite($lessonData);
        $query = "UPDATE $this->tableName SET canceled = 'false' WHERE userId=:userId AND itemId = :itemId";

        return $this->write($query, $lessonData);
    }

    public function deleteLessonById($lessonId)
    {
        global $user;

        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId";

        return $this->delete($query, ['userId' => $user->getId(), 'itemId' => $lessonId]);
    }

    public function syncTimetableChanges($timetableChanges)
    {
        $timetableChanges = $this->preprocessDataToWrite($timetableChanges);
        $results = [];

        $query = "
            INSERT INTO $this->tableName (userId, itemId, date, timeslot, class, subject, type, canceled, lastEdited)
            VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :type, :canceled, :lastEdited)
            ON DUPLICATE KEY UPDATE
                date = IF (VALUES(lastEdited) > lastEdited, VALUES(date), date),
                timeslot = IF (VALUES(lastEdited) > lastEdited, VALUES(timeslot), timeslot),
                class = IF (VALUES(lastEdited) > lastEdited, VALUES(class), class),
                subject = IF (VALUES(lastEdited) > lastEdited, VALUES(subject), subject),
                type = IF (VALUES(lastEdited) > lastEdited, VALUES(type), type),
                canceled = IF (VALUES(lastEdited) > lastEdited, VALUES(canceled), canceled),
                lastEdited = IF (VALUES(lastEdited) > lastEdited, VALUES(lastEdited), lastEdited)
            ";

        foreach ($timetableChanges as $lesson) {
            $result = $this->write($query, $lesson);
            $result['id'] = $lesson['itemId'];
            array_push($results, $result);
        }

        return $results;
    }
}
