import express, { response } from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

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

let tiktokAuthToken;

const setTiktokAuthToken = async () => {
  try {
    const response = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
        method: "POST",
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY,
          client_secret: process.env.TIKTOK_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );
    const responseJSON = await response.json();
    console.log(responseJSON);
    if (responseJSON.access_token) {
      tiktokAuthToken = responseJSON.access_token;
    }
  } catch (err) {
    console.error(err);
  }
};

// ---------- API -----------

const getTiktokData = async () => {
  try {
    let paramStr = "fields=id,like_count";
    const url =
      "https://open.tiktokapis.com/v2/research/video/query/?" +
      new URLSearchParams(paramStr);
    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${tiktokAuthToken}`,
      },
    });
    const responseJSON = await response.json();
    let videoData = responseJSON.data;
    console.log(videoData);
  } catch (err) {
    console.log("failed getting data");
    console.error(err);
  }
};

setTiktokAuthToken();
getTiktokData();

// ---------- Start Server ------------

app.listen(8080, () => console.log("App running on port 8080"));
