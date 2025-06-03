<?php 

namespace Controller;

use Model\AbstractModel;
use Controller\LessonController;
use Controller\SettingsController;
use Controller\TaskController;

class AbstractController {

    private $db;

    public function __construct() {
        $this->db = new AbstractModel();
    }

    public function getSubjects() {
        $result = $this->db->getSubjects();

        echo json_encode($result);
    }

    public function getTimetable() {
        $result = $this->db->getTimetable();

        echo json_encode($result);
    }

    public function getTimetableChanges() {
        $result = $this->db->getTimetableChanges();

        echo json_encode($result);
    }

    public function getAllTasks() {
        $result = $this->db->getAllTasks();

        echo json_encode($result);
    }

    public function syncDatabase(){
        $dataToSync = json_decode(file_get_contents('php://input'), true);

        error_log(print_r($dataToSync, true));

        $subjectsResults = SettingsController::syncSubjects($dataToSync['subjects']);
        $timetableResults = SettingsController::syncTimetable($dataToSync['timetable']);
        $lessonResults = LessonController::syncTimetableChanges($dataToSync['timetableChanges']);
        $taskResults = TaskController::syncTasks($dataToSync['tasks']);

        $result = [
            'subjects' => $subjectsResults,
            'timetable' => $timetableResults,
            'lessons' => $lessonResults,
            'tasks' => $taskResults,
            ];

        error_log(print_r($result, true));

        
        echo json_encode($result);
    }
}