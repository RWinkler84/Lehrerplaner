<?php

namespace Controller;

use Model\SchoolYear;

class SchoolYearController extends AbstractController
{
    private $model;


    public function __construct()
    {
        parent::__construct();
        $this->model = new SchoolYear;
    }

    public function save(): void
    {
        $schoolYearData = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->save($schoolYearData);

        echo json_encode($result);
    }

    public function update(): void
    {
        $schoolYearData = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->update($schoolYearData);

        echo json_encode($result);
    }

    public function delete(): void
    {
        $schoolYearData = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->deleteSchoolYear($schoolYearData);

        echo json_encode($result);
    }

    public static function syncSchoolYears(array $schoolYears, array $deletedSchoolYears): array {
        $model = new SchoolYear;

        $result = $model->syncSchoolYears($schoolYears, $deletedSchoolYears);
        
        return $result;
    }
}
