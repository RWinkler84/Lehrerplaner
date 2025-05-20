<?php

namespace Model;

use Error;
use Model\AbstractModel;

class User extends AbstractModel
{

    private $userId;
    private $username;
    private $tableName = TABLEPREFIX . 'users';


    public function __construct($id = null)
    {
        $this->userId = $id;
    }


    public function login($loginData)
    {
        $query = "SELECT * FROM $this->tableName WHERE userEmail=:userEmail";

        $result = $this->read($query, ['userEmail' => $loginData['userEmail']]);

        if (empty($result)) {
            return ['message' => 'Wrong username or password!'];
            exit();
        }

        if (password_verify($loginData['password'], $result[0]['password'])) {
            $_SESSION['isLoggedIn'] = true;
            $_SESSION['userId'] = $result[0]['id'];

            return ['message' => 'Successfully logged in'];
        } else {
            return ['message' => 'Login fehlgeschlagen. E-Mail oder Password ist falsch.'];
        }
    }

    public function createAccount($accountData)
    {
        if ($this->userExists($accountData)) {
            return ['message' => 'Die angegebene E-Mail-Adresse wird bereits verwendet.'];
        }

        $query = "INSERT INTO $this->tableName (userEmail, emailConfirmed, password) VALUES (:userEmail, :emailConfirmed, :password)";
        $accountData['password'] = password_hash($accountData['password'], PASSWORD_DEFAULT);
        unset($accountData['passwordRepeat']);
        $accountData['emailConfirmed'] = 0;
        
        // $result = $this->write($query, $accountData);
        $result['message'] = 'Data saved sucessfully';

        if ($result['message'] == 'Data saved sucessfully') {
            $mailsend = mail($accountData['userEmail'], 'Dein Account beim Lehrerplaner wartet auf Aktivierung', 'Du hast einen Account bei Lehrerplaner angelegt. Um ihn nutzen zu können, musst du deine E-Mail-Adresse bestätigen.');
            if ($mailsend) {error_log('geschickt? ' . $mailsend);} else {error_log('ging nicht raus');}
            
            return ['message' => 'Confirmation email send'];
        }

        return ['message' => 'Etwas ist schief gelaufen...'];
    }

    private function userExists($newUserData)
    {
        $allUsers = $this->getAllUsers();

        foreach ($allUsers as $existingUser) {
            if ($existingUser['userEmail'] == $newUserData['userEmail']) {
                return true;
            }
        }

        return false;
    }

    public function getId()
    {
        return $this->userId;
    }

    private function getAllUsers()
    {
        $params = [];
        $query = "SELECT * FROM $this->tableName";

        return $this->read($query, $params);
    }
}
