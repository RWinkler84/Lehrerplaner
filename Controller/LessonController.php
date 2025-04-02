<?php

namespace Controller;

use Controller\AbstractController;
use Model\Lesson;

class LessonController extends AbstractController
{

    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new Lesson;
    }

    public function save()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);
   
        error_log('speichere: ' . print_r($lessonData, true));

        $result = $this->model->save($lessonData);

        echo json_encode($result);
    }

    public function update()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);

        error_log('update: ' . print_r($lessonData, true));

        $result = $this->model->update($lessonData);

        echo json_encode($result);
    }

    public function cancel()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);

        error_log('cancle: ' . print_r($lessonData, true));


        $result = $this->model->update($lessonData);

        echo json_encode($result);
    }

    public function uncancel()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->update($lessonData);

        echo json_encode($result);
    }

    public function delete() {}
}
