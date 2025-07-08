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
        $taskData = json_decode(file_get_contents('php://input'), true);

        error_log(print_r($taskData, true));

        $result = $this->model->update($taskData);

        echo json_encode($result);
    }

    public function delete()
    {
        $taskData = json_decode(file_get_contents('php://input'), true);
        $results = [];

        foreach ($taskData as $task) {
            $result = $this->model->deleteTaskById($task['id']);

            $result['id'] = $task['id'];
            array_push($results, $result);
        }

        echo json_encode($results);
    }

    public function setInProgress()
    {
        $taskId = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->setInProgress($taskId);

        echo json_encode($result);
    }

    public function setDone()
    {
        $taskId = json_decode(file_get_contents('php://input'), true);

        $result = $this->model->setDone($taskId);

        echo json_encode($result);
    }

    public static function syncTasks($tasks)
    {
        $result = [];
        $model = new Task;

        if (!empty($tasks)) $result = $model->syncTasks($tasks);

        return $result;
    }

    public function deleteTasks()
    {
        $tasks = json_decode(file_get_contents('php://input'));

        error_log(print_r($tasks, true));
    }
}
