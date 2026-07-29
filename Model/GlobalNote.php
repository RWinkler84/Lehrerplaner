<?php 
namespace Model;

use Model\AbstractModel;
use DateTime;

class GlobalNote extends AbstractModel {
private $tableName  = TABLEPREFIX . 'globalNotes';

    public function save($globalNote)
    {
        $globalNote = $this->preprocessDataToWrite($globalNote);
        $query = "
            INSERT INTO $this->tableName (userId, itemId, title, content, parentFolderId, created, lastEdited)
            VALUES (:userId, :itemId, :title, :content, :parentFolderId, :created, :lastEdited)
            ";

        $result = $this->write($query, $globalNote);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($globalNote['lastEdited']));

        return $result;
    }

    public function update($globalNote)
    {
        $globalNote = $this->preprocessDataToWrite($globalNote);
        $query = "
            UPDATE $this->tableName SET title = :title, content = :content, parentFolderId = :parentFolderId, lastEdited = :lastEdited 
            WHERE userId = :userId AND itemId = :itemId AND created = :created
            ";

        $result = $this->write($query, $globalNote);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($globalNote['lastEdited']));

        return $result;
    }

    public function deleteGlobalNote($globalNote)
    {
        $globalNote = $this->preprocessDataToWrite($globalNote);
        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $params = [
            'userId' => $globalNote['userId'],
            'itemId' => $globalNote['itemId'],
            'created' => $globalNote['created']
        ];

        $result = $this->delete($query, $params);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($globalNote['lastEdited']));

        return $result;
    }

    public function syncGlobalNotes($notesToSync, $notesToDelete)
    {
        global $user;
        $finalResult = ['status' => 'success'];

        if (!empty($notesToDelete)) {
            foreach ($notesToDelete as $note) {
                $result = $this->deleteGlobalNote($note);

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
                        UPDATE $this->tableName SET title = :title, content = :content, parentFolderId = :parentFolderId, lastEdited = :lastEdited 
                        WHERE userId = :userId AND itemId = :itemId AND created = :created
                    ";
                }

                //duplicate Ids
                if ($noteToSync['created'] != $matchingNote['created']) {
                    $newId = max(array_column($storedNotes, 'itemId')) + 1;
                    $noteToSync['itemId'] = $newId;
                    $storedNotes[] = $noteToSync;

                    $query = "
                                INSERT INTO $this->tableName (userId, itemId, title, content, parentFolderId, created, lastEdited)
                                VALUES (:userId, :itemId, :title, :content, :parentFolderId, :created, :lastEdited)
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