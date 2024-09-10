import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import * as api from './api.js';

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();
const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

// --------- Endpoints ----------

app.get("/", function (request, response) {
  response.json("root route");
});

app.get("/comments", async function (request, response) {
  try {
    const comments = await db.query("SELECT * FROM comments ORDER BY id ASC");
    response.status(200).json(comments.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to retrieve database" });
  }
});

app.post("/comments", async function (request, response) {
  try {
    const {
      game,
      username,
      message,
      reviewscore,
      likes = 0,
      dislikes = 0,
    } = request.body;
    const newComments = await db.query(
      "INSERT INTO comments (game, username, message, reviewscore, likes, dislikes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [game, username, message, reviewscore, likes, dislikes]
    );
    response.status(200).json(newComments);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to add entry" });
  }
});

app.delete("/comments/:id", async function (request, response) {
  const id = request.params.id;

  try {
    await db.query("DELETE FROM comments WHERE id = $1", [id]);
    response.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to delete entry" });
  }
});


// ---------- Start Server ------------

app.listen(8080, () => console.log("App running on port 8080"));
