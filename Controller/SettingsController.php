<?php 

namespace Controller;
use Model\Settings;

class SettingsController extends AbstractController{

    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new Settings;
    }

    public function saveSubject(){
        $subjectData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->saveSubject($subjectData);

        echo json_encode($result);
    }

    public function deleteSubject(){
        $subjectId = json_decode(file_get_contents('php://input'), true);

        error_log(print_r($subjectId, true));
        $this->model->deleteSubject($subjectId);
    }

}