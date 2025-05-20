<?php

namespace Model;

use Error;
use Model\AbstractModel;

class User extends AbstractModel
{

    private $userId;
    private $email;

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
        $mailsend = false;

        if ($this->userExists($accountData)) {
            return ['message' => 'Die angegebene E-Mail-Adresse wird bereits verwendet.'];
        }

        $query = "INSERT INTO $this->tableName (userEmail, emailConfirmed, password) VALUES (:userEmail, :emailConfirmed, :password)";

        $accountData['password'] = password_hash($accountData['password'], PASSWORD_DEFAULT);
        $accountData['emailConfirmed'] = 0;
        unset($accountData['passwordRepeat']);

        $result = $this->write($query, $accountData);

        // $result['message'] = 'Data saved sucessfully';

        if ($result['message'] == 'Data saved sucessfully') {
            $user = $this->getUserByEmail($accountData['userEmail']);

            $mailConfirmationLink = $this->getMailConfirmationLink($user);
            $mailSubject = 'Dein Account beim Lehrerplaner wartet auf Aktivierung';
            $mailMessage = <<<MAIL
                <b>Fast geschafft!</b><br>
                <br>
                Du hast erfolgreich einen Account bei Lehrerplaner angelegt. Um ihn nutzen zu können, musst du deine E-Mail-Adresse bestätigen.
                Klicke dazu nachfolgenden Link: <br>
                <br>
                $mailConfirmationLink
            MAIL;

            $mailsend = $this->sendMail($accountData['userEmail'], $mailSubject, $mailMessage);
        }

        if ($mailsend) {
            return ['message' => 'Confirmation email send'];
        }

        return ['message' => 'Etwas ist schief gelaufen...'];
    }

    public function authenticateMail($userId, $emailHash)
    {
        $user = $this->getUserById($userId);

        if (password_verify($user->email, $emailHash)) {
            $query = "UPDATE $this->tableName SET emailConfirmed = 1 WHERE userEmail = :userEmail";
            
            $this->write($query, ['userEmail' => $user->getEmail()]);

            header('Location:' . ROOTURL);
        } else {
            error_log('UserId ' . $user->getId() . ': Authentifizierung der E-Mail ging daneben.');
        }
    }


    public function getId()
    {
        return $this->userId;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getAllUsers()
    {
        $params = [];
        $query = "SELECT * FROM $this->tableName";

        return $this->read($query, $params);
    }

    public function getUserById($id)
    {
        $query = "SELECT * FROM $this->tableName WHERE id = :id";
        $result = $this->read($query, ['id' => $id]);

        $user = new User($id);
        $user->email = $result[0]['userEmail'];

        return $user;
    }

    public function getUserByEmail($email)
    {
        $query = "SELECT * FROM $this->tableName WHERE userEmail = :email";
        $result = $this->read($query, ['email' => $email]);

        $user = new User($result[0]['id']);
        $user->email = $result[0]['userEmail'];

        return $user;
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

    private function getMailConfirmationLink($user)
    {
        $emailHash = password_hash($user->getEmail(), PASSWORD_DEFAULT);

        return ROOTURL . '?c=user&a=authenticateMail&i=' . $user->getId() . '&t=' . $emailHash;
    }
}
