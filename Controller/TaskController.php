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
        error_log(file_get_contents('php://input'));


        $result = $this->model->save($taskData);
        error_log(print_r($taskData, true));

        return $result;

    }
}