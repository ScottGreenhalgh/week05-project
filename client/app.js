console.log("Test");

const commentContainer = document.getElementById("comment-container");

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

getHandler("comments", commentContainer);
