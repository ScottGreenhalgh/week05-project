console.log("Test");

const hostPrefix = import.meta.env.VITE_HOST_PREFIX;
const hostLocation = import.meta.env.VITE_HOST_LOCATION;
const wsProtocol = import.meta.env.VITE_WS_HOST;

let selectedGame = "";

const commentContainer = document.getElementById("comments-element");

async function getHandler(endpoint, container) {
  const response = await fetch(hostPrefix + hostLocation + "/" + endpoint);
  const data = await response.json();
  console.log(data);
  if (endpoint === "gamename") {
    container.innerHTML = "";
    data.forEach(function (game) {
      const p = document.createElement("p");
      p.id = "title" + game.id;
      p.className = "title";
      p.textContent = game.game;

      p.addEventListener("click", function () {
        selectedGame = game.game;
        console.log("Selected game:", selectedGame);
        getHandler("comments", commentContainer);
      });

      container.appendChild(p);
    });
  }
  if (endpoint === "comments") {
    const response = await fetch(
      `${hostPrefix + hostLocation}/${endpoint}?game=${selectedGame}`
    );
    const data = await response.json();
    console.log(data);
    container.innerHTML = "";
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

async function handleFormSubmit(event, formId, endpoint) {
  event.preventDefault();
  console.log(`${formId} submitted`);
  const form = document.getElementById(formId);
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
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
});

//  -------- Websocket ----------

const socket = new WebSocket(wsProtocol + hostLocation + "/comments");

socket.addEventListener("message", function (event) {
  const update = JSON.parse(event.data);
  console.log("Comments updated", update.data);
  getHandler("comments", commentContainer);
});

// -------- Calling Initial Functions --------
getHandler("gamename", document.getElementById("games"));
getHandler("comments", commentContainer);
