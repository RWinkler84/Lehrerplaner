<?php

namespace Controller;

use Controller\AbstractController;
use Model\DayNote;

class DayNoteController extends AbstractController
{
    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new DayNote;
    }

    public function save()
    {
        $dayNote = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->save($dayNote);

        echo json_encode($result);
    }

    public function update()
    {
        $dayNote = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->update($dayNote);

        echo json_encode($result);
    }

    public function delete()
    {
        $dayNote = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->deleteDayNote($dayNote);

        echo json_encode($result);
    }

    public static function syncDayNotes($dayNotes, $deletedDayNotes)
    {
        $result = [];
        $model = new DayNote;

        $result = $model->syncDayNotes($dayNotes, $deletedDayNotes);

        return $result;
    }
}
