import { v4 as uuidv4 } from "uuid";
import { StableBTreeMap } from "azle";
import express from "express";
import { time } from "azle";

/**
 * StableBTreeMap digunakan untuk menyimpan data perangkat elektronik di blockchain.
 * - Key: ID perangkat (string)
 * - Value: Informasi perangkat elektronik (Gadget)
 */

class Gadget {
  id: string;
  name: string;
  type: string;
  description: string;
  pricePerDay: number;
  availability: boolean;
  owner: string;
  rentedBy: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

const gadgetStorage = StableBTreeMap<string, Gadget>(0);

const app = express();
app.use(express.json());

// Menambahkan perangkat baru untuk disewakan
app.post("/gadgets", (req, res) => {
  const gadget: Gadget = {
    id: uuidv4(),
    createdAt: getCurrentDate(),
    updatedAt: null,
    rentedBy: null,
    availability: true,
    ...req.body,
  };
  gadgetStorage.insert(gadget.id, gadget);
  res.json(gadget);
});

// Melihat semua perangkat yang tersedia
app.get("/gadgets", (req, res) => {
  res.json(gadgetStorage.values());
});

// Melihat detail perangkat berdasarkan ID
app.get("/gadgets/:id", (req, res) => {
  const gadgetId = req.params.id;
  const gadgetOpt = gadgetStorage.get(gadgetId);
  if (!gadgetOpt) {
    res.status(404).send(`Gadget with id=${gadgetId} not found`);
  } else {
    res.json(gadgetOpt);
  }
});

// Menyewa perangkat
app.post("/gadgets/:id/rent", (req, res) => {
  const gadgetId = req.params.id;
  const gadgetOpt = gadgetStorage.get(gadgetId);
  if (!gadgetOpt) {
    res.status(404).send(`Gadget with id=${gadgetId} not found`);
  } else if (!gadgetOpt.availability) {
    res.status(400).send(`Gadget with id=${gadgetId} is not available`);
  } else {
    const updatedGadget = {
      ...gadgetOpt,
      availability: false,
      rentedBy: req.body.renter,
      updatedAt: getCurrentDate(),
    };
    gadgetStorage.insert(gadgetId, updatedGadget);
    res.json(updatedGadget);
  }
});

// Mengembalikan perangkat
app.post("/gadgets/:id/return", (req, res) => {
  const gadgetId = req.params.id;
  const gadgetOpt = gadgetStorage.get(gadgetId);
  if (!gadgetOpt) {
    res.status(404).send(`Gadget with id=${gadgetId} not found`);
  } else if (gadgetOpt.availability) {
    res.status(400).send(`Gadget with id=${gadgetId} is not rented`);
  } else {
    const updatedGadget = {
      ...gadgetOpt,
      availability: true,
      rentedBy: null,
      updatedAt: getCurrentDate(),
    };
    gadgetStorage.insert(gadgetId, updatedGadget);
    res.json(updatedGadget);
  }
});

// Menghapus perangkat dari daftar
app.delete("/gadgets/:id", (req, res) => {
  const gadgetId = req.params.id;
  const deletedGadget = gadgetStorage.remove(gadgetId);
  if (!deletedGadget) {
    res.status(400).send(`Gadget with id=${gadgetId} not found`);
  } else {
    res.json(deletedGadget);
  }
});

app.listen();

function getCurrentDate() {
  const timestamp = Number(time());
  return new Date(timestamp.valueOf() / 1_000_000);
}
