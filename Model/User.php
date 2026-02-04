<?php

namespace Model;

use Controller\AbstractController;
use Controller\UserController;
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

        if (is_array($user) && isset($user['status']) && $user['status'] == 'failed') {
            return [
                'message' => $user['message'],
                'status' => 'failed',
                'error' => $user['error']
            ];
            exit();
        }

        if (is_null($user)) {
            return [
                'message' => 'Login fehlgeschlagen. E-Mail oder Password ist falsch.',
                'status' => 'failed',
                'error' => 'wrong login credentials'
            ];
        }

        if ($user->emailConfirmed == 0) {
            return [
                'message' => 'Deine E-Mail-Adresse ist noch nicht bestätigt. Bitte öffne den Link in der Mail, die du nach der Anmeldung erhalten hast.',
                'status' => 'failed',
                'error' => 'mail auth missing'
            ];
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
                'status' => 'failed',
                'error' => 'wrong login credentials'
            ];
        }
    }

    public function isRemembered($rememberMeToken): void
    {
        $user = $this->getUserByRememberMeToken($rememberMeToken);

        if (!is_null($user)) {
            $today = (new DateTime())->getTimestamp();
            $rememberMeUntil = strtotime($user->rememberMeUntil);

            if ($today <= $rememberMeUntil) {
                $_SESSION['userId'] = $user->getId();
                $_SESSION['isLoggedIn'] = true;
            }
        }
    }

    public function createAccount($accountData)
    {
        $mailSend = false;

        $userExists = $this->userExists($accountData);

        if (isset($userExists['status']) && $userExists['status'] == 'failed') {
            return $userExists;
        } else if ($this->userExists($accountData)) {
            return ['message' => 'Die angegebene E-Mail-Adresse wird bereits verwendet.'];
        }

        $query = "INSERT INTO $this->tableName (userEmail, emailConfirmed, password, activeUntil) VALUES (:userEmail, :emailConfirmed, :password, :activeUntil)";

        $accountData['password'] = password_hash($accountData['password'], PASSWORD_DEFAULT);
        $accountData['emailConfirmed'] = 0;
        $accountData['activeUntil'] = (new DateTime())->modify('+ 30 days')->format('Y-m-d');
        unset($accountData['passwordRepeat']);

        $result = $this->write($query, $accountData);

        if ($result['status'] == 'success') {
            $user = $this->getUserByEmail($accountData['userEmail']);
            $this->setInitalUpdateTimestamps($user);

            $mailSend = $user->sendEmailAuthenticationMail();
        }

        if ($mailSend) {
            return [
                'status' => 'success',
                'message' => 'Confirmation email send'
            ];
        }

        return [
            'status' => 'failed',
            'message' => 'Etwas ist schief gelaufen...'
        ];
    }

    public function deleteAccount()
    {
        global $user;

        if (is_null($user)) {
            echo json_encode(['status' => 'failed', 'error' => 'User not logged in']);
            exit;
        }

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

        if (!is_null($user) && !is_array($user)) {
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

    private function setInitalUpdateTimestamps($user)
    {
        $tableName = TABLEPREFIX . 'updateTimestamps';
        $timestamp = '1970-01-01';

        $query = "
            INSERT INTO $tableName (userId, subjects, tasks, timetable, timetableChanges)
            VALUES (:userId, :subjects, :tasks, :timetable, :timetableChanges)";

        $params = [
            'userId' => $user->getId(),
            'subjects' => $timestamp,
            'tasks' => $timestamp,
            'timetable' => $timestamp,
            'timetableChanges' => $timestamp,
        ];

        $this->write($query, $params);
    }

    public function getId()
    {
        return $this->userId;
    }

    public function getEmail(): ?string
    {
        if (!is_null($this->userId)) {
            return $this->email;
        }

        return null;
    }

    private function getPassword()
    {
        return $this->password;
    }

    public function getActiveUntil()
    {
        return $this->activeUntil;
    }

    public function getUserInfo()
    {
        global $user;
        $user = $this->getUserById($user->getId());

        return [
            'email' => $user->email,
            'emailConfirmed' => $user->emailConfirmed,
            'activeUntil' => $user->activeUntil
        ];
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

        if (isset($result['status']) && $result['status'] == 'failed') return $result;

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

    public function storePurchaseAttempt($sessionId, $purchasedItem)
    {
        $user = $this->getUserById($this->getId());

        $licencedTimespan = [
            'oneMonth' => 30,
            'oneYear' => 365
        ];

        $today = new DateTime('now');
        $newActiveUntil = '';

        if ($user->activeUntil <= $today->format('Y-m-d')) $newActiveUntil = $today->modify("+{$licencedTimespan[$purchasedItem]} days")->format('Y-m-d');
        if ($user->activeUntil > $today->format('Y-m-d')) $newActiveUntil = new DateTime($user->activeUntil)->modify("+{$licencedTimespan[$purchasedItem]} days")->format('Y-m-d');
    
        $query = "INSERT INTO plusTransactions (userId, userEmail, product, oldActiveUntil, newActiveUntil, paymentStatus, fullfillmentStatus, stripeSessionId)
            VALUES (:userId, :userEmail, :product, :oldActiveUntil, :newActiveUntil, :paymentStatus, :fullfillmentStatus, :stripeSessionId)
        ";

        $params = [
            'userId' => $user->getId(),
            'userEmail' => $user->getEmail(),
            'product' => $purchasedItem,
            'oldActiveUntil' => $user->getActiveUntil(),
            'newActiveUntil' => $newActiveUntil,
            'paymentStatus' => 0,
            'fullfillmentStatus' => 0,
            'stripeSessionId' => $sessionId
        ];

        $this->write($query, $params);
    }

    public function processPurchase($stripeSession)
    {
        $licencedTimespan = [
            'oneMonth' => 30,
            'oneYear' => 365
        ];

        $user = $this->getUserByEmail($stripeSession['customer_details']['email']);
        $newActiveUntil = '';

        $isFullfilled = $this->isStripeSessionFullfilled($stripeSession);

        error_log(print_r($stripeSession,true));

        if ($isFullfilled == false) {

            $query = "UPDATE $this->tableName SET activeUntil = :activeUntil WHERE id = :id";
            $purchasedItem = $stripeSession['metadata']['purchasedItem'];

            if (!is_null($user)) {
                $today = new DateTime('now');
                $activeUntil = new DateTime($user->activeUntil);

                // eduplanio plus is expired or about to expire today
                if ($today->format('Y-m-d') >= $activeUntil->format('Y-m-d')) {
                    $newActiveUntil = $today->modify("+{$licencedTimespan[$purchasedItem]} days")->format('Y-m-d');
                }

                // eduplanio plus expires in the future
                if ($today->format('Y-m-d') < $activeUntil->format('Y-m-d')) {
                    $newActiveUntil = $activeUntil->modify("+{$licencedTimespan[$purchasedItem]} days")->format('Y-m-d');
                }

                $result = $this->write($query, ['id' => $user->getId(), 'activeUntil' => $newActiveUntil]);

                if ($result['status'] == 'failed') {
                    $result['message'] = 'Aber keine Sorge. Der Admin wurde benachrichtigt und meldet sich schnellstmöglich per Mail bei dir.';

                    $mailMessage = <<<MAIL
                        Ein Nutzer hat versucht, seine Eduplanio Plus-Lizenz zu verlängern. Die Transaktion wurde abgeschlossen, das Update in
                        der Datenbank ist allerdings fehlgeschlagen. Prüfe die Transaktion und setze activeUntil auf den korrekten Wert.

                        User-Id: {$user->getId()}
                        User-Email: {$user->getEmail()}
                        Verlängerungszeitraum: {$licencedTimespan[$purchasedItem]}
                        neues Ablaufdatum: {$newActiveUntil}
                        Transaktionszeit: {$today->format('d.m.Y H:i:s')}
                    MAIL;

                    $this->sendMail('winkler.ralf84@hotmail.de', 'Eduplanio - Fehlgeschlagenes Eduplanio Plus-Update', $mailMessage);

                    exit();
                }

                $this->setPurchaseFullfilled($stripeSession);

                return $result;
            }
        }
    }

    public function removeExpiredCheckoutSessions($stripeSessionId) {
        $query = "DELETE FROM plusTransactions WHERE stripeSessionId = :stripeSessionId";

        $this->delete($query, ['stripeSessionId' => $stripeSessionId]);
    }

    public function isActive() {
        $user = $this->getUserById($this->userId);

        if ($user && $user->activeUntil >= (new DateTime('now'))->format('Y-m-d')) return true;

        return false;
    }

    private function setPurchaseFullfilled($stripeSession) {
        $query = "UPDATE plusTransactions SET paymentStatus = :paymentStatus, fullfillmentStatus = :fullfillmentStatus, stripeTransactionId = :stripeTransactionId WHERE stripeSessionId = :stripeSessionId";
        $params = [
            'paymentStatus' => true,
            'fullfillmentStatus' => true,
            'stripeTransactionId' => $stripeSession['payment_intent'],
            'stripeSessionId' => $stripeSession->id
        ];

        $this->write($query, $params);
    }

    private function isStripeSessionFullfilled($stripeSession): bool
    {
        $query = "SELECT * FROM plusTransactions WHERE stripeSessionId = :stripeSessionId";

        $result = $this->read($query, ['stripeSessionId' => $stripeSession->id]);

        if ($result) {
            if ($result[0]['fullfillmentStatus'] == 1) return true;
        }

        return false;
    }

    private function getUserDataByPasswordResetToken($token): array
    {
        $query = "SELECT * FROM $this->tableName WHERE resetToken = :token";

        $result = $this->read($query, ['token' => $token]);

        return $result;
    }

    private function setRememberMeCookie()
    {
        $rememberMeToken = bin2hex(random_bytes(20));
        $rememberMeUntil = (new DateTime())->setTime(3, 0)->modify('+1 day')->format('Y-m-d H:i:s');
        $rememberMeUntilTimestamp = strtotime($rememberMeUntil);


        $query = "UPDATE $this->tableName SET rememberMeToken = :rememberMeToken, rememberMeUntil = :rememberMeUntil WHERE id = :id";
        $params = [
            'rememberMeToken' => $rememberMeToken,
            'rememberMeUntil' => $rememberMeUntil,
            'id' => $this->getId()
        ];

        $result = $this->write($query, $params);

        if ($result['status'] == 'success') {
            setcookie('lprm', $rememberMeToken, $rememberMeUntilTimestamp, "", "", true);
        }
    }

    private function userExists($newUserData)
    {
        $allUsers = $this->getAllUsers();

        if (isset($allUsers['status']) && $allUsers['status'] == 'failed') return $allUsers;

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
