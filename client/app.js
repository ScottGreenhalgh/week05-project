console.log("Test");

const hostPrefix = import.meta.env.VITE_HOST_PREFIX;
const hostLocation = import.meta.env.VITE_HOST_LOCATION;

const commentContainer = document.getElementById("comment-element");

async function getHandler(endpoint, container) {
  const response = await fetch(hostPrefix + hostLocation + "/" + endpoint);
  const data = await response.json();
  console.log(data);
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

const games = ["counter strike 2", "black myth: wukong", "dota 2", "pugb: battlegrounds", "banana", "apex legends"];

for(let i = 0; games.length > i; i++) {
  console.log(games[i]);
} 
