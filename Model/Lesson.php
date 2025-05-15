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
        $query = "INSERT INTO $this->tableName (userId, itemId, date, timeslot, class, subject, type, canceled) VALUES (:userId, :itemId, :date, :timeslot, :class, :subject, :type, :canceled)";

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
}
