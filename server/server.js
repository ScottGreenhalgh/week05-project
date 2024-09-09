import express, { response } from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();
const db = new pg.Pool({
  connectionString: process.env.DB_URL,
});

const tiktokClientKey = "sbaw8lr00nutwe3ayj";
const tiktokClientSecret = "WBpuaSh06S2z5Hxs9n0keXzE9eB81wPo";

let tiktokAuthToken;

const setTiktokAuthToken = async () => {
  try {
    const response = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        body: new URLSearchParams({
          client_key: tiktokClientKey,
          client_secret: tiktokClientSecret,
          grant_type: "client_credentials",
        }),
      }
    );
    const responseJSON = await response.json();
    tiktokAuthToken = responseJSON.access_token;
    console.log(tiktokAuthToken);
  } catch (err) {
    console.error(err);
  }
};

setTiktokAuthToken();

app.get("/", function (request, response) {
  response.json("root route");
});

app.listen(8080, () => console.log("App running on port 8080"));
