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

        $result = $this->model->save($lessonData);

        echo json_encode($result);
    }

    public function update()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->save($lessonData);

        echo json_encode($result);
    }

    //this function adds regular lessons to the timetablechanges, whilst subistute lessons that are canceled only get updated via cancel()
    public function addcanceled()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->save($lessonData);

        echo json_encode($result);
    }

    public function cancel()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->cancel($lessonData);

        echo json_encode($result);
    }

    public function uncancel()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->uncancel($lessonData);

        echo json_encode($result);
    }

    public function delete()
    {
        $lessonData = json_decode(file_get_contents('php://input'), true);
        $finalResult = ['status' => 'success'];

        foreach ($lessonData as $lesson) {
            $result = $this->model->deleteLesson($lesson);
            if ($result['status'] == 'failed') $finalResult['status'] = 'failed';
            }

        echo json_encode($finalResult);
    }

    public static function syncTimetableChanges($timetableChanges, $deletedTimetableChanges)
    {
        $result = [];
        $model = new Lesson;

        $result = $model->syncTimetableChanges($timetableChanges, $deletedTimetableChanges);

        return $result;
    }
}
