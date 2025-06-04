const Item = require("../models/itemModel");

// @desc    Get all items
// @route   GET /api/items
// @access  Public
const getItems = async (req, res) => {
  try {
    const items = await Item.find({});
    res.json(items);
  } catch (error) {
    res.status(500);
    throw new Error("Server Error");
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Public
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404);
      throw new Error("Item not found");
    }
  } catch (error) {
    res.status(404);
    throw new Error("Item not found");
  }
};

// @desc    Create an item
// @route   POST /api/items
// @access  Public
const createItem = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      res.status(400);
      throw new Error("Please provide name and description");
    }

    const item = await Item.create({
      name,
      description,
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Public
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error("Item not found");
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(updatedItem);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Public
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error("Item not found");
    }

    await item.deleteOne();
    res.json({ message: "Item removed" });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
