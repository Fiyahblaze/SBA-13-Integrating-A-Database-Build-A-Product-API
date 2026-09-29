const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

// CREATE a product
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    const status =
      error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;

    res.status(status).json({ error: error.message });
  }
});

// GET all products, with optional filters, sorting, and pagination
router.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sortBy } = req.query;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const filter = {};

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1
    ) {
      return res.status(400).json({
        error: "page and limit must be positive whole numbers",
      });
    }

    if (category !== undefined) {
      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }

      if (Object.values(filter.price).some((price) => !Number.isFinite(price))) {
        return res.status(400).json({
          error: "minPrice and maxPrice must be numbers",
        });
      }
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };

    if (sortBy !== undefined && !sortOptions[sortBy]) {
      return res.status(400).json({
        error: "sortBy must be price_asc or price_desc",
      });
    }

    const products = await Product.find(filter)
      .sort(sortOptions[sortBy] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET one product
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a product
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    const status =
      error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;

    res.status(status).json({ error: error.message });
  }
});

// DELETE a product
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;