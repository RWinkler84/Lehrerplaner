<?php

namespace Model;

use DateTime;

class SchoolYear extends AbstractModel
{

    private $tableName = TABLEPREFIX . 'schoolYears';

    public function save($schoolYearData): array
    {
        $schoolYearData = $this->preprocessDataToWrite($schoolYearData);

        //prevent array to string conversion warning
        $schoolYearData['holidays'] = json_encode($schoolYearData['holidays']);
        $schoolYearData['grades'] = json_encode($schoolYearData['grades']);
        $schoolYearData['curricula'] = json_encode($schoolYearData['curricula']);

        $query = "INSERT INTO $this->tableName (userId, itemId, name, startDate, endDate, grades, holidays, curricula, created, lastEdited) VALUES (:userId, :itemId, :name, :startDate, :endDate, :grades, :holidays, :curricula, :created, :lastEdited)";

        $result = $this->write($query, $schoolYearData);

        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($schoolYearData['lastEdited']));

        return $result;
    }

    public function update($schoolYearData): array
    {
        $schoolYearData = $this->preprocessDataToWrite($schoolYearData);

        //prevent array to string conversion warning
        $schoolYearData['holidays'] = json_encode($schoolYearData['holidays']);
        $schoolYearData['grades'] = json_encode($schoolYearData['grades']);
        $schoolYearData['curricula'] = json_encode($schoolYearData['curricula']);

        $query = "UPDATE $this->tableName SET name = :name, startDate = :startDate, endDate = :endDate, grades = :grades, holidays = :holidays, curricula = :curricula, lastEdited = :lastEdited
            WHERE userId = :userId AND itemId = :itemId AND created = :created";

        $result = $this->write($query, $schoolYearData);

        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($schoolYearData['lastEdited']));

        return $result;
    }

    public function deleteSchoolYear($schoolYearData): array
    {
        $schoolYearData = $this->preprocessDataToWrite($schoolYearData);
        $query = "DELETE FROM $this->tableName WHERE userId = :userId AND itemId = :itemId AND created = :created";
        $params = [
            'userId' => $schoolYearData['userId'],
            'itemId' => $schoolYearData['itemId'],
            'created' => $schoolYearData['created']
        ];

        $result = $this->delete($query, $params);

        if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($schoolYearData['lastEdited']));

        return $result;
    }

    public function syncSchoolYears(array $yearsToSync, array $yearsToDelete): array
    {
        global $user;
        $finalResult = ['status' => 'success'];

        if (!empty($yearsToDelete)) {
            foreach ($yearsToDelete as $schoolYear) {
                $result = $this->deleteSchoolYear($schoolYear);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }
        }

        if (!empty($yearsToSync)) $yearsToSync = $this->preprocessDataToWrite($yearsToSync);

        $storedYears = $this->read("SELECT * FROM $this->tableName WHERE userId = :userId", ['userId' => $user->getId()]);
        $storedYearsLookup = [];

        foreach ($storedYears as $year) {
            $storedYearsLookup[$year['itemId']] = $year;
        }

        foreach ($yearsToSync as $yearToSync) {

            $query = '';
            $matchingYear = $storedYearsLookup[$yearToSync['itemId']] ?? null;

            if (is_null($matchingYear)) {
                $result = $this->save($yearToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }
            }

            if (!is_null($matchingYear)) {
                //prevent array to string conversion warning
                $yearToSync['holidays'] = json_encode($yearToSync['holidays']);
                $yearToSync['grades'] = json_encode($yearToSync['grades']);
                $yearToSync['curricula'] = json_encode($yearToSync['curricula']);

                if ($yearToSync['created'] == $matchingYear['created'] && $yearToSync['lastEdited'] > $matchingYear['lastEdited']) {
                    $query = "UPDATE $this->tableName SET name = :name, startDate = :startDate, endDate = :endDate, grades = :grades, holidays = :holidays, curricula = :curricula, lastEdited = :lastEdited
                        WHERE userId = :userId AND itemId = :itemId AND created = :created";
                }

                //duplicate Ids
                if ($yearToSync['created'] != $matchingYear['created']) {
                    $newId = max(array_column($storedYears, 'itemId')) + 1;
                    $yearToSync['itemId'] = $newId;
                    $storedNotes[] = $yearToSync;

                    $query = "INSERT INTO $this->tableName (userId, itemId, name, startDate, endDate, grades, holidays, curricula, created, lastEdited) VALUES (:userId, :itemId, :name, :startDate, :endDate, :grades, :holidays, :curricula, :created, :lastEdited)";
                }
            }

            if ($query != '') {
                $result = $this->write($query, $yearToSync);

                if ($result['status'] == 'failed') {
                    return [
                        'status' => 'failed',
                        'error' => $result['error']
                    ];
                }

                if ($result['status'] == 'success') $this->setDbUpdateTimestamp($this->tableName, new DateTime($yearToSync['lastEdited']));
            }
        }

        return $finalResult;
    }
}
