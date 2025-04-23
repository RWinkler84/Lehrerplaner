<?php 

namespace Model;

use Model\AbstractModel;

class Settings extends AbstractModel {
    public function saveSubject($subject){
        $query = 'INSERT INTO subjects (id, subject, colorCssClass) VALUES (:id, :subject, :colorCssClass)';

        return $this->write($query, $subject);
    }

    public function deleteSubject($id) {
        $query = 'DELETE FROM subjects WHERE id=:id';

        $result = $this->delete($query, $id);

        echo json_encode($result);
    }

}