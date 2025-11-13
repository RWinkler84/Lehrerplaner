<?php

namespace Model;

use Model\AbstractModel;
use DateTime;

class LessonNote extends AbstractModel
{
    private $tableName = TABLEPREFIX . 'lessonNotes';

    public function save($lessonNote)
    {
        $lessonNote = $this->preprocessDataToWrite($lessonNote);
        $query = "
            INSERT INTO $this->tableName (userId, itemId, date, weekday, timeslot, class, subject, content, created, lastEdited)
            VALUES (:userId, :itemId, :date, :weekday, :timeslot, :class, :subject, :content, :created, :lastEdited)
            ";

        $result = $this->write($query, $lessonNote);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonNote['lastEdited']));

        return $result;
    }

    public function update($lessonNote)
    {
        $lessonNote = $this->preprocessDataToWrite($lessonNote);
        $query = "
            UPDATE $this->tableName SET date = :date, weekday = :weekday, timeslot = :timeslot, class = :class, subject = :subject, content = :content, lastEdited = :lastEdited 
            WHERE userId = :userId AND itemId = :itemId AND created = :created
            ";

        $result = $this->write($query, $lessonNote);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonNote['lastEdited']));

        return $result;
    }

    public function deleteLessonNote($lessonNote) {
        $lessonNote = $this->preprocessDataToWrite($lessonNote);
        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $params = [
            'userId' => $lessonNote['userId'],
            'itemId' => $lessonNote['itemId'],
            'created' => $lessonNote['created']
        ];

        $result = $this->delete($query, $params);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($lessonNote['lastEdited']));
        
        return $result;
    }
}
