<?php

namespace Controller;

use Model\User;

class UserController extends AbstractController
{

    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new User;
    }

    public function login()
    {

        $loginData = json_decode(file_get_contents('php://input'), true);

        if (isset($loginData['userEmail']) && isset($loginData['password'])) {
            $response = $this->model->login($loginData);

            http_response_code(200);
            echo json_encode($response);
            exit();
        }

        http_response_code(400);
        echo json_encode(['message' => 'Wrong username or password']);
    }

    public function createAccount()
    {
        $accountData = json_decode(file_get_contents('php://input'), true);

        if (
            $this->validateEmail($accountData['userEmail']) &&
            $this->validatePassword($accountData['password']) &&
            $this->validatePassword($accountData['passwordRepeat']) &&
            $accountData['password'] === $accountData['passwordRepeat']
        ) {
            $result = $this->model->createAccount($accountData);

            http_response_code(200);
            echo json_encode($result);
            exit();
        }

        http_response_code(400);
        echo json_encode(['message' => 'Da ist etwas schief gelaufen.']);
    }

    public function resetPassword()
    {
        $passwordData = json_decode(file_get_contents('php://input'), true);

        if (
            $this->validatePassword($passwordData['newPassword']) &&
            $this->validatePassword($passwordData['newPasswordRepeat']) &&
            $passwordData['newPassword'] === $passwordData['newPasswordRepeat']
        ) {
            $result = $this->model->resetPassword($passwordData);

            http_response_code(200);
            echo json_encode($result);
            exit();
        }

        http_response_code(400);
        echo json_encode([
            'message' => 'Da ist etwas schief gelaufen.',
            'status' => 'failed'
            ]);
    }


    public function authenticateMail()
    {
        $updated = $this->model->authenticateMail($_GET['i'], $_GET['t']);

        if ($updated) {
            header('Location:' . ROOTURL . '?auth=success');
            exit();
        }

        header('Location:' . ROOTURL . '?auth=failed');
    }

    public function resendAuthMail()
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $mailSend = $this->model->resendAuthMail($data);

        if ($mailSend) {
            echo json_encode([
                'message' => 'Die Mail wurde erneut geschickt. Sollte sie sich nicht im Posteingang befinden, kontrolliere bitte deinen Spam-Ordner.',
                'status' => 'success'
            ]);
            exit();
        }
        echo json_encode([
            'message' => 'Beim Mail-Versand ist etwas schief gelaufen. Bitte versuche es später noch einmal.',
            'status' => 'failed'
        ]);
    }

    public function sendPasswortResetMail()
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $mailSend = $this->model->sendPasswortResetMail($data);

        if ($mailSend) {
            echo json_encode([
                'message' => 'Die Reset-Mail wurde geschickt. Sollte sie sich nicht im Posteingang befinden, kontrolliere bitte deinen Spam-Ordner.',
                'status' => 'success'
            ]);
            exit();
        }
        echo json_encode([
            'message' => 'Beim Mail-Versand ist etwas schief gelaufen. Bitte versuche es später noch einmal.',
            'status' => 'failed'
        ]);
    }

    private function validatePassword($password)
    {
        $regEx = '/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/';
        return preg_match($regEx, $password);
    }

    private function validateEmail($email)
    {
        $regEx = '/^[^@]+@[^@]+\.[^@]+$/';
        return preg_match($regEx, $email);
    }
}
