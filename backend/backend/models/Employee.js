const mongoose = require('mongoose')

const EmployeeSchema = new mongoose.Schema({
    username: String,
    password: String,
    firstname: String,
    lastname: String,
    email: String,
    ph: String,
    adr: String,
    academicData: [{
        year: String,
        subject: String,
        concept: String,
        isChecked: [Boolean]
    }]

})
const AcademicSchema = new mongoose.Schema({
    subject: String,
    year: String,
    concept: String,
    links: [String],
    isChecked: [Boolean]
});
const facultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Ensure email is unique
    },
    password: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    }
})
const adminSchema = new mongoose.Schema({
    email: String,
    password: String
})
const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now // Set default value to current time when message is created
    }
});
const AluminiSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})
const AluminiMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeModel' // Reference to EmployeeModel for students
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AluminiModel' // Reference to AlumniModel for alumni
    },
    content: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});
const AluminiToStudentMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AluminiModel' // Reference to AluminiModel for alumni
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeModel' // Reference to EmployeeModel for students
    },
    content: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});


// Create the Message model
const AluminiToStudentMessage = mongoose.model('AluminiMessage', AluminiToStudentMessageSchema);
const AluminiMessage = mongoose.model('StudentMessage', AluminiMessageSchema);
const Message = mongoose.model('Message', messageSchema);
const AdminModel = mongoose.model('admin', adminSchema)
const FacultyModel = mongoose.model('Faculty', facultySchema);
const EmployeeModel = mongoose.model("logins", EmployeeSchema);
const AcademicModel = mongoose.model("Academics", AcademicSchema);
const AluminiModel = mongoose.model('alumini', AluminiSchema)
module.exports = { EmployeeModel, AcademicModel, FacultyModel, AdminModel, Message, AluminiModel, AluminiMessage, AluminiToStudentMessage };