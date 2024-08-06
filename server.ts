import express from "express";
import fs from "fs/promises";
import cors from "cors";

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
  items.push(newItem);
  await fs.writeFile(fileName, JSON.stringify(items, null, 2));
  res.status(201).send(newItem);
});

// Route to delete an item by ID
app.delete("/item/:id", async (req, res) => {
  const index = items.findIndex((item) => item.id == req.params.id);

  if (index !== -1) {
    items.splice(index, 1);
    await fs.writeFile(fileName, JSON.stringify(items, null, 2));
    res.sendStatus(204);
  } else {
    res.status(404).send("Item not found");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
