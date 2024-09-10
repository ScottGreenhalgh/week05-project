import dotenv from "dotenv";

dotenv.config();

/* -------- TWITCH -------- */
let twitchAuthToken;
const twitchClientID = process.env.TWITCH_CLIENT_KEY;
const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;
const setTwitchAuthToken = async () => {
    try {
        const response = await fetch(
            "https://id.twitch.tv/oauth2/token", {
                method: "POST",
                body: new URLSearchParams({
                    "client_id": twitchClientID,
                    "client_secret": twitchClientSecret,
                    "grant_type": "client_credentials"
                })
            }
        );
        const responseJSON = await response.json();
        twitchAuthToken = responseJSON.access_token;
        validateTwitchAuthToken();
    }
    catch (err) {
        console.error(err);
    }
};

const validateTwitchAuthToken = async () => {
    if (twitchAuthToken.length < 1) {
        console.error("can't find your twitch auth token! is it set in your .env?")
        return;
    }
    
    try {
        const response = await fetch(
            "https://id.twitch.tv/oauth2/validate", {
                headers: {
                    "Authorization": `Bearer ${twitchAuthToken}`
                }
            }
        );
        const data = await response.json();
        console.log("successfully validated twitch auth token");
    }
    catch (err) {
        console.error(`twitch auth token failed to validate!\n ${err}`);
    }
}

const getTwitchGameInfo = async(gameName) => {
    /// usage: await getTwitchGameInfo("World of Warcraft");
    /// returns a single object
    try {
        let paramStr = `name=${gameName}`;
        const url = "https://api.twitch.tv/helix/games?" + new URLSearchParams(paramStr);
        const response = await fetch(url,{
            headers: {
                "Authorization": `Bearer ${twitchAuthToken}`,
                "Client-Id": twitchClientID
            }
        });
        const responseJSON = await response.json();
        console.log(responseJSON.data[0])
        return responseJSON.data[0];
    }
    catch (err) {
        console.log(`failed getting game info for ${gameName}`);
        console.error(err);
    }
};

const getTwitchGamesInfo = async(gamesList) => { 
    /// usage: await getTwitchGamesInfo(["Fortnite", "World of Warcraft", "League of Legends"]);
    /// returns an array of objects
    try {
        let paramStr;
        for (let i=0; i < gamesList.length; i++) {
            if (i>0) paramStr += "&";
            paramStr += "name=" + gamesList[i];
        }
        const url = "https://api.twitch.tv/helix/games?" + new URLSearchParams(paramStr);
        const response = await fetch(url,{
            headers: {
                "Authorization": `Bearer ${twitchAuthToken}`,
                "Client-Id": twitchClientID
            }
        });
        const responseJSON = await response.json();
        console.log(responseJSON.data);
        return responseJSON.data;
    }
    catch (err) {
        console.log(`failed getting games info for ${gamesList}`);
        console.error(err);
    }
};

const getTwitchGameStreams = async(gameName) => {
    // todo
};

const getTwitchGameClips = async(gameName) => {
    // todo
};


/* -------- STEAM -------- */
let steamAuthToken;
const steamClientID = process.env.STEAM_CLIENT_KEY;
const steamClientSecret = process.env.STEAM_CLIENT_SECRET;

const getSteamGamePlayerCount = async(gameID) => {
    try {
        let paramStr = `appid=${gameID}`;
        const url = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?"
            + new URLSearchParams(paramStr);
        const response = await fetch(url, {
            method: "GET"
        });
        const responseJSON = await response.json();
        console.log(responseJSON);
        return responseJSON;
    }
    catch(err) {
        console.log(`failed getting player count for game id: ${gameID}`);
        console.error(err);
    }
}

const addSteamGamesPlayerCount = (gamesArr) => {
    gamesArr.forEach(element => {
        element.playercount = getSteamGamePlayerCount(element.appid);
    });
    // console.log(gamesArr);
}

const getSteamTop10GamesPlayerCount = async() => {
    let top100 = await getSteamTop100GamesIn2Weeks();
    console.log(top100);
    // let top100PlayerCount = await addSteamGamesPlayerCount(top100);
    // console.log(top100PlayerCount);

};

export const getSteamTop10Games = () => {
    return [
        {
            name: "Counter-Strike 2",
            appid: 730,
            playercount: 1323574
        },
        {
            name: "Black Myth: Wukong",
            appid: 2358720,
            playercount: 841306
        },
        {
            name: "PUBG: BATTLEGROUNDS",
            appid: 578080,
            playercount: 650353
        },
        {
            name: "Dota 2",
            appid: 570,
            playercount: 598739
        },
        {
            name: "Banana",
            appid: 2923300,
            playercount: 369937
        },
        {
            name: "NARAKA: BLADEPOINT",
            appid: 1203220,
            playercount: 286380
        },
        {
            name: "Apex Legends™",
            appid: 1172470,
            playercount: 217522
        },
        {
            name: "Warhammer 40,000: Space Marine 2",
            appid: 2183900,
            playercount: 162600
        },
        {
            name: "Grand Theft Auto V",
            appid: 271590,
            playercount: 145084
        },
        {
            name: "Wallpaper Engine",
            appid: 431960,
            playercount: 155088
        }

    ]
};

/* -------- STEAM SPY -------- */

const getSteamTop100GamesIn2Weeks = async() => { 
    /* 
    steamspy no longer provides any data for playtime.
    so we can manually get this afterwards using the entries here.
    this data is potentially innacurate too though.
    another option could be to scrape the steam most played page for the data.
    (eww scraping) - (should avoid scraping if possible because isn't responsive to changes in the webpage that ois scraped)
    */
    
    /// returns an array of object
    try {
        const url = "https://steamspy.com/api.php?request=top100in2weeks";
        const response = await fetch(url,{
            method: "GET"
        });
        const responseJSON = await response.json();
        let responseArr = Object.entries(responseJSON);
        console.log(responseArr);
        // console.log(JSON.parse(responseJSON));
        // return JSON.parse(responseJSON);
    }
    catch (err) {
        console.error(err);
    }
};

/* -------- RUN -------- */
async function run() {
    // await setTwitchAuthToken();
    // await getTwitchGameInfo("World of Warcraft");
    // await getTwitchGamesInfo(["Fortnite", "World of Warcraft", "League of Legends"]);
    // await getSteamTop100GamesIn2Weeks();
    // await  getSteamGamePlayerCounts(2358720);
    await getSteamTop10GamesPlayerCount()
}
// run();



// let tiktokAuthToken;
// const setTiktokAuthToken = async () => {
//   try {
//     const response = await fetch(
//       "https://open.tiktokapis.com/v2/oauth/token/",
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//           "Cache-Control": "no-cache",
//         },
//         method: "POST",
//         body: new URLSearchParams({
//           client_key: process.env.TIKTOK_CLIENT_KEY,
//           client_secret: process.env.TIKTOK_CLIENT_SECRET,
//           grant_type: "client_credentials",
//         }),
//       }
//     );
//     const responseJSON = await response.json();
//     console.log(responseJSON);
//     if (responseJSON.access_token) {
//       tiktokAuthToken = responseJSON.access_token;
//     }
//   } catch (err) {
//     console.error(err);
//   }
// };


// ----- API GETS ------ //



// const getTiktokData = async () => {
//   try {
//     let paramStr = "fields=id,like_count";
//     const url =
//         "https://open.tiktokapis.com/v2/research/video/query/?"
//         + new URLSearchParams(paramStr);
//     const response = await fetch(url, {
//         method: 'POST',
//         headers: {
//             authorization: `bearer ${tiktokAuthToken}`,
//         },
//         body: `{
//             "query": {
//                 "and": [
//                     { "operation": "IN", "field_name": "region_code", "field_values": ["US", "CA"] },
//                     { "operation": "EQ", "field_name": "keyword", "field_values": ["hello world"] }
//                 ]
//             },
//             "start_date": "20240124",
//             "end_date": "20250124"
//             "max_count": 10
//         }`
//     });
//     const responseJSON = await response.json();
//     let videoData = responseJSON.data;
//     console.log("fqpoihrfwqeoihtf");
//     console.log(videoData);
//   } catch (err) {
//     console.log("failed getting data");
//     console.error(err);
//   }
// };
// setTiktokAuthToken();
// getTiktokData();