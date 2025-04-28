<?php 

namespace Controller;
use Model\User;

class UserController extends AbstractController {
    
    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new User;
    }

    public function login() {

        $loginData = json_decode(file_get_contents('php://input'),true);

        if (isset($loginData['username']) && isset($loginData['password'])){
            $response = $this->model->login($loginData);

            http_response_code(200);
            echo json_encode($response);
            exit();
        }

        http_response_code(400);
        echo json_encode(['message' => 'Wrong username or password']);

    }
}