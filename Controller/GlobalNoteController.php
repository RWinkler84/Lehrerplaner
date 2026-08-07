<?php

namespace Controller;

use Controller\AbstractController;
use Model\GlobalNote;

class GlobalNoteController extends AbstractController
{
    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new GlobalNote;
    }

    public function save()
    {
        $globalNotesArray = json_decode(file_get_contents('php://input'), true);
        $finalResult = ['status' => 'success'];

        foreach ($globalNotesArray as $globalNote) {
            $result = $this->model->save($globalNote);

            if ($result['status'] == 'failed') $finalResult = $result;
        }

        echo json_encode($finalResult);
    }

    public function update()
    {
        $globalNotesArray = json_decode(file_get_contents('php://input'), true);
        $finalResult = ['status' => 'success'];

        foreach ($globalNotesArray as $globalNote) {
            $result = $this->model->update($globalNote);

            if ($result['status'] == 'failed') $finalResult = $result;
        }

        echo json_encode($finalResult);
    }

    public function delete()
    {
        $globalNoteArray = json_decode(file_get_contents('php://input'), true);
        $finalResult = ['status' => 'success'];

        foreach ($globalNoteArray as $globalNote) {
            $result = $this->model->deleteGlobalNote($globalNote);

            if ($result['status'] == 'failed') $finalResult = $result;
        }

        echo json_encode($finalResult);
    }

    public static function syncGlobalNotes($globalNotes, $deletedGlobalNotes)
    {
        $result = [];
        $model = new GlobalNote;

        $result = $model->syncGlobalNotes($globalNotes, $deletedGlobalNotes);

        return $result;
    }
}
