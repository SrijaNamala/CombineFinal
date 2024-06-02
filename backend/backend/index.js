const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { EmployeeModel, AcademicModel, FacultyModel, AdminModel, Message, AluminiModel, AluminiMessage, AluminiToStudentMessage } = require("./models/Employee");
const { ObjectId } = mongoose.Types;
const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(
    "mongodb+srv://purnanandigana:admin@cluster0.757ypqy.mongodb.net/employee?retryWrites=true&w=majority&appName=Cluster0"
);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // Search for user in EmployeeModel
    const employeeUser = await EmployeeModel.findOne({ username });

    if (employeeUser) {
        // User found in EmployeeModel, check password
        if (employeeUser.password === password) {
            res.json({
                status: "Success",
                Username: employeeUser.firstname,
                lastname: employeeUser.lastname,
                email: employeeUser.email,
                phn: employeeUser.ph,
                adr: employeeUser.adr,
                roll: employeeUser.username,
                id: employeeUser._id
            });
        } else {
            res.json("Password is incorrect");
        }
    } else {
        // User not found in EmployeeModel, search in FacultyModel
        const facultyUser = await FacultyModel.findOne({ email: username });

        if (facultyUser) {
            // User found in FacultyModel, check password
            if (facultyUser.password === password) {
                res.json({
                    status: "Success1",
                    name: facultyUser.name
                });
            } else {
                res.json("Password is incorrect");
            }
        } else {
            // User not found in EmployeeModel or FacultyModel, search in AlumniModel
            const alumniUser = await AluminiModel.findOne({ email: username });

            if (alumniUser) {
                // User found in AlumniModel, check password
                if (alumniUser.password === password) {
                    res.json({
                        status: "Success3",
                        name: alumniUser.name,
                        al_id: alumniUser._id
                    });
                    console.log("type:", alumniUser._id)
                } else {
                    res.json("Password is incorrect");
                }
            } else {
                res.json("No record exists");
            }
        }
    }
});


app.post("/register", (req, res) => {
    const { username, password, firstname, lastname, email, ph, adr } = req.body;
    const newUser = new EmployeeModel({
        username,
        password,
        firstname,
        lastname,
        email,
        ph,
        adr,
    });
    newUser
        .save()
        .then((user) => res.json(user))
        .catch((err) => res.status(500).json(err));
});
app.post("/addSubject", async (req, res) => {
    const { subject, year, concept, links, isChecked } = req.body;
    // console.log(AcademicModel);
    try {
        const newAcademics = new AcademicModel({
            subject,
            year,
            concept,
            links,
            isChecked,
        });
        await newAcademics.save();
        res.status(200).send({ message: "Subject added" });
    } catch (e) {
        res.status(500).send({ message: "Internal server error" });
    }
});
app.get("/subjects", async (req, res) => {
    const year = req.query.year; // Access year from query parameters
    try {
        // Fetch subjects from the database based on the year
        const subjects = await AcademicModel.distinct("subject", { year: year });
        res.json({ subjects: subjects });
        // console.log(subjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get("/concepts", async (req, res) => {
    const subject = req.query.subject; // Access year from query parameters
    try {
        // Fetch subjects from the database based on the year
        const concepts = await AcademicModel.distinct("concept", {
            subject: subject,
        });
        res.json({ concepts: concepts });
        // console.log(concepts);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get("/links", async (req, res) => {
    const { subject, concept } = req.query; // Access subject and concept from query parameters
    try {
        // Fetch links from the database based on the subject and concept
        const links = await AcademicModel.findOne(
            { subject, concept },
            { links: 1 }
        );
        if (links) {
            res.json({ links: links.links });
            // console.log(links.links);
        } else {
            res.status(404).json({
                error: "Links not found for the specified subject and concept",
            });
        }
    } catch (error) {
        console.error("Error fetching links:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.post("/updateLinks", async (req, res) => {
    const { subject, concept, links } = req.body;
    try {
        // Update the links in the database for the specified subject and concept
        await AcademicModel.updateOne({ subject, concept }, { links });
        res.json({ message: "Links updated successfully!" });
    } catch (error) {
        console.error("Error updating links:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.post("/updateLinkStatus", async (req, res) => {
    const { subject, concept, isChecked } = req.body;
    try {
        // Update the links in the database for the specified subject and concept
        await AcademicModel.updateOne({ subject, concept }, { isChecked });
        res.json({ message: "status updated successfully!" });
    } catch (error) {
        console.error("Error updating links:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.post("/updateStudentLinkStatus", async (req, res) => {
    const { subject, concept, isChecked, roll, year } = req.body;
    try {
        // Find the employee document based on the roll (username)
        let employee = await EmployeeModel.findOne({ username: roll });
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // Find the index of the academicData entry to update
        const index = employee.academicData.findIndex(
            (data) =>
                data.year === String(year) &&
                data.subject === subject &&
                data.concept === concept
        );

        // If the academicData entry exists, update it
        if (index !== -1) {
            employee.academicData[index].isChecked = isChecked;
        } else {
            // If the entry doesn't exist, add a new one
            employee.academicData.push({
                year: year,
                subject: subject,
                concept: concept,
                isChecked: isChecked,
            });
        }

        // Save the updated document
        await employee.save();

        res.json({ message: "Academic data updated successfully!" });
    } catch (error) {
        console.error("Error updating academic data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/concepts1", async (req, res) => {
    const subject = req.query.subject; // Access subject from query parameters
    try {
        // Check if subject is null or undefined
        if (!subject) {
            return res.status(400).json({ error: "Subject parameter is missing" });
        }

        // Fetch concepts from the database based on the subject
        const concepts = await AcademicModel.find({ subject: subject }); // Assuming ConceptModel is your Mongoose model

        // Transform the fetched concepts into the expected format
        const formattedConcepts = concepts.map((concept) => ({
            name: concept.concept,
            links: concept.links,
            isChecked: concept.isChecked,
        }));

        res.json({ concepts: formattedConcepts }); // Send the formatted concepts as JSON response
    } catch (error) {
        console.error("Error fetching concepts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get("/year", async (req, res) => {
    const year = req.query.year;
    const roll = req.query.roll;

    try {
        // Check if year or roll is null or undefined
        if (!year || !roll) {
            return res.status(400).json({ error: "Year or roll parameter is missing" });
        }

        // Fetch academic data from the database based on the year
        const employees = await EmployeeModel.find({}); // Retrieve all documents

        // Filter employees based on roll number
        const employee = employees.find(emp => emp.username === roll);

        if (!employee) {
            return res.status(404).json({ error: "Employee with the specified roll number not found" });
        }

        // Filter academicData array within the found employee document to find objects with the specified year
        const filteredAcademicData = {
            _id: employee._id,
            academicData: employee.academicData.filter(data => data.year === year)
        };

        res.json(filteredAcademicData);
    } catch (error) {
        console.error("Error fetching academic data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
app.get("/roll", async (req, res) => {

    const roll = req.query.roll;

    try {
        // Check if year or roll is null or undefined
        if (!roll) {
            return res.status(400).json({ error: "Year or roll parameter is missing" });
        }

        // Fetch academic data from the database based on the year
        const employees = await EmployeeModel.find({}); // Retrieve all documents

        // Filter employees based on roll number
        const employee = employees.find(emp => emp.username === roll);

        if (!employee) {
            return res.status(404).json({ error: "Employee with the specified roll number not found" });
        }

        // Filter academicData array within the found employee document to find objects with the specified year
        const filteredAcademicData = {
            _id: employee._id,
            academicData: employee.academicData
        };

        res.json(filteredAcademicData);
    } catch (error) {
        console.error("Error fetching academic data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
app.post("/add-faculty", (req, res) => {
    const { name, email, password, subject } = req.body;
    const newFaculty = new FacultyModel({
        name,
        email,
        password,
        subject,
    });
    newFaculty
        .save()
        .then((faculty) => res.json(faculty))
        .catch((err) => res.status(500).json(err));
});
app.post("/adminlogin", async (req, res) => {
    const { email, password } = req.body;
    // console.log(email)
    try {
        const admin = await AdminModel.findOne({ email });
        // console.log(admin)
        if (admin) {
            if (admin.password === password) {
                res.json({
                    status: "Success",
                    message: "Admin login successful",
                });
            } else {
                res.status(401).json({ error: "Invalid password" });
            }
        } else {
            res.status(404).json({ error: "Admin not found" });
        }
    } catch (error) {
        console.error("Error finding admin:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.post('/messages', async (req, res) => {
    const { content, sender } = req.body;

    try {
        const newMessage = new Message({
            content,
            sender
        });
        await newMessage.save(); // Save message to database

        res.status(201).json({ message: 'Message stored successfully' });
    } catch (error) {
        console.error('Error storing message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/fetch-messages', async (req, res) => {
    try {
        const messages = await Message.find(); // Fetch all messages from the database
        res.status(200).json(messages);
        // console.log("messages", messages)
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/students', async (req, res) => {
    try {
        const students = await EmployeeModel.find()
        res.status(200).json(students)
        // console.log(students)
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})
app.post('/alumini', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const alumini = new AluminiModel({ name, email, password });
        await alumini.save();
        res.status(201).json(alumini);
    } catch (error) {
        console.error('Error adding alumini:', error);
        res.status(500).json({ error: 'Error adding alumini' });
    }
});
app.get('/aluminiselect', async (req, res) => {
    try {
        // Implement logic to fetch users from AluminiModel
        // Example:
        const users = await AluminiModel.find({}); // Fetch all users from AluminiModel
        res.json(users);
        // console.log("usersss", users)
    } catch (error) {
        console.error('Error fetching users from AluminiModel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/studentselect', async (req, res) => {
    try {
        // Implement logic to fetch users from EmployeeModel
        // Example:
        const users = await EmployeeModel.find({}); // Fetch all users from EmployeeModel
        res.json(users);
    } catch (error) {
        console.error('Error fetching users from EmployeeModel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/student-to-alumini-message', async (req, res) => {
    const { sender, receiver, content } = req.body;

    try {
        const newMessage = new AluminiMessage({
            sender,
            receiver,
            content
        });
        await newMessage.save(); // Save message to database

        res.status(201).json({ message: 'Message stored successfully' });
    } catch (error) {
        console.error('Error storing message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/alumini-to-student-message', async (req, res) => {
    const { sender, receiver, content } = req.body;

    try {
        const newMessage = new AluminiToStudentMessage({
            sender,
            receiver,
            content
        });
        await newMessage.save(); // Save message to database

        res.status(201).json({ message: 'Message stored successfully' });
    } catch (error) {
        console.error('Error storing message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/getmessages1/:sender/:receiver/:IsloggedIn', async (req, res) => {
    const { sender, receiver, IsloggedIn } = req.params;
    console.log("islooded?", IsloggedIn)
    if (IsloggedIn === "true") {
        try {
            // Find messages where sender and receiver match the specified IDs
            const messages = await AluminiMessage.find({ sender, receiver });
            ;
            // Return the messages
            res.status(200).json(messages);
            console.log(messages)
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    else {
        try {
            // Find messages where sender and receiver match the specified IDs
            const messages = await AluminiToStudentMessage.find({ sender, receiver });
            ;
            // Return the messages
            res.status(200).json(messages);
            console.log(messages)
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

});
app.get('/getmessages2/:sender/:receiver/:IsloggedIn', async (req, res) => {
    const { sender, receiver, IsloggedIn } = req.params;

    if (IsloggedIn === "true") {
        try {
            // Find messages where sender and receiver match the specified IDs
            const messages1 = await AluminiToStudentMessage.find({ sender, receiver });
            ;
            // Return the messages
            res.status(200).json(messages1);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    else {
        try {
            // Find messages where sender and receiver match the specified IDs
            const messages1 = await AluminiMessage.find({ sender, receiver });
            ;
            // Return the messages
            res.status(200).json(messages1);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});


app.get('/alumni-messages/:alumniId', async (req, res) => {
    let alumniId = req.params.alumniId;

    try {
        // Convert alumniId to ObjectId
        const objectIdAlumniId = new ObjectId(alumniId);

        // Find all distinct senders who have sent messages to the logged-in alumnus
        const integerAlumniId = parseInt(alumniId);
        // console.log("ebde", integerAlumniId)
        // Find all distinct senders who have sent messages to the logged-in alumnus
        const students = await AluminiMessage.distinct('sender', { receiver: alumniId });



        // Fetch user details based on sender IDs
        const users = await EmployeeModel.find({ _id: { $in: students } });
        console.log("senders", users)
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3004, () => {
    console.log("server is running");
});
