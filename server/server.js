import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import expressWs from "express-ws";
import * as api from "./api.js";

const app = express();
expressWs(app);
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

app.put("/comments/:id/like", async function (request, response) {
  const id = request.params.id;
  const { action } = request.body;

  try {
    const query =
      action === "like"
        ? "UPDATE comments SET likes = likes + 1 WHERE id = $1 RETURNING *"
        : "UPDATE comments SET likes = likes - 1 WHERE id = $1 RETURNING *";

    const updatedComments = await db.query(query, [id]);
    const updatedEntry = updatedComments.rows[0];
    response.status(200).json(updatedEntry);
    sendUpdate({ type: "updateLikes", data: updatedEntry });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to update likes" });
  }
});

app.put("/comments/:id/dislike", async function (request, response) {
  const id = request.params.id;
  const { action } = request.body;

  try {
    const query =
      action === "dislike"
        ? "UPDATE comments SET dislikes = dislikes + 1 WHERE id = $1 RETURNING *"
        : "UPDATE comments SET dislikes = dislikes - 1 WHERE id = $1 RETURNING *";

    const updatedComments = await db.query(query, [id]);
    const updatedEntry = updatedComments.rows[0];
    response.status(200).json(updatedEntry);
    sendUpdate({ type: "updateDislikes", data: updatedEntry });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to update dislikes" });
  }
});

// ---------- Websocket ------------

let connectedClients = [];

app.ws("/comments", function (websocket, request) {
  console.log("New client connection");
  connectedClients.push(websocket);

  websocket.on("close", function () {
    console.log("A Client disconnected");
    connectedClients = connectedClients.filter(
      (client) => client !== websocket
    );
  });
});

function sendUpdate(data) {
  connectedClients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

console.log(api.getSteamTop10Games());

// ---------- Start Server ------------

app.listen(8080, () => console.log("App running on port 8080"));
