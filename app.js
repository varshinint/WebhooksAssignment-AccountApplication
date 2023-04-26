const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const {schoolModel} = require('../student_data-master/models/schoolModel');
const {studentModel} = require('../student_data-master/models/studentModel');
const axios = require('axios');
const uuid = require('uuid');
const router = express.Router();
const app = express();
const PORT = 3100;
app.use(bodyParser.json());

const dbUrl = "mongodb://localhost:27017/student_data";
mongoose.connect(dbUrl);
mongoose.set('strictQuery', true);
app.get('/', (req, res) => {
    res.send('Welcome to Student Data Application');
});

app.post('/registerSchool', async (req, res) => {
    let data = req.body;
    const index = await  schoolModel.find().count();
    const schoolDetails = new schoolModel({
        schoolName: data.schoolName,
        schoolId: index+ 1,

    });
    let schoolData = await schoolDetails.save();

    res.send({
        result:schoolData
    });
});

app.post('/addWebhookEvent', async (req, res) => {
    let data = req.body;
    let schoolDetails = await  schoolModel.findOne({"schoolId": data.schoolId});
    if(schoolDetails){
        if(schoolDetails.webhookDetails == null){
            schoolDetails.webhookDetails =[];
        }
        schoolDetails.webhookDetails.push({
            eventName: data.eventName,
            endpointUrl: data.endpointUrl
        });

        schoolDetails = await schoolModel.findOneAndUpdate(
            {"schoolId": schoolDetails.schoolId}, schoolDetails,{
                returnOriginal: false
            })
    }else
    {
        console.log(" NO school")
    }


    res.send({
        result:schoolDetails
    });
});

// crud operations
app.post('/addStudent', async (req, res) => {
    let data = req.body;
    let studentData ={};
    let schoolDetails = await  schoolModel.findOne({"schoolId": data.schoolId});
    if(schoolDetails){
            
        const studentDetails = new studentModel({
            name: data.name,
            age:data.age,
            schoolId: data.schoolId,
            appSecretToken : uuid.v4()

        });
        try{
        studentData = await studentDetails.save();
        console.log(studentData.appSecretToken)

        let webhookUrl ="";
        for(let i=0; i<schoolDetails.webhookDetails.length; i++){
            if(schoolDetails.webhookDetails[i].eventName == "studentAdding")
            webhookUrl = schoolDetails.webhookDetails[i].endpointUrl;
        }
        if(webhookUrl != null && webhookUrl.length>0){
            // webhook response
            let result = await axios.post(webhookUrl, studentData,{
                headers: {
                    'Content-Type': 'application/json',
                    'CL-X-TOKEN': studentData.appSecretToken
                     
                }
            })
            console.log(studentData.appSecretToken)
            console.log(" webhook data send")
        }
        }
        catch(err){
            console.log("error found")
        }
    }else

    {
        console.log(" NO school")
    }

    res.send({
        result:"added succesfully: "+studentData.name
    });
});

app.get('/getAllStudent' , async(req,res)=>{
    
    try{
    const getAllStudentDetails=await studentModel.find()
    res.json(getAllStudentDetails)
    }
    catch(err){
            res.send('error'+ err)
    }
    
})


app.post('/deleteStudent' ,async(req, res)=>{
    try{
       const deleteStudent= await studentModel.findOneAndDelete({id:req.body.id})
       res.json('student deleted successfully :' + deleteStudent.id)
     }
     catch(err){
               res.send('error' +err)
           }

       
})

app.post('/updateStudent' ,async(req, res)=>{

        
    
    await studentModel.findOneAndUpdate({id:req.body.id},{
        name: req.body.name,
        age:req.body.age,
        
    },(err)=>{
             if(!err){
                 res.send("student updated successfully")
             }
             else{
                 res.send(err)
             }
    })

    
 })

app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}/`);
});

mongoose.connection.on('connected', ()=>{
    console.log('Mongoose default connection open to ' + dbUrl );
})