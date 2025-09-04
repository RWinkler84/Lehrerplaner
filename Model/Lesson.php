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

        error_log(print_r($lessonData, true));
        $query = "INSERT INTO $this->tableName (userId, itemId, date, weekday, timeslot, class, subject, type, canceled, lastEdited) VALUES (:userId, :itemId, :date, :weekday, :timeslot, :class, :subject, :type, :canceled, :lastEdited)";

        $result = $this->write($query, $lessonData);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonData['lastEdited']));

        return $result;
    }

    public function cancel($lessonData)
    {

        $lessonData = $this->preprocessDataToWrite($lessonData);
        $query = "UPDATE $this->tableName SET canceled = 'true', lastEdited = :lastEdited WHERE userId=:userId AND itemId = :itemId";

        $result = $this->write($query, $lessonData);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonData['lastEdited']));

        return $result;
    }

    public function uncancel($lessonData)
    {
        $lessonData = $this->preprocessDataToWrite($lessonData);
        $query = "UPDATE $this->tableName SET canceled = 'false', lastEdited = :lastEdited WHERE userId=:userId AND itemId = :itemId";

        $result = $this->write($query, $lessonData);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonData['lastEdited']));

        return $result;
    }

    public function deleteLesson($lesson)
    {
        global $user;

        if (is_null($user)) {
            echo json_encode(['status' => 'failed', 'message' => 'User not logged in!']);
            exit;
        }

        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId";

        $result = $this->delete($query, ['userId' => $user->getId(), 'itemId' => $lesson['id']]);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lesson['lastEdited']));

        return $result;
    }

    public function syncTimetableChanges($timetableChanges)
    {
        $timetableChanges = $this->preprocessDataToWrite($timetableChanges);
        $finalResult = ['status' => 'success'];

        $query = "
            INSERT INTO $this->tableName (userId, itemId, date, timeslot, class, weekday, subject, type, canceled, lastEdited)
            VALUES (:userId, :itemId, :date, :timeslot, :class, :weekday, :subject, :type, :canceled, :lastEdited)
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

            if ($result['status'] == 'failed') $finalResult = ['status' => 'failed'];
            if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lesson['lastEdited']));
        }

        return $finalResult;
    }
}
