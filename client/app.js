console.log("Test");

const hostPrefix = import.meta.env.VITE_HOST_PREFIX;
const hostLocation = import.meta.env.VITE_HOST_LOCATION;
const wsProtocol = import.meta.env.VITE_WS_HOST;

let selectedGame = "";

const commentContainer = document.getElementById("comments-element");

// ----------- Game Headings / Comments -----------

async function getHandler(endpoint, container) {
  const response = await fetch(hostPrefix + hostLocation + "/" + endpoint);
  const data = await response.json();
  console.log(endpoint, data);
  if (endpoint === "games") {
    container.innerHTML = "";
    data.forEach(function (game) {
      //clickable game titles
      const img = document.createElement("img");

      img.src = game.thumbnail_image;
      img.alt = "image of" + game.name;
      img.id = "titleImage" + game.rank;
      img.class = "titleImage";

      img.addEventListener("click", async function () {
        selectedGame = game.name;
        console.log("Selected game:", selectedGame);

        if (selectedGame !== "") {
          document.getElementById("comments").style.display = "block";
        }
        if (selectedGame === game.name) {
          const statsContainer = document.getElementById("stats-element");
          statsContainer.innerHTML = "";

          const titleStats = document.createElement("p");
          const currentPlayers = document.createElement("p");
          const peakPlayers = document.createElement("p");
          const descriptionStats = document.createElement("p");
          const developersStats = document.createElement("p");
          const publishersStats = document.createElement("p");
          const genreStats = document.createElement("p");

          titleStats.innerHTML = game.name;
          currentPlayers.innerHTML =
            "Currently playing: " + numberWithCommas(game.concurrent_in_game);
          peakPlayers.innerHTML =
            "Peak today: " + numberWithCommas(game.peak_in_game);
          descriptionStats.innerHTML = "Description: " + game.description;
          developersStats.innerHTML = "Developer: " + game.developers;
          publishersStats.innerHTML = "Publisher: " + game.publishers;
          genreStats.innerHTML = "Genre: " + game.genre;

          statsContainer.appendChild(titleStats);
          statsContainer.appendChild(currentPlayers);
          statsContainer.appendChild(peakPlayers);
          statsContainer.appendChild(descriptionStats);
          statsContainer.appendChild(developersStats);
          statsContainer.appendChild(publishersStats);
          statsContainer.appendChild(genreStats);

          const data = { twitch_id: game.twitch_id };
          console.log(data);
          // streams
          const streamResponse = await fetch(
            hostPrefix + hostLocation + "/twitchstream",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );
          console.log(streamResponse);
          const streamResponseData = await streamResponse.json();
          console.log(`From the server (twitchstream): `, streamResponseData);

          const twitchContainer = document.getElementById("twitch-element");
          streamResponseData.forEach(function (stream) {
            twitchContainer.innerHTML = "";
            const iframeStream = document.createElement("iframe");
            iframeStream.src = stream.embed_source;
            iframeStream.setAttribute("allowfullscreen", true);

            twitchContainer.appendChild(iframeStream);
          });
          // clips
          const clipsResponse = await fetch(
            hostPrefix + hostLocation + "/twitchclips",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );

          const clipsResponseData = await clipsResponse.json();
          console.log(`From the server (twitchclips): `, clipsResponseData);

          const clipsContainer = document.getElementById("clips-element");

          clipsResponseData.forEach(function (clip) {
            clipsContainer.innerHTML = "";
            const iframeClips = document.createElement("iframe");
            iframeClips.src = clip.embed_source;
            iframeClips.setAttribute("allowfullscreen", true);

            clipsContainer.appendChild(iframeClips);
          });
        }

        getHandler("comments", commentContainer);
      });

      container.appendChild(img);
    });
  }
  if (endpoint === "comments") {
    const response = await fetch(
      `${hostPrefix + hostLocation}/${endpoint}?game=${selectedGame}`
    );
    const data = await response.json();
    container.innerHTML = "";
    //comments
    data.forEach(function (dbData) {
      if (dbData.game === selectedGame) {
        const p = document.createElement("p");
        const delButton = document.createElement("button");
        const likeButton = document.createElement("button");
        const dislikeButton = document.createElement("button");

        p.textContent = `"${dbData.message}" - ${dbData.username}`;
        p.className = "comments-text";

        delButton.textContent = "Delete";
        delButton.className = "delete-button";
        delButton.setAttribute("aria-label", "Delete button");
        delButton.id = dbData.id;

        likeButton.textContent = "👍 " + dbData.likes;
        likeButton.className = "like-button";
        likeButton.setAttribute("aria-label", "Like button");
        likeButton.id = "like" + dbData.id;

        dislikeButton.textContent = "👎 " + dbData.dislikes;
        dislikeButton.className = "dislike-button";
        dislikeButton.setAttribute("aria-label", "Disike button");
        dislikeButton.id = "dislike" + dbData.id;

        container.appendChild(p);
        container.appendChild(delButton);
        container.appendChild(likeButton);
        container.appendChild(dislikeButton);
      }
    });
  }
}

// --------- Form Submission / Button Functions -----------

async function handleFormSubmit(event, formId, endpoint) {
  event.preventDefault();
  console.log(`${formId} submitted`);
  const form = document.getElementById(formId);
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  data.game = selectedGame;
  console.log(data);
  const response = await fetch(hostPrefix + hostLocation + "/" + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const responseData = await response.json();
  console.log(`From the server (${endpoint}): `, responseData);
  form.reset();
  getHandler(endpoint, commentContainer);
}

document.getElementById("comments").addEventListener("submit", (event) => {
  handleFormSubmit(event, "comments", "comments");
});

commentContainer.addEventListener("click", async function (event) {
  //delete
  if (event.target.classList.contains("delete-button")) {
    const id = event.target.id;
    console.log("Delete clicked for id: " + id);
    const response = await fetch(
      hostPrefix + hostLocation + "/comments/" + id,
      {
        method: "DELETE",
      }
    );
    const responseData = await response.json();
    console.log(`Server (delete): `, responseData);
    getHandler("comments", commentContainer);
  }
  //likes
  if (event.target.classList.contains("like-button")) {
    const id = event.target.id.replace("like", "");
    const likedEntries = JSON.parse(localStorage.getItem("likedEntries")) || [];
    const isLiked = likedEntries.includes(id);
    const action = isLiked ? "unlike" : "like";
    console.log("Like button pressed for id: " + id);
    const response = await fetch(
      hostPrefix + hostLocation + "/comments/" + id + "/like",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      }
    );

    const responseData = await response.json();
    console.log(`From the server (${action}): `, responseData);
    if (action === "like") {
      likedEntries.push(id);
    } else {
      const index = likedEntries.indexOf(id);
      if (index > -1) {
        likedEntries.splice(index, 1);
      }
    }
    localStorage.setItem("likedEntries", JSON.stringify(likedEntries));
    event.target.textContent = "👍 " + responseData.likes;
    getHandler("comments", commentContainer);
  }
  // dislikes
  if (event.target.classList.contains("dislike-button")) {
    const id = event.target.id.replace("dislike", "");
    const dislikedEntries =
      JSON.parse(localStorage.getItem("dislikedEntries")) || [];
    const isLiked = dislikedEntries.includes(id);
    const action = isLiked ? "undislike" : "dislike";
    console.log("Dislike button pressed for id: " + id);
    const response = await fetch(
      hostPrefix + hostLocation + "/comments/" + id + "/dislike",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      }
    );

    const responseData = await response.json();
    console.log(`From the server (${action}): `, responseData);
    if (action === "dislike") {
      dislikedEntries.push(id);
    } else {
      const index = dislikedEntries.indexOf(id);
      if (index > -1) {
        dislikedEntries.splice(index, 1);
      }
    }
    localStorage.setItem("dislikedEntries", JSON.stringify(dislikedEntries));
    getHandler("comments", commentContainer);
  }
});

// --------- Utils ----------

const formatter = new Intl.NumberFormat();
function numberWithCommas(number) {
  return formatter.format(number);
}

//  -------- Websocket ----------

const socket = new WebSocket(wsProtocol + hostLocation + "/comments");

socket.addEventListener("message", function (event) {
  const update = JSON.parse(event.data);
  switch (update.type) {
    case "newPost":
      console.log("New post added: ", update.data);
      getHandler("comments", commentContainer);
      break;
    case "updateLikes":
      console.log("Likes updated: ", update.data);
      getHandler("comments", commentContainer);
      break;
    case "updatedDislikes":
      console.log("Dislikes updated: ", update.data);
      getHandler("comments", commentContainer);
    case "deletePost":
      console.log("Post deleted: ", update.data.id);
      getHandler("comments", commentContainer);
      break;
    default:
      console.error("Unknown update recieved: ", update.type);
  }
});

// -------- Calling Initial Functions --------
getHandler("games", document.getElementById("games"));
getHandler("comments", commentContainer);
