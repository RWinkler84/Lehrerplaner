<?php

namespace Model;

use PDO;
use PDOException;
use DateTime;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


class AbstractModel
{
    protected function read($query, $params)
    {
        global $db;

        if (!is_null($db)) {

            $stmt = $db->prepare($query);

            if (count($params) > 0) {
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
            }

            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $result;
        }

        echo json_encode(
            [
                'status' => 'failed',
                'message' => 'Scheinbar gibt es gerade ein technisches Problem. Bitte versuche es später noch einmal.',
                'error' => 'database unreachable'
            ]
        );
        exit;
    }

    protected function write($query, $params)
    {
        global $db;

        if (!is_null($db)) {
            try {
                $stmt = $db->prepare($query);

                foreach ($params as $key => $value) {
                    if ($key == 'date') {
                        $date = new DateTime($value);
                        $value = $date->format('Y-m-d');
                    }

                    if ($key == 'lastEdited') {
                    }

                    if ($key == 'validUntil' && $value == 'null') {
                        $stmt->bindValue($key, null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue($key, $value);
                    }
                }

                $stmt->execute();
            } catch (PDOException $e) {
                error_log(__FILE__ . __LINE__ . 'Fehler beim Speichern der Daten: ' . $e);
                return [
                    'status' => 'failed',
                    'message' => 'Beim Speichern der Daten ist ein Fehler aufgetreten.',
                    'error' => $e->getCode()
                ];
            }

            return [
                'message' => 'Data saved sucessfully',
                'status' => 'success'
            ];
        }

        echo json_encode(
            [
                'status' => 'failed',
                'message' => 'Scheinbar gibt es gerade ein technisches Problem. Bitte versuche es später noch einmal.',
                'error' => 'database unreachable'
            ]
        );
        exit;
    }

    protected function delete($query, $params)
    {
        global $db;

        if (!is_null($db)) {
            try {
                $stmt = $db->prepare($query);

                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }

                $stmt->execute();
            } catch (Exception $e) {
                error_log(__FILE__ . __LINE__ . 'Fehler beim Löschen der Daten: ' . $e);
                http_response_code(500);
                return [
                    'message' => 'Die Daten konnten nicht gelöscht werden.',
                    'status' => 'failed',
                    'error' => $e
                ];
            }

            return [
                'message' => 'Die Daten wurden erfolgreich gelöscht.',
                'status' => 'success'
            ];
        }

        echo json_encode(
            [
                'status' => 'failed',
                'message' => 'Scheinbar gibt es gerade ein technisches Problem. Bitte versuche es später noch einmal.',
                'error' => 'database unreachable'
            ]
        );
        exit;
    }

    public function getSubjects()
    {
        global $user;
        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'subjects';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        if (empty($dataFromDb)) return ['status' => 'success', 'error' => 'No entries found', 'message' => 'Es konnten keine Daten gefunden werden'];

        return $this->escapeDbData($dataFromDb);
    }

    public function getTimetable()
    {
        global $user;
        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'timetable';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        if (empty($dataFromDb)) return ['status' => 'success', 'error' => 'No entries found', 'message' => 'Es konnten keine Daten gefunden werden'];

        return $this->escapeDbData($dataFromDb);
    }

    public function getTimetableChanges()
    {
        global $user;
        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'timetableChanges';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        if (empty($dataFromDb)) return ['status' => 'success', 'error' => 'No entries found', 'message' => 'Es konnten keine Daten gefunden werden'];

        return $this->escapeDbData($dataFromDb);
    }

    public function getAllTasks()
    {
        global $user;

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'tasks';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        if (empty($dataFromDb)) return ['status' => 'success', 'error' => 'No entries found', 'message' => 'Es konnten keine Daten gefunden werden'];

        return $this->escapeDbData($dataFromDb);
    }

    public function getAllLessonNotes()
    {
        global $user;

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'lessonNotes';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";
        $params = [];

        $dataFromDb = $this->read($query, $params);
        $dataFromDb = $this->preprocessReadData($dataFromDb);

        if (empty($dataFromDb)) return ['status' => 'success', 'error' => 'No entries found', 'message' => 'Es konnten keine Daten gefunden werden'];

        return $dataFromDb; //not escaped because it and should be html code to allow styling of the text
    }

    public function getAllSchoolYears(): array
    {
        global $user;
        $dataFromDb = null;

        if (!is_null($user)) $userId = $user->getId();
        if (!is_null($userId)) {
            $tableName = TABLEPREFIX . 'schoolYears';

            $query = "SELECT * FROM $tableName WHERE userId = $userId";

            $dataFromDb = $this->read($query, []);
        }

        if (empty($dataFromDb)) return ['status' => 'success', 'error' => 'No entries found', 'message' => 'Es konnten keine Daten gefunden werden'];

        return $dataFromDb; //not escaped because it and should be html code to allow styling of the text
    }

    public function getDbUpdateTimestamps()
    {
        global $user;

        if (is_null($user)) {
            echo json_encode([
                'status' => 'failed',
                'error' => 'User not logged in',
                'message' => 'Der Nutzer ist nicht angemeldet.'
            ]);
            exit;
        }

        $userId = $user->getId();
        $tableName = TABLEPREFIX . 'updateTimestamps';

        $query = "SELECT * FROM $tableName WHERE userId = $userId";

        $result = $this->read($query, []);
        $result = $this->preprocessReadData($result);

        if (empty($result)) return ['status' => 'success', 'message' => 'No entries found'];

        return $result;
    }

    public function setDbUpdateTimestamp($updatedTableName, $dateTime)
    {
        global $user;
        $tableName = TABLEPREFIX . 'updateTimestamps';
        $timestamp = $dateTime->format('Y-m-d H:i:s');

        $query = "
            INSERT INTO $tableName (userId, $updatedTableName) 
            VALUES (:userId, :timestamp)
            ON DUPLICATE KEY UPDATE
                $updatedTableName = :timestamp
        ";

        $params = [
            'userId' => $user->getId(),
            'timestamp' => $timestamp
        ];

        $this->write($query, $params);
    }

    //escape
    private function escapeDbData($data)
    {
        if (!empty($data)) {
            foreach ($data as $k => $dataset) {
                foreach ($dataset as $key => $value) {
                    if (!is_null($value)) {
                        $data[$k][$key] = htmlspecialchars($value);
                    }
                }
            }
        }

        return $data;
    }

    protected function preprocessReadData($dataArray)
    {
        if (!isset($dataArray['status']) || $dataArray['status'] != 'failed') {
            $dataArray = array_map(function ($data) {
                if (isset($data['itemId'])) $data['id'] = $data['itemId'];
                unset($data['userId']);
                unset($data['itemId']);

                return $data;
            }, $dataArray);

            return $dataArray;
        }

        return $dataArray;
    }

    protected function preprocessDataToWrite($dataArray)
    {
        global $user;

        if (!isset($user)) {
            echo json_encode([
                'status' => 'failed',
                'error' => 'User not logged in'
            ]);
            exit();
        }

        //sometimes dataArray will be a set of associative arrays, sometimes it will just be a single associative array
        if (isset($dataArray[0])) {

            $dataArray = array_map(function ($data) {
                global $user;

                $data['userId'] = $user->getId();

                if (isset($data['id'])) $data['itemId'] = $data['id'];

                if (isset($data['fixedTime']) && $data['fixedTime'] == '') $data['fixedTime'] = 0;
                if (isset($data['fixedDate']) && $data['fixedDate'] == '') $data['fixedDate'] = 0;
                if (isset($data['reoccuring']) && $data['reoccuring'] == '') $data['reoccuring'] = 0;

                unset($data['id']);
                if (isset($data['synced'])) unset($data['synced']);

                return $data;
            }, $dataArray);
        } else {
            $dataArray['userId'] = $user->getId();
            if (isset($dataArray['id'])) $dataArray['itemId'] = $dataArray['id'];

            if (isset($dataArray['fixedTime']) && $dataArray['fixedTime'] == '') $dataArray['fixedTime'] = 0;
            if (isset($dataArray['fixedDate']) && $dataArray['fixedDate'] == '') $dataArray['fixedDate'] = 0;
            if (isset($dataArray['reoccuring']) && $dataArray['reoccuring'] == '') $dataArray['reoccuring'] = 0;

            unset($dataArray['id']);
            if (isset($dataArray['synced'])) unset($dataArray['synced']);
        }

        return $dataArray;
    }

    public function sendSupportTicket($ticketData)
    {
        $userEmail = $ticketData['userEmail'];
        $ticketTopic = $ticketData['ticketTopic'];
        $sendAtTimestamp = $ticketData['sendAt'];
        $ticketContent = $ticketData['ticketContent'];
        $version = $ticketData['appVersion'];

        $mailContent = "
            <p><b>Nutzer-Mail: </b>$userEmail</p>
            <p><b>Thema: </b>$ticketTopic</p>
            <p><b>App-Version: </b>$version</p>
            <p><b>gesendet am: </b>$sendAtTimestamp</p>
            <p><b>Ticketinhalt: </b>$ticketContent</p>
        ";

        $mailSend = $this->sendMail('winkler.ralf84@hotmail.de', 'Neue Support-Anfrage', $mailContent);

        if ($mailSend) {
            return [
                'status' => 'success',
                'message' => 'Mail send successfully.'
            ];
        }

        return [
            'status' => 'failed',
            'message' => 'Mail could not be send.'
        ];
    }

    protected function sendMail($recipient, $subject, $message): bool
    {
        $mail = new PHPMailer(true);

        try {
            //Server settings
            //$mail->SMTPDebug = SMTP::DEBUG_SERVER;                   //Enable verbose debug output
            $mail->isSMTP();                                            //Send using SMTP
            $mail->Host       = MAILHOST;                               //Set the SMTP server to send through
            $mail->SMTPAuth   = true;                                   //Enable SMTP authentication
            $mail->Username   = MAILUSERNAME;                           //SMTP username
            $mail->Password   = MAILPASSWORD;                           //SMTP password
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;            //Enable implicit TLS encryption
            $mail->Port       = MAILPORT;                               //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`
            $mail->CharSet    = 'UTF-8';

            //Recipients
            $mail->setFrom(MAILFROM, 'Eduplanio');
            $mail->addAddress($recipient);                        //Add a recipient

            //Content
            $mail->isHTML(true);                                  //Set email format to HTML
            $mail->Subject = $subject;
            $mail->Body    = $message;
            // $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

            $mail->send();
        } catch (Exception $e) {
            error_log(__FILE__ . __LINE__ . "Message could not be sent. Mailer Error: {$mail->ErrorInfo}");

            return false;
        }

        return true;
    }
}
