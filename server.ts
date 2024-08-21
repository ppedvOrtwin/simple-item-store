import express from "express";
import fs from "fs/promises";
import path from "path";
import cors from "cors";
import WebSocket from "ws";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

async function createStore(name: string) {
  const fileName = `./stores/${name}.json`;
  let items: { id: string }[] = [] as const;

  // Function to load items from the file
  async function load() {
    try {
      const data = await fs.readFile(fileName, { encoding: "utf8" });
      items = JSON.parse(data);
    } catch (error) {
      // If the file doesn't exist, initialize an empty array
      items = [];
    }
  }

  async function save() {
    await fs.writeFile(fileName, JSON.stringify(items, null, 2));
    broadcast(items, name);
  }

  await load();

  return { load, save, items };
}

// Route to get all items
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Route to get all items
app.get("/:name", async (req, res) => {
  const store = await createStore(req.params.name);
  res.send(store.items);
});

// Route to add a new item
app.post("/:name", async (req, res) => {
  const newItem = req.body;
  console.log("creating", JSON.stringify(newItem));

  const store = await createStore(req.params.name);
  store.items.push(newItem);
  await store.save();

  res.status(201).send(newItem);
});

app.put("/:name/:id", async (req, res) => {
  const newItem = req.body;
  console.log("updating", JSON.stringify(newItem));

  const store = await createStore(req.params.name);
  const index = store.items.findIndex((item) => item.id == req.params.id);
  if (index !== -1) {
    store.items[index] = newItem;
    await store.save();
    res.sendStatus(204);
  } else {
    res.status(404).send("Item not found");
  }
});

// Route to delete an item by ID
app.delete("/:name/:id", async (req, res) => {
  const store = await createStore(req.params.name);
  const index = store.items.findIndex((item) => item.id == req.params.id);
  console.log("deleting", JSON.stringify(store.items[index]));

  if (index !== -1) {
    store.items.splice(index, 1);
    await store.save();
    res.sendStatus(204);
  } else {
    res.status(404).send("Item not found");
  }
});

const httpServer = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server: httpServer });
wss.on("connection", async (ws) => {  
  const allItems = await fs.readdir("./stores")
    .then(f => f.reduce(async (acc, cur) => {
      const name = path.basename(cur, '.json');
      const store = await createStore(name);
      return { ...acc, [name]: store.items };
    }, {}));

  console.log(`sending ${Object.keys(allItems).length} item set(s)`);
  ws.send(JSON.stringify(allItems));

  ws.on("message", (message: WebSocket.RawData) => {
    console.log("creating %s", message);
  });

  ws.on("close", () => {
    console.log("connection closed");
  });
});

function broadcast<T>(items: T, name: string) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ [name]: items }));
    }
  });
}
