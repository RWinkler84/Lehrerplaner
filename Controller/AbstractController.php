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
        SettingsController::syncSettingsData($dataToSync['subjects'], $dataToSync['timetable']);

        $result = ['message' => 'function in arbeit'];
        echo json_encode($result);
    }
}