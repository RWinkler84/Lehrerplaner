<?php

namespace Model;

use DateTime;
use Model\AbstractModel;

class Lesson extends AbstractModel
{


    public function save($lessonData)
    {
        $query = 'INSERT INTO timetableChanges (date, timeslot, class, subject, status, initialStatus) VALUES (:date, :timeslot, :class, :subject, :status, :initialStatus)';

        return $this->write($query, $lessonData);
    }

    public function update($lessonData)
    {
        error_log(print_r($lessonData, true));

        $lessonDate = new DateTime($lessonData['date']);
        $allTimetableChanges = $this->getTimetableChanges();

        if (count($allTimetableChanges) != 0) {

            foreach ($allTimetableChanges as $change) {

                $changeDate = new DateTime($change['date']);

                if (
                    $changeDate->format('Y-m-d') == $lessonDate->format('Y-m-d') &&
                    $change['timeslot'] == $lessonData['timeslot']
                ) {
                    $query = 'UPDATE timetableChanges SET date = :date, timeslot = :timeslot, class = :class, subject = :subject, status = :status, initialStatus = :initialStatus WHERE id=:id';

                    $params = $lessonData;
                    $params['id'] = $change['id'];

                    return $this->write($query, $params);

                } else {

                    return $this->save($lessonData);
                }
            }
        }

        return $this->save($lessonData);
    }
}
