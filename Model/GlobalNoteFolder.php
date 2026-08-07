<?php 
namespace Model;

use DateTime;
use Model\AbstractModel;

class GlobalNoteFolder extends AbstractModel {
private $tableName  = TABLEPREFIX . 'globalNoteFolders';

    public function save($globalNoteFolder)
    {
        $globalNoteFolder = $this->preprocessDataToWrite($globalNoteFolder);
        $query = "
            INSERT INTO $this->tableName (userId, itemId, name, parentFolderId, created, lastEdited)
            VALUES (:userId, :itemId, :name, :parentFolderId, :created, :lastEdited)
            ";

        $result = $this->write($query, $globalNoteFolder);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($globalNoteFolder['lastEdited']));

        return $result;
    }

    public function update($globalNoteFolder)
    {
        $globalNoteFolder = $this->preprocessDataToWrite($globalNoteFolder);
        $query = "
            UPDATE $this->tableName SET name = :name, parentFolderId = :parentFolderId, lastEdited = :lastEdited 
            WHERE userId = :userId AND itemId = :itemId AND created = :created
            ";

        $result = $this->write($query, $globalNoteFolder);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($globalNoteFolder['lastEdited']));

        return $result;
    }

    public function deleteGlobalNoteFolder($globalNoteFolder)
    {
        $globalNoteFolder = $this->preprocessDataToWrite($globalNoteFolder);
        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $params = [
            'userId' => $globalNoteFolder['userId'],
            'itemId' => $globalNoteFolder['itemId'],
            'created' => $globalNoteFolder['created']
        ];

        $result = $this->delete($query, $params);
        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($globalNoteFolder['lastEdited']));

        return $result;
    }

    public function syncGlobalNoteFolders($foldersToSync, $foldersToDelete)
    {
        global $user;
        $finalResult = ['status' => 'success'];

        if (!empty($foldersToDelete)) {
            foreach ($foldersToDelete as $folder) {
                $result = $this->deleteGlobalNoteFolder($folder);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }
        }

        if (!empty($foldersToSync)) $foldersToSync = $this->preprocessDataToWrite($foldersToSync);

        $storedFolders = $this->read("SELECT * FROM $this->tableName WHERE userId = :userId", ['userId' => $user->getId()]);
        $storedFoldersLookup = [];

        foreach ($storedFolders as $folder) {
            $storedFoldersLookup[$folder['itemId']] = $folder;
        }

        foreach ($foldersToSync as $folderToSync) {
            $query = '';
            $matchingFolder = $storedFoldersLookup[$folderToSync['itemId']] ?? null;

            if (is_null($matchingFolder)) {
                $result = $this->save($folderToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }

            if (!is_null($matchingFolder)) {
                if ($folderToSync['created'] == $matchingFolder['created'] && $folderToSync['lastEdited'] > $matchingFolder['lastEdited']) {
                    $query = "
                        UPDATE $this->tableName SET name = :name, parentFolderId = :parentFolderId, lastEdited = :lastEdited 
                        WHERE userId = :userId AND itemId = :itemId AND created = :created
                    ";
                }

                //duplicate Ids
                if ($folderToSync['created'] != $matchingFolder['created']) {
                    $newId = max(array_column($storedFolders, 'itemId')) + 1;
                    $folderToSync['itemId'] = $newId;
                    $storedFolders[] = $folderToSync;

                    $query = "
                                INSERT INTO $this->tableName (userId, itemId, name, parentFolderId, created, lastEdited)
                                VALUES (:userId, :itemId, :name, :parentFolderId, :created, :lastEdited)
                            ";
                }
            }

            if ($query != '') {
                $result = $this->write($query, $folderToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }

                if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($folderToSync['lastEdited']));
            }
        }

        return $finalResult;
    }
}