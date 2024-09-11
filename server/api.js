import dotenv from "dotenv";

dotenv.config();

/* -------- TWITCH -------- */
// https://dev.twitch.tv/docs/api/reference/

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
};

export const getTwitchGameInfoByIgdb = async(igdbID) => {
    /// usage: await getTwitchGameInfo("World of Warcraft");
    /// returns a single object with info about the game. Keys include: (id, name, box_art_url, igdb_id)
    try {
        let paramStr = `igdb_id=${igdbID}`;
        const url = "https://api.twitch.tv/helix/games?" 
        + new URLSearchParams(paramStr);
        const response = await fetch(url,{
            headers: {
                "Authorization": `Bearer ${twitchAuthToken}`,
                "Client-Id": twitchClientID
            }
        });
        const responseJSON = await response.json();
        return responseJSON.data;
    }
    catch (err) {
        console.log(`failed getting game info for ${igdbID}`);
        console.error(err);
    }
};

export const getTwitchGameInfoByName = async(gameName) => {
    /// usage: await getTwitchGameInfo("World of Warcraft");
    /// returns a single object with info about the game. Keys include: (id, name, box_art_url, igdb_id)
    try {
        let paramStr = `name=${gameName}`;
        const url = "https://api.twitch.tv/helix/games?" 
        + new URLSearchParams(paramStr);
        const response = await fetch(url,{
            headers: {
                "Authorization": `Bearer ${twitchAuthToken}`,
                "Client-Id": twitchClientID
            }
        });
        const responseJSON = await response.json();
        return responseJSON.data[0];
    }
    catch (err) {
        console.log(`failed getting game info for ${gameName}`);
        console.error(err);
    }
};

export const getTwitchGamesInfo = async(gamesList) => { 
    /// usage: await getTwitchGamesInfo(["Fortnite", "World of Warcraft", "League of Legends"]);
    /// returns an array of objects with info about the games. Keys include: (id, name, box_art_url, igdb_id)
    try {
        let paramStr = "";
        for (let i=0; i < gamesList.length; i++) {
            if (i>0) paramStr += "&";
            paramStr += "name=" + gamesList[i];
        }
        const url = "https://api.twitch.tv/helix/games?" 
            + new URLSearchParams(paramStr);
        const response = await fetch(url,{
            headers: {
                "Authorization": `Bearer ${twitchAuthToken}`,
                "Client-Id": twitchClientID
            }
        });
        const responseJSON = await response.json();
        return responseJSON.data;
    }
    catch (err) {
        console.log(`failed getting games info for ${gamesList}`);
        console.error(err);
    }
};

export const getTwitchGameClips = async(gameID, amount, days) => {
    /// usage: await getTwitchGameClips(*twitch game id*, *amount of clips to get*, *how many days in past to start getting from*)
    /// returns array of objects with clip data of top clips from chosen game. Keys include: (id, url, embed_url, broadcaster_id, broadcaster_name, title, thumbnail_url, duration, language) and more (console.log for full)
    try {
        const currentDate = new Date();
        let startDate = new Date(currentDate - (1000*60*60*24*days));
        startDate = startDate.toISOString();
        const url = "https://api.twitch.tv/helix/clips?"
        + new URLSearchParams({
            "game_id": gameID.toString(),
            "started_at": startDate,
            "first": `${amount}` // how many clips to get (max: 100)
        });
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${twitchAuthToken}`,
                "Client-Id": twitchClientID
            }
        });
        const responseJSON = await response.json();
        return responseJSON.data;
    }
    catch(err) {
        console.log(`failed to get twitch clips for game-id: ${gameID}`);
        console.error(err);
    }
};

export const getTwitchGameStreams = async(gameID, amount) => {
    /// usage: await getTwitchGameStreams(*twitch game id*, *amount of streams to get*)
    /// returns array of objects with stream data of english language streams of the chosen game that are currently live. Sorted by viewers high to low. Keys include: (id, user_name(THIS IS THE CHANNEL NAME), game name, title, thumbnail_url, tags, is_mature) and more (console.log for full)
    try {
        const url = "https://api.twitch.tv/helix/streams?"
        + new URLSearchParams({
            "game_id": gameID.toString(),
            "type": "live",
            "language": "en",
            "first": `${amount}` // how many clips to get (max: 100)
        });
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${twitchAuthToken}`,
                "Client-Id": twitchClientID
            }
        });
        const responseJSON = await response.json();
        return responseJSON.data;
    }
    catch(err) {
        console.log(`failed to get twitch streams for game-id: ${gameID}`);
        console.error(err);
    }
};


/* -------- STEAM -------- */
// https://steamapi.xpaw.me/#IStoreService/GetAppInfo

const steamClientKey = process.env.STEAM_CLIENT_KEY;

export const getSteamTop100ByCurrentPlayers = async() => {
    /// usage: await getSteamTop100ByCurrentPlayers()
    /// returns top 100 games as an array of objects, each with values for:
    /// (rank, appid, concurrent_in_game, peak_in_game)
    try {
        const url = "https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/"
        const response = await fetch(url, {
            method: "GET"
        });
        const responseJSON = await response.json();
        const gamesRanked = responseJSON.response.ranks;
        const lastUpdated = responseJSON.response.last_update; // return this later if we end up needing
        return gamesRanked;
    }
    catch(err) {
        console.log("failed to get top 100 games from steam");
        console.error(err);
    }
}

export const getSteamGameInfo = async(gameID) => {
    /// usage: await getSteamGameInfo(*appid for steam game*)
    /// returns a single object with all available information about
    /// the game. eg: name, description, platforms, images, trailers,
    /// ratings and more. Console.log the function to get a complete list
    try {
        let paramStr = `appids=${gameID}`
        const url = "https://store.steampowered.com/api/appdetails?" 
        + new URLSearchParams(paramStr);
        const response = await fetch(url, {
            method: "GET"
        });
        const responseJSON = await response.json();
        const gameInfo = responseJSON[gameID].data;
        return gameInfo;
    }
    catch(err) {
        console.log(`failed to get game name for game_id: ${gameID}`);
        console.error(err);
    }
}

export const getSteamTopGames = async(amount) => {
    /// usage: await getSteamTopGames(*top x number of games to fetch*)
    /// returns top x games as an array of objects, each with values for:
    /// (rank, appid, concurrent_in_game, peak_in_game)
    try {
        let top100 = await getSteamTop100ByCurrentPlayers();
        let topX = top100.slice(0,amount);
        return topX;
    }
    catch(err) {
        console.log(`failed to get top ${amount} games from steam`)
        console.error(err);
    }
}

export const getSteamGamePlayerCount = async(gameID) => {
    /// usage: await getSteamPlayerCount(*steam game id*)
    /// returns integer with current player count
    try {
        let paramStr = `appid=${gameID}`;
        const url = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?"
            + new URLSearchParams(paramStr);
        const response = await fetch(url, {
            method: "GET"
        });
        const responseJSON = await response.json();
        return responseJSON.response.player_count;
    }
    catch(err) {
        console.log(`failed getting player count for game id: ${gameID}`);
        console.error(err);
    }
}

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

/* -------- IGDB -------- */
// https://api-docs.igdb.com/#endpoints
export const getIgdbInfoFromSteamId = async (steamID) => {
    try {
        const url = "https://api.igdb.com/v4/games" 
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${twitchAuthToken}`,
                "Client-Id": twitchClientID,
                "Accept": "application/json"
            },
            body: `
                fields id, name, aggregated_rating, aggregated_rating_count, artworks, keywords, rating, websites;
                where (websites.url = "https://store.steampowered.com/app/${steamID}") | (websites.url = "https://store.steampowered.com/app/${steamID}/");
            `
        });
        const responseJSON = await response.json();
        return responseJSON[0];
    }
    catch(err) {
        console.log(`failed to get igdb_id for game_id: ${steamID}`);
        console.error(err);
    }
}


/* -------- OUTPUT FUNCTIONS -------- */
export const getGames = async () => {
    /// usage: await getGames()
    /// returns an array of objects for each of the top 10 games containing metadata for the game from all 3 platforms (steam, twitch & IGDB), the specific keys provided can be seen below or by console.log(await getGames())
    // SOME KEYS OF NOTE: names on each platform, description, images, genres, ratings, trailers, and websites. 

    const games = await getSteamTopGames(10); // get top 10 games
    for (const game of games) {

        game.steam_id = game.appid;
        delete game.appid;

        const gameInfo = await getSteamGameInfo(game.steam_id);
        // add data from steam here:
        game.name = gameInfo.name;
        game.description = gameInfo.short_description;
        game.description_full = gameInfo.detailed_description;
        game.thumbnail_image = gameInfo.capsule_image;
        game.background_image = gameInfo.background;
        game.bg_image_raw = gameInfo.background_raw;
        game.header_image = gameInfo.header_image;
        game.trailers = gameInfo.movies;
        game.release_date = gameInfo.releaase_date;
        game.genre = gameInfo.genres[0].description;
        game.developers = gameInfo.developers;
        game.publishers = gameInfo.publishers;

        const igdbInfo = await getIgdbInfoFromSteamId(game.steam_id);
        // add data from IGDB here:
        game.igdb_id = igdbInfo.id;
        game.igdb_name = igdbInfo.name;
        game.aggregated_rating = igdbInfo.aggregated_rating;
        game.aggregated_rating_count = igdbInfo.aggregated_rating_count;
        game.artworks = igdbInfo.artworks;
        game.keywords = igdbInfo.keywords;
        game.igdb_rating = igdbInfo.rating;
        game.website = igdbInfo.websites;
        
        const twitchInfo = await getTwitchGameInfoByName(game.igdb_name);
        // add data from twitch here:
        game.twitch_id = twitchInfo.id;
        game.twitch_name = twitchInfo.name;
        game.twitch_boxart = twitch.box_art_url;

    };

    return games;

}

export const getGameStreams = async (twitchGameID) => {
    /// usage: await getGameStreams(*twitch_id from getSteamTopGames*)
    /// returns: array of objects containing stream metadata for the 10 highest viewer english language streams currently live in the games category.
    // we are mostly concerned with the embed_source key here which can be used to create a twitch player embed as detailed here: https://dev.twitch.tv/docs/embed/video-and-clips/ we will need to append our own &parent tag for our domain though (and also allow that domain in twitch api! - atm i have only allowed http://localhost:5500)
    const streams = await getTwitchGameStreams(twitchGameID,10);
    for (const stream of streams) {
        stream.embed_source = `https://player.twitch.tv/?channel=${stream.user_name}`;
        stream.url = `https://www.twitch.tv/${stream.user_name}`;
    }
    return streams;
}

export const getGameClips = async (twitchGameID) => {
    /// usage: await getGameClips(*twitch_id from getSteamTopGames*)
    /// returns: array of objects containing clip metadata for the 10 most-viewed clips in the games category over the past 7 days.
    // we are mostly concerned with the embed_url key, which can be used to create a twitch player embed as detailed here: https://dev.twitch.tv/docs/embed/video-and-clips/ we will need to append our own &parent tag for our domain though (and also allow that domain in twitch api! - atm i have only allowed http://localhost:5500)
    const clips = await getTwitchGameClips(twitchGameID,10,7);
    return clips;
}

export const getGameStats = () => {
    // not sure if needed or if the data within getGames() is sufficient and workable. I can build out further if needed.
    //todo
}

/* -------- RUN -------- */
// async function run() {
//     await setTwitchAuthToken();


//     // getGames();
//     // getGameStreams(512923);
//     // getGameClips(512923);
// }
// run();