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
    private $password;
    private $emailConfirmed;
    private $activeUntil;
    private $rememberMeToken;
    private $rememberMeUntil;

    private $tableName = TABLEPREFIX . 'users';


    public function __construct($id = null)
    {
        $this->userId = $id;
    }

    public function login($loginData)
    {
        $user = $this->getUserByEmail($loginData['userEmail']);

        if (empty($user)) {
            return [
                'message' => 'Login fehlgeschlagen. E-Mail oder Password ist falsch.',
                'status' => 'failed'
            ];
            exit();
        }

        if ($user->emailConfirmed == 0) {
            return [
                'message' => 'Deine E-Mail-Adresse ist noch nicht bestätigt. Bitte öffne den Link in der Mail, die du nach der Anmeldung erhalten hast.',
                'status' => 'mail auth missing'
            ];
        }

        if ((new DateTime())->getTimestamp() > (new DateTime($user->getActiveUntil()))->getTimestamp()) {
            return ['message' => 'Dein Abonnement ist abgelaufen. Bitte verlängere es, um den Lehrerplaner weiter nutzen zu können.'];
        }

        if (password_verify($loginData['password'], $user->getPassword())) {
            $_SESSION['isLoggedIn'] = true;
            $_SESSION['userId'] = $user->getId();
            
            $user->setRememberMeCookie();

            //if the user has requested a password reset, but still logs in with the old data the token needs to be wiped
            $query = "UPDATE $this->tableName SET resetToken = NULL, resetTokenValidUntil = NULL WHERE id = :userId";
            $this->write($query, ['userId' => $user->getId()]);

            return [
                'status' => 'success',
                'message' => 'Successfully logged in'
                ];
        } else {
            return [
                'message' => 'Login fehlgeschlagen. E-Mail oder Password ist falsch.',
                'status' => 'failed'
            ];
        }
    }

    public function isRemembered($rememberMeToken) :void
    {
        $user = $this->getUserByRememberMeToken($rememberMeToken);

        if (!is_null($user)) {
            $today = (new DateTime())->getTimestamp();
            $rememberMeUntil = strtotime($user->rememberMeUntil);

            if ($today <= $rememberMeUntil){
                $_SESSION['userId'] = $user->getId();
                $_SESSION['isLoggedIn'] = true;
            }
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

    public function deleteAccount() {
        global $user;

        $query = "DELETE FROM $this->tableName WHERE id = :id";

        return $this->delete($query, ['id' => $user->getId()]);
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
                <a href="$mailConfirmationLink">$mailConfirmationLink</a>
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
                <a href="$passwordResetLink">$passwordResetLink</a>
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

    private function getPassword()
    {
        return $this->password;
    }

    public function getActiveUntil()
    {
        return $this->activeUntil;
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

        if (!empty($result)) {
            $user = new User($id);
            $user->email = $result[0]['userEmail'];
            $user->password = $result[0]['password'];
            $user->emailConfirmed = $result[0]['emailConfirmed'];
            $user->activeUntil = $result[0]['activeUntil'];
            $user->rememberMeToken = $result[0]['rememberMeToken'];
            $user->rememberMeUntil = $result[0]['rememberMeUntil'];

            return $user;
        }
    }

    public function getUserByEmail($email)
    {
        $query = "SELECT * FROM $this->tableName WHERE userEmail = :email";
        $result = $this->read($query, ['email' => $email]);


        if (!empty($result)) {
            $user = new User($result[0]['id']);
            $user->email = $result[0]['userEmail'];
            $user->password = $result[0]['password'];
            $user->emailConfirmed = $result[0]['emailConfirmed'];
            $user->activeUntil = $result[0]['activeUntil'];
            $user->rememberMeToken = $result[0]['rememberMeToken'];
            $user->rememberMeUntil = $result[0]['rememberMeUntil'];

            return $user;
        }
    }

    public function getUserByRememberMeToken($rememberMeToken)
    {
        $query = "SELECT * FROM $this->tableName WHERE rememberMeToken = :rememberMeToken";
        $result = $this->read($query, ['rememberMeToken' => $rememberMeToken]);

        if (!empty($result)) {
            $user = new User($result[0]['id']);
            $user->email = $result[0]['userEmail'];
            $user->password = $result[0]['password'];
            $user->emailConfirmed = $result[0]['emailConfirmed'];
            $user->activeUntil = $result[0]['activeUntil'];
            $user->rememberMeToken = $result[0]['rememberMeToken'];
            $user->rememberMeUntil = $result[0]['rememberMeUntil'];

            return $user;
        }
    }

    private function getUserDataByPasswordResetToken($token): array
    {
        $query = "SELECT * FROM $this->tableName WHERE resetToken = :token";

        $result = $this->read($query, ['token' => $token]);

        return $result;
    }

    private function setRememberMeCookie(){
        $rememberMeToken = bin2hex(random_bytes(20));
        $rememberMeUntil = (new DateTime())->setTime(3,0)->modify('+1 day')->format('Y-m-d H:i:s'); 
        $rememberMeUntilTimestamp = strtotime($rememberMeUntil);
        
        
        $query = "UPDATE $this->tableName SET rememberMeToken = :rememberMeToken, rememberMeUntil = :rememberMeUntil WHERE id = :id";
        $params = [
            'rememberMeToken' => $rememberMeToken,
            'rememberMeUntil' => $rememberMeUntil,
            'id' => $this->getId()
        ];

        $result = $this->write($query, $params);

        if ($result['status'] == 'success'){
            setcookie('lprm', $rememberMeToken, $rememberMeUntilTimestamp,"", "", true);
        }
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
