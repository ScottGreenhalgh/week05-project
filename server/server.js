import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import expressWs from "express-ws";
import * as api from "./api.js";
import { setTwitchAuthToken } from "./api.js";

const app = express();
expressWs(app);
app.use(cors());
app.use(express.json());
dotenv.config();
const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

// --------- Comments Endpoints ----------

app.get("/", function (request, response) {
  response.json("root route");
});

app.get("/comments", async function (request, response) {
  const { game } = request.query;
  let query = "SELECT * FROM comments";
  let params = [];

  if (game) {
    query += " WHERE game = $1 ORDER BY id ASC";
    params = [game];
  } else {
    query += " ORDER BY id ASC";
  }

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
      reviewscore = 0,
      likes = 0,
      dislikes = 0,
    } = request.body;
    const newComments = await db.query(
      "INSERT INTO comments (game, username, message, reviewscore, likes, dislikes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [game, username, message, reviewscore, likes, dislikes]
    );
    const newEntry = newComments.rows[0];
    response.status(200).json(newEntry);
    sendUpdate({ type: "newPost", data: newEntry });
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
    sendUpdate({ type: "deletePost", data: { id } });
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

// ---------- Gamename Endpoints ----------

app.get("/games", async function (request, response) {
  try {
    const comments = await db.query("SELECT * FROM games ORDER BY rank ASC");
    response.status(200).json(comments.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to retrieve database" });
  }
});

// -------- API Integration / Endpoints ---------

async function gamesFromAPi() {
  await setTwitchAuthToken();

  const apigames = await api.getGames();
  console.log(apigames);
  await db.query("TRUNCATE games RESTART IDENTITY");
  apigames.forEach(async function (games) {
    await db.query(
      "INSERT INTO games (rank, concurrent_in_game, peak_in_game, steam_id, name, description, thumbnail_image, background_image, bg_image_raw, header_image, genre, developers, publishers, igdb_id, igdb_name, twitch_id, twitch_name, twitch_boxart) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
      [
        games.rank,
        games.concurrent_in_game,
        games.peak_in_game,
        games.steam_id,
        games.name,
        games.description,
        games.thumbnail_image,
        games.background_image,
        games.bg_image_raw,
        games.header_image,
        games.genre,
        games.developers[0],
        games.publishers[0],
        games.igdb_id,
        games.igdb_name,
        games.twitch_id,
        games.twitch_name,
        games.twitch_boxart,
      ]
    );
  });
}

gamesFromAPi();

app.post("/twitchstream", async function (request, response) {
  const { twitch_id } = request.body;

  try {
    const streams = await api.getGameStreams(twitch_id);
    response.status(200).json(streams);
    console.log(streams);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to retrieve streams" });
  }
});

app.post("/twitchclips", async function (request, response) {
  const { twitch_id } = request.body;

  try {
    const streams = await api.getGameClips(twitch_id);
    response.status(200).json(streams);
    console.log(streams);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to retrieve clips" });
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

// ---------- Start Server ------------

app.listen(8080, () => console.log("App running on port 8080"));
