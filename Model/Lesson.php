<?php

namespace Model;

use DateTime;
use Model\AbstractModel;

class Lesson extends AbstractModel
{
    private $tableName = TABLEPREFIX . 'timetableChanges';

    public function save($lessonData)
    {
        $query = "INSERT INTO $this->tableName (id, date, timeslot, class, subject, type, canceled) VALUES (:id, :date, :timeslot, :class, :subject, :type, :canceled)";

        return $this->write($query, $lessonData);
    }

    public function cancel($lessonData)
    {
        $query = "UPDATE $this->tableName SET canceled = 'true' WHERE id=:id";

        return $this->write($query, $lessonData);
    }

    public function uncancel($lessonData)
    {

        $query = "UPDATE $this->tableName SET canceled = 'false' WHERE id=:id";

        return $this->write($query, $lessonData);
    }
}
