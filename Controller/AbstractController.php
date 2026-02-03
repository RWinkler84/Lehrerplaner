<?php

namespace Controller;

use Model\AbstractModel;
use Controller\LessonController;
use Controller\SettingsController;
use Controller\TaskController;
use Controller\UserController;

class AbstractController
{

    private $db;

    public function __construct()
    {
        $this->db = new AbstractModel();
    }

    public function getSubjects()
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $result = $this->db->getSubjects();

        echo json_encode($result);
    }

    public function getTimetable()
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $result = $this->db->getTimetable();

        echo json_encode($result);
    }

    public function getTimetableChanges()
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $result = $this->db->getTimetableChanges();

        echo json_encode($result);
    }

    public function getAllTasks()
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $result = $this->db->getAllTasks();

        echo json_encode($result);
    }

    public function getAllLessonNotes()
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $result = $this->db->getAllLessonNotes();

        echo json_encode($result);
    }

    public function getAllSchoolYears()
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $result = $this->db->getAllSchoolYears();

        echo json_encode($result);
    }

    public function setDbUpdateTimestamp($updatedTableName, $dateTime)
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $this->db->setDbUpdateTimestamp($updatedTableName, $dateTime);
    }

    public function getDbUpdateTimestamps()
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $result = $this->db->getDbUpdateTimestamps();

        echo json_encode($result);
    }

    public function syncDatabase()
    {
        global $user;
        if ($user->isActive() == false) $this->returnUserInactiveMessage();

        $dataToSync = json_decode(file_get_contents('php://input'), true);
        $subjectsResults = [];
        $timetableResults = [];
        $timetableChangesResults = [];
        $taskResults = [];
        $lessonNotesResults = [];
        $schoolYearResults = [];

        if (!empty($dataToSync['subjects']) || !empty($dataToSync['deletedSubjects'])) {
            $subjectsResults = SettingsController::syncSubjects($dataToSync['subjects'], $dataToSync['deletedSubjects']);
        }

        if (!empty($dataToSync['timetable'])) {
            $timetableResults = SettingsController::syncTimetable($dataToSync['timetable']);
        }

        if (!empty($dataToSync['timetableChanges']) || !empty($dataToSync['deletedTimetableChanges'])) {
            $timetableChangesResults = LessonController::syncTimetableChanges($dataToSync['timetableChanges'], $dataToSync['deletedTimetableChanges']);
        }

        if (!empty($dataToSync['tasks']) || !empty($dataToSync['deletedTasks'])) {
            $taskResults = TaskController::syncTasks($dataToSync['tasks'], $dataToSync['deletedTasks']);
        }

        if (!empty($dataToSync['lessonNotes']) || !empty($dataToSync['deletedLessonNotes'])) {
            $lessonNotesResults = LessonNoteController::syncLessonNotes($dataToSync['lessonNotes'], $dataToSync['deletedLessonNotes']);
        }

        if (!empty($dataToSync['schoolYears']) || !empty($dataToSync['deletedSchoolYears'])) {
            $schoolYearResults = SchoolYearController::syncSchoolYears($dataToSync['schoolYears'], $dataToSync['deletedSchoolYears']);
        }

        $result = [
            'subjects' => $subjectsResults,
            'timetable' => $timetableResults,
            'timetableChanges' => $timetableChangesResults,
            'tasks' => $taskResults,
            'lessonNotes' => $lessonNotesResults,
            'schoolYears' => $schoolYearResults
        ];

        echo json_encode($result);
    }

    public function getUserInfo()
    {
        global $user;
        $status = $user->getUserInfo();

        if (is_null($user)) {
            echo json_encode(['loggedIn' => 'false']);
            exit;
        }

        $status['loggedIn'] = 'true';

        echo json_encode($status);
    }

    public function sendSupportTicket()
    {
        $ticketData = json_decode(file_get_contents('php://input'), true);
        $result = $this->db->sendSupportTicket($ticketData);

        echo json_encode($result);
    }

    public function createStripeSession()
    {
        $checkoutSession = createStripeSession($_GET['item']);

        echo json_encode(array('clientSecret' => $checkoutSession->client_secret));
    }

    //webhook for Stripe payment status updates
    public function receivePaymentStatusUpdate()
    {
        require_once './vendor/autoload.php';

        \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
        // Replace this endpoint secret with your endpoint's unique secret
        // If you are testing with the CLI, find the secret by running 'stripe listen'
        // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
        // at https://dashboard.stripe.com/webhooks
        $endpoint_secret = STRIPE_ENDPOINT_SECRET;

        $payload = file_get_contents('php://input');
        $event = null;

        try {
            $event = \Stripe\Event::constructFrom(
                json_decode($payload, true)
            );
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            http_response_code(400);
            exit();
        }
        if ($endpoint_secret) {
            // Only verify the event if there is an endpoint secret defined
            // Otherwise use the basic decoded event
            $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
            try {
                $event = \Stripe\Webhook::constructEvent(
                    $payload,
                    $sig_header,
                    $endpoint_secret
                );
            } catch (\Stripe\Exception\SignatureVerificationException $e) {
                // Invalid signature
                http_response_code(400);
                exit();
            }
        }

        $userController = new UserController;

        // Handle the event
        switch ($event->type) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded':
                $userController->processPurchase($event->data->object->id);
                break;

            case 'checkout.session.expired':
                $userController->removeExpiredCheckoutSessions($event->data->object->id);
        }

        http_response_code(200);
    }

    private function returnUserInactiveMessage()
    {
        echo json_encode([
            'status' => 'failed',
            'error' => 'Plus licence expired',
            'message' => 'You need an active Eduplanio Plus licence to perform this action.'
        ]);

        exit;
    }
}
