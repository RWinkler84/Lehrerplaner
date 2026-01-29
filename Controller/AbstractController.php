<?php

namespace Controller;

use Model\AbstractModel;
use Controller\LessonController;
use Controller\SettingsController;
use Controller\TaskController;

class AbstractController
{

    private $db;

    public function __construct()
    {
        $this->db = new AbstractModel();
    }

    public function getSubjects()
    {
        $result = $this->db->getSubjects();

        echo json_encode($result);
    }

    public function getTimetable()
    {
        $result = $this->db->getTimetable();

        echo json_encode($result);
    }

    public function getTimetableChanges()
    {
        $result = $this->db->getTimetableChanges();

        echo json_encode($result);
    }

    public function getAllTasks()
    {
        $result = $this->db->getAllTasks();

        echo json_encode($result);
    }

    public function getAllLessonNotes() {
        $result = $this->db->getAllLessonNotes();

        echo json_encode($result);
    }

    public function getAllSchoolYears() {
        $result = $this->db->getAllSchoolYears();

        echo json_encode($result);
    }

    public function setDbUpdateTimestamp($updatedTableName, $dateTime)
    {
        $this->db->setDbUpdateTimestamp($updatedTableName, $dateTime);
    }

    public function getDbUpdateTimestamps()
    {
        $result = $this->db->getDbUpdateTimestamps();

        echo json_encode($result);
    }

    public function syncDatabase()
    {
        $dataToSync = json_decode(file_get_contents('php://input'), true);
        $subjectsResults = [];
        $timetableResults = [];
        $timetableChangesResults = [];
        $taskResults = [];
        $lessonNotesResults = [];
        $schoolYearResults = [];

        if (!empty($dataToSync['subjects']) || !empty($dataToSync['deletedSubjects'])) {
            $subjectsResults = SettingsController::syncSubjects($dataToSync['subjects'], $dataToSync['deletedSubjects']);
        }

        if (!empty($dataToSync['timetable'])) {
            $timetableResults = SettingsController::syncTimetable($dataToSync['timetable']);
        }

        if (!empty($dataToSync['timetableChanges']) || !empty($dataToSync['deletedTimetableChanges'])) {
            $timetableChangesResults = LessonController::syncTimetableChanges($dataToSync['timetableChanges'], $dataToSync['deletedTimetableChanges']);
        }

        if (!empty($dataToSync['tasks']) || !empty($dataToSync['deletedTasks'])) {
            $taskResults = TaskController::syncTasks($dataToSync['tasks'], $dataToSync['deletedTasks']);
        }

        if (!empty($dataToSync['lessonNotes']) || !empty($dataToSync['deletedLessonNotes'])) {
            $lessonNotesResults = LessonNoteController::syncLessonNotes($dataToSync['lessonNotes'], $dataToSync['deletedLessonNotes']);
        }

        if (!empty($dataToSync['schoolYears']) || !empty($dataToSync['deletedSchoolYears'])) {
            $schoolYearResults = SchoolYearController::syncSchoolYears($dataToSync['schoolYears'], $dataToSync['deletedSchoolYears']);
        }

        $result = [
            'subjects' => $subjectsResults,
            'timetable' => $timetableResults,
            'timetableChanges' => $timetableChangesResults,
            'tasks' => $taskResults,
            'lessonNotes' => $lessonNotesResults,
            'schoolYears' => $schoolYearResults
        ];

        echo json_encode($result);
    }

    public function getUserInfo()
    {
        global $user;
        $status = $user->getUserInfo();

        if (is_null($user)) {
            echo json_encode(['loggedIn' => 'false']);
            exit;
        }

        $status['loggedIn'] = 'true';

        echo json_encode($status);
    }

    public function sendSupportTicket() {
        $ticketData = json_decode(file_get_contents('php://input'), true);
        $result = $this->db->sendSupportTicket($ticketData);

        echo json_encode($result);
    }
}
