<?php 
namespace Controller;

use Controller\AbstractController;
use Model\GlobalNoteFolder;

class GlobalNoteFolderController extends AbstractController {
    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new GlobalNoteFolder;
    }

    public function save()
    {
        $globalNoteFoldersArray = json_decode(file_get_contents('php://input'), true);
        $finalResult = ['status' => 'success'];

        foreach ($globalNoteFoldersArray as $globalNoteFolder) {
            $result = $this->model->save($globalNoteFolder);

            if ($result['status'] == 'failed') $finalResult = $result;
        }

        echo json_encode($finalResult);
    }

    public function update()
    {
        $globalNoteFoldersArray = json_decode(file_get_contents('php://input'), true);
        $finalResult = ['status' => 'success'];

        foreach ($globalNoteFoldersArray as $globalNoteFolder) {
            $result = $this->model->update($globalNoteFolder);

            if ($result['status'] == 'failed') $finalResult = $result;
        }

        echo json_encode($finalResult);
    }

    public function delete()
    {
        $globalNoteFoldersArray = json_decode(file_get_contents('php://input'), true);
        $finalResult = ['status' => 'success'];

        foreach ($globalNoteFoldersArray as $globalNoteFolder) {
            $result = $this->model->deleteGlobalNoteFolder($globalNoteFolder);

            if ($result['status'] == 'failed') $finalResult = $result;
        }

        echo json_encode($finalResult);
    }

    public static function syncGlobalNoteFolders($globalNoteFolders, $deletedGlobalNoteFolders)
    {
        $result = [];
        $model = new GlobalNoteFolder;

        $result = $model->syncGlobalNoteFolders($globalNoteFolders, $deletedGlobalNoteFolders);

        return $result;
    }
}