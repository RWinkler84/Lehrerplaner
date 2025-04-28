<?php

namespace Model;

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
        $query = "SELECT * FROM $this->tableName WHERE username=:username";

        $result = $this->read($query, ['username' => $loginData['username']]);

        if (empty($result)) {
            return ['message' => 'Wrong username or password!'];
            exit();
        }

        if (password_verify($loginData['password'], $result[0]['password'])) {
            $_SESSION['isLoggedIn'] = true;
            $_SESSION['userId'] = $result[0]['id'];

            return ['message' => 'Successfully logged in'];
        } else {
            return ['message' => 'Wrong username or password!'];
        }
    }

    public function getId()
    {
        return $this->userId;
    }
}
