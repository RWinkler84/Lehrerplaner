<?php 
namespace Controller;
use Controller\AbstractController;
use Model\AbstractModel;
use Model\LessonNote;

class LessonNoteController extends AbstractController {
    private $model;

    function __construct()
    {
        parent::__construct();
        $this->model = new LessonNote;
    }
}