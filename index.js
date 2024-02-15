const express = require("express");
const axios = require("axios");

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
app.use(express.json());

// API keys
let apiKeyList = JSON.parse(process.env.API_KEY_LIST || "{}") || {
  "my-api-key-1": ["new-user"],
  "my-api-key-2": ["new-user", "callback"],
};

// Callback subscribers
let subscribers = JSON.parse(process.env.SUBSCRIBERS || "[]") || [
  {
    operation: "new-user",
    url: "http://127.0.0.1:3000/callback",
    apiKey: "my-api-key-2",
  },
];

// ========= InMemory database =========

let users = [];

// ========= Middleware =========

// Middleware for API key authentication
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["api-key"];
  const path = req.path.substring(1);

  if (!apiKey) {
    return res.status(401).json({ error: "API key is required" });
  }

  if (apiKeyList[apiKey] && apiKeyList[apiKey].includes(path)) {
    // Continue to the next middleware or route
    next();
  } else {
    return res.status(403).json({ error: "Unauthorized access" });
  }
};

// ========= API Endpoints =========

app.get("/users", authenticateApiKey, (req, res) => {
  res.json({ users });
});

app.post("/users", authenticateApiKey, (req, res) => {
  let user = req.body;
  users.push(user);
  console.log("New user added");
  doCallback("new-user", user);
  res.json({ user });
});

app.post("/callback", authenticateApiKey, (req, res) => {
  console.log(req.body);

  switch (req.body.operation) {
	case "new-user":
	  console.log("New user recieved via callback");
	  users.push(req.body.data);
	  break;
  }

  res.json({ success: true, message: "Callback successful" });
});

// ========= Callback operadions =========

async function send(subscriber, payload) {
  try {
    const response = await axios.post(subscriber.url, payload, {
      headers: { "api-key": subscriber.apiKey },
    });
    // Log the response to the console
    // console.log("External API Response:", response.data);
  } catch (error) {
    console.error("External API Error:", error.message);
  }
}

// Method to subscribe to a callback
function doCallback(operation, data) {
  for (let i = 0; i < subscribers.length; i++) {
    let subscriber = subscribers[i];
    if (subscriber.operation !== operation) continue;
    send(subscriber, { operation, data });
  }
}

// ========= Swagger =========
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ========= Main =========

// Start the server
app.listen(3000, () => {
  console.log(`Server is running`);
});
