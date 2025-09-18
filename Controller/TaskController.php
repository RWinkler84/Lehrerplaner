<?php

namespace Controller;

use Controller\AbstractController;
use Model\Task;

class TaskController extends AbstractController
{

    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new Task;
    }

    public function save()
    {
        $taskData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->save($taskData);

        echo json_encode($result);
    }

    public function update()
    {
        error_log('ich update jetzt');
        $taskData = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->update($taskData);

        echo json_encode($result);
    }

    public function delete()
    {
        $taskData = json_decode(file_get_contents('php://input'), true);
        $finalResult = ['status' => 'success'];

        foreach ($taskData as $task) {
            $result = $this->model->deleteTask($task);
            if ($result['status'] == 'failed') $finalResult = ['status' => 'failed'];
        }

        echo json_encode($finalResult);
    }

    public static function syncTasks($tasksToSync, $tasksToDelete)
    {
        $result = [];
        $model = new Task;

        $result = $model->syncTasks($tasksToSync, $tasksToDelete);

        return $result;
    }

    public function deleteTasks()
    {
        $tasks = json_decode(file_get_contents('php://input'));

    }
}
