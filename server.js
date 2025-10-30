const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------
// 1. MySQL Connection Pool - UPDATE YOUR CREDENTIALS!
// ---------------------------
const pool = mysql.createPool({
    host: 'localhost',
    user: 'Nupur',     // <-- CHANGE THIS
    password: 'Nupurlm@3108', // <-- CHANGE THIS
    database: 'studentdb',  // <-- CHANGE THIS (e.g., LibraryDB)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Successfully connected to database as id ' + connection.threadId);
    connection.release();
});

// ---------------------------
// 2. API Routes (Endpoints for INSERT/CREATE)
// ---------------------------

// Utility function for insertion
const insertEntry = (tableName, fields, res) => {
    // Create SQL string like: INSERT INTO TableName (col1, col2) VALUES (?, ?)
    const columns = Object.keys(fields).join(', ');
    const placeholders = Object.keys(fields).map(() => '?').join(', ');
    const values = Object.values(fields);

    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

    pool.query(sql, values, (error, results) => {
        if (error) {
            console.error(`Error adding to ${tableName}:`, error);
            // Send a specific error message back to the frontend
            return res.status(500).json({ error: `Failed to add entry. Details: ${error.code}` });
        }
        res.status(201).json({ message: `${tableName} added successfully!`, id: results.insertId });
    });
};

// A. POST New Branch
app.post('/api/branches', (req, res) => {
    insertEntry('Branch', req.body, res);
});

// B. POST New Librarian
app.post('/api/librarians', (req, res) => {
    insertEntry('Librarian', req.body, res);
});

// C. POST New Book
app.post('/api/books', (req, res) => {
    // Ensure the year is handled correctly
    const bookData = {
        Title: req.body.Title,
        ISBN: req.body.ISBN,
        Publisher: req.body.Publisher,
        Year_of_publication: req.body.Year_of_publication,
        Edition: req.body.Edition,
        Branch_ID: req.body.Branch_ID
    };
    insertEntry('Book', bookData, res);
});

// D. POST New Author
app.post('/api/authors', (req, res) => {
    insertEntry('Author', req.body, res);
});

// E. POST New Member (Existing logic, slightly cleaner)
app.post('/api/members', (req, res) => {
    // Note: Date_of_membership is set to CURDATE() in the SQL, so we don't include it here
    const memberData = {
        Name: req.body.Name,
        Address: req.body.Address,
        Contact_information: req.body.Contact_information,
        Date_of_membership: new Date().toISOString().slice(0, 10), // Send today's date
        Branch_ID: req.body.Branch_ID
    };
    const sql = `INSERT INTO Member (Name, Address, Contact_information, Date_of_membership, Branch_ID) 
                 VALUES (?, ?, ?, ?, ?)`; 
    const values = [memberData.Name, memberData.Address, memberData.Contact_information, memberData.Date_of_membership, memberData.Branch_ID];
    
    pool.query(sql, values, (error, results) => {
        if (error) {
            console.error('Error creating member:', error);
            return res.status(500).json({ error: `Failed to add entry. Details: ${error.code}` });
        }
        res.status(201).json({ message: 'Member added successfully!', memberId: results.insertId });
    });
});

// ---------------------------
// 3. API Routes (Endpoints for READ/GET)
// ---------------------------

// F. GET All Books (Existing logic)
app.get('/api/books', (req, res) => {
    const sql = 'SELECT Book_ID, Title, ISBN, Publisher, Year_of_publication, Edition FROM Book';
    
    pool.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});

// ---------------------------
// 4. Server Start
// ---------------------------
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Frontend accessible at http://localhost:${port}/index.html`);
});