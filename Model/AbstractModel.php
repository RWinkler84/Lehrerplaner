<?php

namespace Model;

use PDO;
use DateTime;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
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

        return [
            'status' => 'failed'
        ];
    }

    protected function write($query, $params)
    {
        global $db;

        error_log(print_r($params, true));

        if (!is_null($db)) {
            try {
                $stmt = $db->prepare($query);

                foreach ($params as $key => $value) {
                    if ($key == 'date') {
                        $date = new DateTime($value);
                        $value = $date->format('Y-m-d');
                    }
                    $stmt->bindValue($key, $value);
                }

                $stmt->execute();
            } catch (Exception $e) {
                error_log('Fehler beim Speichern der Daten: ' . $e);
                http_response_code(500);
                return [
                    'message' => $e,
                    'status' => 'failed'
                ];
            }

            return [
                'message' => 'Data saved sucessfully',
                'status' => 'success'
            ];
        }

        return [
            'status' => 'failed'
        ];
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
                error_log('Fehler beim Löschen der Daten: ' . $e);
                http_response_code(500);
                return [
                    'message' => $e,
                    'status' => 'failed'
                ];
            }

            return [
                'message' => 'Data deleted sucessfully',
                'status' => 'success'
            ];
        }

        return ['status' => 'failed'];
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

        return $this->escapeDbData($dataFromDb);
    }

    //escape
    private function escapeDbData($data)
    {
        foreach ($data as $k => $dataset) {
            foreach ($dataset as $key => $value) {
                $data[$k][$key] = htmlspecialchars($value);
            }
        }

        return $data;
    }

    protected function preprocessReadData($dataArray)
    {
        $dataArray = array_map(function ($data) {
            $data['id'] = $data['itemId'];
            unset($data['userId']);
            unset($data['itemId']);

            return $data;
        }, $dataArray);

        return $dataArray;
    }

    protected function preprocessDataToWrite($dataArray)
    {
        global $user;

        //sometimes dataArray will be a set of associative arrays, sometimes it will just be a single associative array
        if (isset($dataArray[0])) {

            $dataArray = array_map(function ($data) {
                global $user;

                $data['userId'] = $user->getId();

                if (isset($data['id'])) $data['itemId'] = $data['id'];
                if (isset($data['lastEdited'])) $data['lastEdited'] = (new DateTime($data['lastEdited']))->modify('+2 hours')->format('Y-m-d H:i:s');

                unset($data['id']);
                if (isset($data['synced'])) unset($data['synced']);

                return $data;
            }, $dataArray);
        } else {
            $dataArray['userId'] = $user->getId();
            if (isset($dataArray['id'])) $dataArray['itemId'] = $dataArray['id'];
            
            unset($dataArray['id']);
            if (isset($dataArray['synced'])) unset($dataArray['synced']);
        }

        return $dataArray;
    }

    protected function sendMail($recipient, $subject, $message): bool
    {
        $mail = new PHPMailer(true);

        try {
            //Server settings
            // $mail->SMTPDebug = SMTP::DEBUG_SERVER;                   //Enable verbose debug output
            $mail->isSMTP();                                            //Send using SMTP
            $mail->Host       = MAILHOST;                               //Set the SMTP server to send through
            $mail->SMTPAuth   = true;                                   //Enable SMTP authentication
            $mail->Username   = MAILUSERNAME;                           //SMTP username
            $mail->Password   = MAILPASSWORD;                           //SMTP password
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            //Enable implicit TLS encryption
            $mail->Port       = MAILPORT;                               //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`
            $mail->CharSet    = 'UTF-8';

            //Recipients
            $mail->setFrom(MAILFROM, 'Lehrerplaner');
            $mail->addAddress($recipient);                        //Add a recipient

            //Content
            $mail->isHTML(true);                                  //Set email format to HTML
            $mail->Subject = $subject;
            $mail->Body    = $message;
            // $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

            $mail->send();

            return true;
        } catch (Exception $e) {
            error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");

            return false;
        }
    }
}
