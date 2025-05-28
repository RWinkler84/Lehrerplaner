<?php

namespace Controller;

use Model\Settings;

class SettingsController extends AbstractController
{

    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new Settings;
    }

    public function saveSubject()
    {
        $subjectData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->saveSubject($subjectData);

        echo json_encode($result);
    }

    public function deleteSubject()
    {
        $subjectIds = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->deleteSubject($subjectIds);

        echo json_encode($result);
    }

    public function saveTimetable()
    {
        $timetableData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->saveTimetable($timetableData);

        echo json_encode($result);
    }

    public function updateValidUntil(){
        $dates = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->updateValidUntil($dates);

        echo json_encode($result);
    }

    public function saveTimetableChanges()
    {
        $timetableData = json_decode(file_get_contents('php://input'), true);

        error_log(print_r($timetableData,true));

        $result = $this->model->saveTimetableChanges($timetableData);

        echo json_encode($result);
    }

    public static function syncSettingsData($subjectsData, $timetableData) {
        $model = new Settings;
        
        if (!empty($subjectsData)) $model->syncSubjects($subjectsData);
        if (!empty($timetableData)) $model->syncTimetable($timetableData);
    }
}
