import { allSubjects } from "../index.js";
import AbstractModel from "./AbstractModel.js";
import Fn from "../inc/utils.js"

export default class Settings extends AbstractModel{
    
    constructor(){
        super();
    }

    saveSubject(subject) {
        subject.id = Fn.generateId(allSubjects);
        
        allSubjects.push(subject);
        
        this.makeAjaxQuery('settings', 'saveSubject', subject);
    }

    deleteSubject(id){
        
        for (let i = 0; i < allSubjects.length; i++){
            if (allSubjects[i].id == id){
                allSubjects.splice(i,1);

                this.makeAjaxQuery('settings', 'deleteSubject', {'id': id});

                return;
            }
        }
    }
}