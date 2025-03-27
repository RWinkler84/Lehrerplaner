<?php 

namespace Controller;

use Model\AbstractModel;

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
}