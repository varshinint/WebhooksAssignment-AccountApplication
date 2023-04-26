const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: String,
    age:Number,
    schoolId: Number,
    appSecretToken : String
   
});

const studentModel = mongoose.model('students', studentSchema);

exports.studentModel = studentModel;
