import { allSubjects } from "../index.js";
import AbstractModel from "./AbstractModel.js";

export default class Settings extends AbstractModel{
    
    constructor(){
        super();
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