<?php

namespace Model;

use DateTime;
use Model\AbstractModel;

class Lesson extends AbstractModel
{

    public function save($lessonData)
    {
        $query = 'INSERT INTO timetableChanges (id, date, timeslot, class, subject, status, initialStatus) VALUES (:id, :date, :timeslot, :class, :subject, :status, :initialStatus)';

        return $this->write($query, $lessonData);
    }

    public function uncancel($lessonData) {

        $query = 'DELETE FROM timetableChanges WHERE id=:id';

        return $this->delete($query, $lessonData);
    }
}
