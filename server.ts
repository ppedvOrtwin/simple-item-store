import express from "express";
import fs from "fs/promises";
import cors from "cors";
import WebSocket from "ws";

const fileName = "./items.json";
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

let items: { id: string }[] = [];

// Function to load items from the file
async function loadItems() {
  try {
    const data = await fs.readFile(fileName, { encoding: "utf8" });
    items = JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, initialize an empty array
    items = [];
  }
}

async function saveItems() {
  await fs.writeFile(fileName, JSON.stringify(items, null, 2));
  broadcastItems(items);
}

// Load items when the server starts
loadItems();

// Route to get all items
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Route to get all items
app.get("/items", (req, res) => {
  res.send(items);
});

// Route to add a new item
app.post("/item", async (req, res) => {
  const newItem = req.body;
  console.log("creating", JSON.stringify(newItem));
  items.push(newItem);
  await saveItems();
  res.status(201).send(newItem);
});

app.put("/item/:id", async (req, res) => {
  const newItem = req.body;
  console.log("updating", JSON.stringify(newItem));
  const index = items.findIndex((item) => item.id == req.params.id);
  if (index !== -1) {
    items[index] = newItem;
    await saveItems();
    res.sendStatus(204);
  } else {
    res.status(404).send("Item not found");
  }
});

// Route to delete an item by ID
app.delete("/item/:id", async (req, res) => {
  const index = items.findIndex((item) => item.id == req.params.id);
  console.log("deleting", JSON.stringify(items[index]));

  if (index !== -1) {
    items.splice(index, 1);
    await saveItems();
    res.sendStatus(204);
  } else {
    res.status(404).send("Item not found");
  }
});

const httpServer = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server: httpServer });
wss.on("connection", (ws) => {
  ws.send(JSON.stringify(items, null, 2));

  ws.on("message", (message) => {
    console.log("received: %s", message);
  });

  ws.on("close", () => {
    console.log("connection closed");
  });
});

function broadcastItems<T>(items: T) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(items, null, 2));
    }
  });
}
