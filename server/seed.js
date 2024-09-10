import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

const templateGame = [
  "Counter Strike 2",
  "Black Myth: Wukong",
  "Dota 2",
  "PUBG: BATTLEGROUNDS",
  "Banana",
  "Apex Legends",
];

const templateUsername = ["Bill", "Jeff", "Steve", "Tim", "Jimmy", "Connor"];

const templateMessage = [
  "Bill's Sample message",
  "Jeff's Sample message",
  "Steve's Sample message",
  "Tim's Sample message",
  "Jimmy's Sample message",
  "Connor's Sample message",
];

const templateReview = [2, 4, 5, 5, 3, 1];

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
      templateGame[i],
    ]);
  }
}

resetDb();
console.log("resetting database");

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
