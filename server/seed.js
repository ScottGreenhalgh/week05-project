import pg from "pg";
import dotenv from "dotenv";
import * as api from "./api.js";
import { setTwitchAuthToken } from "./api.js";

dotenv.config();

const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

const templateGameGame = [
  "Counter Strike 2",
  "Black Myth: Wukong",
  "Dota 2",
  "PUBG: BATTLEGROUNDS",
  "Banana",
  "Apex Legends",
  "Grand Theft Auto V",
  "Warhammer 40m000: Space Marine 2",
  "Deadlock",
  "Rust",
];

const templateGame = [
  "Counter Strike 2",
  "Black Myth: Wukong",
  "Dota 2",
  "PUBG: BATTLEGROUNDS",
  "Counter Strike 2",
  "Counter Strike 2",
  "Grand Theft Auto V",
  "Black Myth: Wukong",
  "Dota 2",
  "PUBG: BATTLEGROUNDS",
];

const templateUsername = [
  "Bill",
  "Jeff",
  "Steve",
  "Tim",
  "Jimmy",
  "Connor",
  "Jack",
  "James",
  "Bob",
  "Sam",
];

const templateMessage = [
  "Bill's Sample message",
  "Jeff's Sample message",
  "Steve's Sample message",
  "Tim's Sample message",
  "Jimmy's Sample message",
  "Connor's Sample message",
  "Jack's Sample message",
  "James's Sample message",
  "Bob's Sample message",
  "Sam's Sample message",
];

const templateReview = [2, 4, 5, 5, 3, 1, 4, 1, 2, 5];

const defaultLikes = 0;

async function resetDb() {
  await db.query("TRUNCATE comments RESTART IDENTITY");
  await db.query("TRUNCATE gamename RESTART IDENTITY");
  for (let i = 0; templateGame.length > i; i++) {
    await db.query(
      "INSERT INTO comments (game, username, message, reviewscore, likes, dislikes) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        templateGame[i],
        templateUsername[i],
        templateMessage[i],
        templateReview[i],
        defaultLikes,
        defaultLikes,
      ]
    );
    await db.query("INSERT INTO gamename (game) VALUES ($1)", [
      templateGameGame[i],
    ]);
  }
}

resetDb();
console.log("resetting database");

// -------- API Integration ---------

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

await gamesFromAPi();

// Tables created with the following:

// CREATE TABLE comments (
//     id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
//     game TEXT,
//     username TEXT,
//     message TEXT,
//     reviewscore INT,
//     likes INT,
//     dislikes INT
//   );

// CREATE TABLE gamename (
//   id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
//   game TEXT
// );
