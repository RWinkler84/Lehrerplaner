<?php

namespace Model;

use Model\AbstractModel;
use DateTime;

class DayNote extends AbstractModel
{
    private $tableName = TABLEPREFIX . 'dayNotes';

    public function save($dayNote)
    {
        $dayNote = $this->preprocessDataToWrite($dayNote);
        $query = "
            INSERT INTO $this->tableName (userId, itemId, date, content, created, lastEdited)
            VALUES (:userId, :itemId, :date, :content, :created, :lastEdited)
            ";

        $result = $this->write($query, $dayNote);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($dayNote['lastEdited']));

        return $result;
    }

    public function update($dayNote)
    {
        $dayNote = $this->preprocessDataToWrite($dayNote);
        $query = "
            UPDATE $this->tableName SET date = :date, content = :content, lastEdited = :lastEdited 
            WHERE userId = :userId AND itemId = :itemId AND created = :created
            ";

        $result = $this->write($query, $dayNote);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($dayNote['lastEdited']));

        return $result;
    }

    public function deleteDayNote($dayNote)
    {
        $dayNote = $this->preprocessDataToWrite($dayNote);
        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $params = [
            'userId' => $dayNote['userId'],
            'itemId' => $dayNote['itemId'],
            'created' => $dayNote['created']
        ];

        $result = $this->delete($query, $params);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($dayNote['lastEdited']));

        return $result;
    }

    public function syncDayNotes($notesToSync, $notesToDelete)
    {
        global $user;
        $finalResult = ['status' => 'success'];

        if (!empty($notesToDelete)) {
            foreach ($notesToDelete as $note) {
                $result = $this->deleteDayNote($note);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }
        }

        if (!empty($notesToSync)) $notesToSync = $this->preprocessDataToWrite($notesToSync);

        $storedNotes = $this->read("SELECT * FROM $this->tableName WHERE userId = :userId", ['userId' => $user->getId()]);
        $storedNotesLookup = [];

        foreach ($storedNotes as $note) {
            $storedNotesLookup[$note['itemId']] = $note;
        }

        foreach ($notesToSync as $noteToSync) {
            $query = '';
            $matchingNote = $storedNotesLookup[$noteToSync['itemId']] ?? null;

            if (is_null($matchingNote)) {
                $result = $this->save($noteToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }

            if (!is_null($matchingNote)) {
                if ($noteToSync['created'] == $matchingNote['created'] && $noteToSync['lastEdited'] > $matchingNote['lastEdited']) {
                    $query = "
                        UPDATE $this->tableName SET date = :date, content = :content, lastEdited = :lastEdited 
                        WHERE userId = :userId AND itemId = :itemId AND created = :created
                    ";
                }

                //duplicate Ids
                if ($noteToSync['created'] != $matchingNote['created']) {
                    $newId = max(array_column($storedNotes, 'itemId')) + 1;
                    $noteToSync['itemId'] = $newId;
                    $storedNotes[] = $noteToSync;

                    $query = "
                                INSERT INTO $this->tableName (userId, itemId, date, content, created, lastEdited)
                                VALUES (:userId, :itemId, :date, :content, :created, :lastEdited)
                            ";
                }
            }

            if ($query != '') {
                $result = $this->write($query, $noteToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }

                if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($noteToSync['lastEdited']));
            }
        }

        return $finalResult;
    }
}
