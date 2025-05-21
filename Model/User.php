<?php

namespace Model;

use DateInterval;
use DateTime;
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
            return [
                'message' => 'Falsche E-Mail oder falsches Passwort.',
                'status' => 'wrong login data'
                ];
            exit();
        }

        if ($result[0]['emailConfirmed'] == 0) {
            return [
                'message' => 'Deine E-Mail-Adresse ist noch nicht bestätigt. Bitte öffne den Link in der Mail, die du nach der Anmeldung erhalten hast.',
                'status' => 'mail auth missing'
            ];
        }

        if ((new DateTime())->getTimestamp() > (new DateTime($result[0]['activeUntil']))->getTimestamp()){
            return ['message' => 'Dein Abonnement ist abgelaufen. Bitte verlängere es, um den Lehrerplaner weiter nutzen zu können.'];
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
        $mailSend = false;

        if ($this->userExists($accountData)) {
            return ['message' => 'Die angegebene E-Mail-Adresse wird bereits verwendet.'];
        }

        $query = "INSERT INTO $this->tableName (userEmail, emailConfirmed, password, activeUntil) VALUES (:userEmail, :emailConfirmed, :password, :activeUntil)";

        $accountData['password'] = password_hash($accountData['password'], PASSWORD_DEFAULT);
        $accountData['emailConfirmed'] = 0;
        $accountData['activeUntil'] = (new DateTime())->modify('+ 30 days')->format('Y-m-d');
        unset($accountData['passwordRepeat']);

        error_log($accountData['activeUntil']);

        $result = $this->write($query, $accountData);

        if ($result['message'] == 'Data saved sucessfully') {
            $user = $this->getUserByEmail($accountData['userEmail']);

            $mailSend = $user->sendEmailAuthenticationMail();
        }

        if ($mailSend) {
            return ['message' => 'Confirmation email send'];
        }

        return ['message' => 'Etwas ist schief gelaufen...'];
    }

    public function authenticateMail($userId, $emailHash)
    {
        $user = $this->getUserById($userId);

        if (password_verify($user->email, $emailHash)) {
            $query = "UPDATE $this->tableName SET emailConfirmed = 1 WHERE userEmail = :userEmail";

            $result = $this->write($query, ['userEmail' => $user->getEmail()]);

            if ($result['message'] == 'Data saved sucessfully') {
                return true;
            }
        }

        return false;
    }

    private function sendEmailAuthenticationMail(): bool
    {
        $mailConfirmationLink = $this->getMailConfirmationLink();
        $mailSubject = 'Dein Account beim Lehrerplaner wartet auf Aktivierung';
        $mailMessage = <<<MAIL
                <b>Fast geschafft!</b><br>
                <br>
                Du hast erfolgreich einen Account bei Lehrerplaner angelegt. Um ihn nutzen zu können, musst du deine E-Mail-Adresse bestätigen.
                Klicke dazu nachfolgenden Link: <br>
                <br>
                $mailConfirmationLink
            MAIL;
        
        return $this->sendMail($this->getEmail(), $mailSubject, $mailMessage);
    }

    public function resendAuthMail($data): bool
    {
        $user = $this->getUserByEmail($data['userEmail']);

        return $user->sendEmailAuthenticationMail();
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

    private function getMailConfirmationLink()
    {
        $emailHash = password_hash($this->getEmail(), PASSWORD_DEFAULT);

        return ROOTURL . '?c=user&a=authenticateMail&i=' . $this->getId() . '&t=' . $emailHash;
    }
}
