import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios"

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BookDB",
  password: "Yourpassword",
  port: 5432,
});

const app = express();
app.set('view engine', 'ejs');
const port = 3000;

db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let books = [
    {id: 1, title: "The sun also rises", author: "Ernest Hemingway", review: "Pretty good", date: "2017-02-20", rating: 5 },
    {id: 2, title: "The Idiot", author: "Fyodor Dostoevsky", review: "Amazing", date: "2015-05-20", rating: 10 }
];


app.get("/", async (req, res) => {
    const sort = req.query.sort || 'id';  // Default sort by id if no sort specified
    let orderBy;

    switch (sort) {
        case 'title':
            orderBy = 'title ASC';
            break;
        case 'newest':
            orderBy = 'date DESC';  // Assuming 'date' is the column name
            break;
        case 'rating':
            orderBy = 'rating DESC';
            break;
        default:
            orderBy = 'id'; // Default ordering
    }

    try {
        const result = await db.query(`SELECT * FROM books ORDER BY ${orderBy}`);
        const books = result.rows.map(book => ({
            ...book,
            coverUrl: book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg` : '/assets/null-image.jpeg'
        }));
        res.render("index.ejs", { books: books });
    } catch (error) {
        console.error("Error querying the database:", error);
        res.status(500).send("Server error");
    }
});


app.get('/new', (req, res) => {
    res.render('new'); // Assuming 'new' is your EJS file for adding a new book
});

app.post("/add", async (req, res) => {
    try {
        const { title, author, review, date, rating, isbn } = req.body;
        await db.query(
            "INSERT INTO books (title, author, review, date, rating, isbn) VALUES ($1, $2, $3, $4, $5, $6)",
            [title, author, review, date, rating, isbn]
        );
        res.redirect("/");
    } catch (error) {
        console.error("Error adding new book:", error);
        res.status(500).send("Failed to add new book");
    }
});


app.get("/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
        if (result.rows.length > 0) {
            const book = result.rows[0];
            res.render("edit", { book: book });  // Pass the book data to the EJS template
        } else {
            res.status(404).send("Book not found");
        }
    } catch (error) {
        console.error("Error accessing book data:", error);
        res.status(500).send("Server error while accessing the book data");
    }
});

app.post("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, review, date, rating, isbn } = req.body;

        await db.query(
            "UPDATE books SET title = $1, author = $2, review = $3, date = $4, rating = $5, isbn = $6 WHERE id = $7",
            [title, author, review, date, rating, isbn, id]
        );

        res.redirect("/");
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).send("Failed to update the book");
    }
});

app.post("/delete/:id", async (req, res) => {

    try {
        const { id } = req.params;
        const result = await db.query("DELETE FROM books WHERE id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).send("Book not found");
        }
        res.redirect("/");
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).send("Failed to delete book");
    }
});





app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });