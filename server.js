const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CONTACT_FILE = path.join(DATA_DIR, "contact.json");

const products = [
  {
    id: "tee-core-black",
    name: "Core Black Tee",
    price: 899,
    image: "images/Tshirt/img6_files/s-pl0003-black-plumeandstich-original-imahmaqpvtytjpan.jpeg",
    description: "Minimal premium black tee with everyday regular fit."
  },
  {
    id: "tee-cloud-white",
    name: "Cloud White Tee",
    price: 799,
    image: "images/Tshirt/img6_files/s-pl0003-yellow-plumeandstich-original-imahmaqw56xxkgsj.jpeg",
    description: "Soft cotton white t-shirt with clean structure."
  },
  {
    id: "tee-street-graphic",
    name: "Street Graphic Tee",
    price: 999,
    image: "images/Tshirt/img6_files/s-pl0003-green-plumeandstich-original-imahmaqunhezajkq.jpeg",
    description: "Bold chest print and breathable knit for long wear."
  },
  {
    id: "tee-oversized-sand",
    name: "Oversized Sand Tee",
    price: 1099,
    image: "images/Tshirt/img6_files/s-pl0003-maroon-plumeandstich-original-imahmaqzbm7dxxvq.jpeg",
    description: "Relaxed oversized silhouette in muted sand tone."
  },
  {
    id: "tee-ink-blue",
    name: "Ink Blue Tee",
    price: 879,
    image: "images/Tshirt/img6_files/s-pl0003-indigo-plumeandstich-original-imahmaqzcyxhjgmw.jpeg",
    description: "Easy-fit navy t-shirt for work and weekend style."
  },
  {
    id: "tee-vintage-red",
    name: "Vintage Red Tee",
    price: 949,
    image: "images/Tshirt/img6_files/s-pl0003-navy-plumeandstich-original-imahmaqpzad7s6x8.jpeg",
    description: "Faded red vintage-wash tee with textured feel."
  }
];

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, customerEmail, items } = req.body;

    if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order payload." });
    }

    const orderItems = items
      .map((item) => {
        const product = products.find((p) => p.id === item.id);

        if (!product || !Number.isInteger(item.quantity) || item.quantity <= 0) {
          return null;
        }

        return {
          id: product.id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
          lineTotal: product.price * item.quantity
        };
      })
      .filter(Boolean);

    if (orderItems.length === 0) {
      return res.status(400).json({ error: "No valid order items." });
    }

    const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const orderRecord = {
      orderId: `ORD-${Date.now()}`,
      customerName,
      customerEmail,
      items: orderItems,
      total,
      createdAt: new Date().toISOString()
    };

    const existing = await readJsonArray(ORDERS_FILE);
    existing.push(orderRecord);
    await fs.writeFile(ORDERS_FILE, JSON.stringify(existing, null, 2), "utf8");

    return res.status(201).json({
      message: "Order placed successfully.",
      orderId: orderRecord.orderId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while creating order." });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }

    const entry = {
      id: `MSG-${Date.now()}`,
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };

    const existing = await readJsonArray(CONTACT_FILE);
    existing.push(entry);
    await fs.writeFile(CONTACT_FILE, JSON.stringify(existing, null, 2), "utf8");

    return res.status(201).json({ message: "Message received." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while saving message." });
  }
});

app.listen(PORT, () => {
  console.log(`Store running on http://localhost:${PORT}`);
});

async function readJsonArray(filePath) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    const content = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(filePath, "[]", "utf8");
      return [];
    }

    throw error;
  }
}
