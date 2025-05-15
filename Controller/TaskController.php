<?php 

namespace Controller;

use Controller\AbstractController;
use Model\Task;

class TaskController extends AbstractController {

    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new Task;
    }

    public function save(){
        $taskData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->save($taskData);

        echo json_encode($result);
    }

    public function update(){
        $taskData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->update($taskData);

        echo json_encode($result);
    }

    public function updateDate(){
        $taskData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->updateDate($taskData);

        echo json_encode($result);
    }

    public function setInProgress() {
        $taskId = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->setInProgress($taskId);

        echo json_encode($result);
    }

    public function setDone() {
        $taskId = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->setDone($taskId);

        echo json_encode($result);
    }
}