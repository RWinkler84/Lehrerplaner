<?php

namespace Controller;

use Controller\AbstractController;
use Model\AbstractModel;
use Model\LessonNote;

class LessonNoteController extends AbstractController
{
    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new LessonNote;
    }

    public function save()
    {
        $lessonNote = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->save($lessonNote);

        echo json_encode($result);
    }

    public function update()
    {
        $lessonNote = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->update($lessonNote);

        echo json_encode($result);
    }

    public function delete()
    {
        $lessonNote = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->deleteLessonNote($lessonNote);

        echo json_encode($result);
    }

    public static function syncLessonNotes($lessonNotes, $deletedLessonNotes)
    {
        $result = [];
        $model = new LessonNote;

        $result = $model->syncLessonNotes($lessonNotes, $deletedLessonNotes);

        return $result;
    }
}
