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
                'message' => 'Login fehlgeschlagen. E-Mail oder Password ist falsch.',
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

        if ((new DateTime())->getTimestamp() > (new DateTime($result[0]['activeUntil']))->getTimestamp()) {
            return ['message' => 'Dein Abonnement ist abgelaufen. Bitte verlängere es, um den Lehrerplaner weiter nutzen zu können.'];
        }

        if (password_verify($loginData['password'], $result[0]['password'])) {
            $_SESSION['isLoggedIn'] = true;
            $_SESSION['userId'] = $result[0]['id'];

            return ['message' => 'Successfully logged in'];
        } else {
            return [
                'message' => 'Login fehlgeschlagen. E-Mail oder Password ist falsch.',
                'status' => 'wrong login data'
            ];
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
        $mailConfirmationLink = $this->generateMailConfirmationLink();
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

    public function sendPasswortResetMail($data): bool
    {
        $user = $this->getUserByEmail($data['userEmail']);

        if (!is_null($user)) {
            $passwordResetLink = $user->generatePasswordResetLink();
            $mailSubject = 'Passwort zurücksetzen';
            $mailMessage = <<<MAIL
                <b>Du hast dein Passwort vergessen und kommst nicht mehr in deinen Account? Keine Panik!</b><br>
                <br>
                Um ein neues Passwort anzulegen, klicke folgenden Link. Der Link ist eine Stunde gültig.<br>
                <br>
                $passwordResetLink
            MAIL;

            return $this->sendMail($user->getEmail(), $mailSubject, $mailMessage);
        }

        return false;
    }

    public function resendAuthMail($data): bool
    {
        $user = $this->getUserByEmail($data['userEmail']);

        if (!is_null($user)) {
            return $user->sendEmailAuthenticationMail();
        }

        return false;
    }

    public function resetPassword($passwordData)
    {
        $now = (new DateTime())->getTimestamp();
        $userData = $this->getUserDataByPasswordResetToken($passwordData['token']);

        if (!empty($userData)) {
            $tokenValidUntil = (new DateTime($userData[0]['resetTokenValidUntil']))->getTimestamp();

            if (
                $userData[0]['resetToken'] == $passwordData['token'] &&
                $tokenValidUntil >= $now
            ) {
                $query = "UPDATE $this->tableName SET password = :newPassword, resetToken = NULL, resetTokenValidUntil = NULL WHERE id = :id";
                
                $params['id'] = $userData[0]['id'];
                $params['newPassword'] = password_hash($passwordData['newPassword'], PASSWORD_DEFAULT);

                $result = $this->write($query, $params);

                if ($result['message']  == 'Data saved sucessfully') {
                    return [
                        'message' => 'Dein Passwort wurde erfolgreich zurückgesetzt',
                        'status' => 'success'
                    ];
                } else {
                    return [
                        'message' => 'Da ist etwas schief gelaufen. Bitte versuche es später noch einmal.',
                        'status' => 'failed'
                    ];
                }
            }
        }

        return ['message' => 'Der von dir verwendete Link scheint abgelaufen zu sein. Fordere einen neuen an.'];
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


        if (!empty($result)) {
            $user = new User($result[0]['id']);
            $user->email = $result[0]['userEmail'];

            return $user;
        }
    }

    private function getUserDataByPasswordResetToken($token): array
    {
        $query = "SELECT * FROM $this->tableName WHERE resetToken = :token";

        $result = $this->read($query, ['token' => $token]);

        return $result;
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

    private function generateMailConfirmationLink()
    {
        $emailHash = password_hash($this->getEmail(), PASSWORD_DEFAULT);

        return ROOTURL . '?c=user&a=authenticateMail&i=' . $this->getId() . '&t=' . $emailHash;
    }

    private function generatePasswordResetLink()
    {
        $resetToken = bin2hex(random_bytes(20));
        $timestamp = (new DateTime())->modify('+ 1 hour')->format('Y-m-d H:i:s');

        $query = "UPDATE $this->tableName SET resetToken = :resetToken, resetTokenValidUntil = :resetTokenValidUntil WHERE id = :id";
        $params = [
            'id' => $this->getId(),
            'resetToken' => $resetToken,
            'resetTokenValidUntil' => $timestamp
        ];

        $this->write($query, $params);

        return ROOTURL . '?reset=' . $resetToken;
    }
}
