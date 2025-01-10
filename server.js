const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI from environment variables
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Routes
async function run() {
  try {
    const limitCollection = client.db("expense-tracker").collection("limits");
    const userCollection = client.db("expense-tracker").collection("users");
    const expensesCollection = client
      .db("expense-tracker")
      .collection("expenses");
    // app.get("/api/register", async (req, res) => {
    //   const query = {};
    //   const users = await userCollection.find(query).toArray();
    //   res.send(users);
    // });
    app.get("/api/register", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res
          .status(400)
          .send({ message: "Email query parameter is required" });
      }

      const user = await userCollection.find({ email }).toArray();
      if (user.length === 0) {
        return res.status(404).send({ message: "User not found" });
      }

      res.status(200).send(user);
    });
    app.post("/api/register", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
      // console.log(result);
    });

    // ! Expenses API
    app.post("/api/expenses", async (req, res) => {
      const expense = req.body;
      const result = await expensesCollection.insertOne(expense);
      res.send(result);
      console.log(result);
      // const { category, amount } = req.body;

      // try {
      //   const limit = await limitCollection.findOne({ category });
      //   if (limit && limit.amount < amount) {
      //     return res
      //       .status(400)
      //       .json({ error: "Exceeds category spending limit" });
      //   }

      //   const result = await expensesCollection.insertOne(req.body);
      //   res.status(201).json(result.ops[0]);
      // } catch (err) {
      //   res.status(500).json({ error: "Failed to add expense" });
      // }
    });

    app.get("/api/expenses", async (req, res) => {
      const query = {};
      const expenses = await expensesCollection.find(query).toArray();
      res.send(expenses);
      // try {
      //   const expenses = await expensesCollection.find().toArray();
      //   res.status(200).json(expenses);
      //   res.send("Expenses", expenses);
      // } catch (err) {
      //   res.status(500).json({ error: "Failed to fetch expenses" });
      // }
    });
    app.post("/api/limits", async (req, res) => {
      try {
        const { category, limit } = req.body;

        // Validate input
        if (!category || typeof limit !== "number" || limit <= 0) {
          return res
            .status(400)
            .json({ error: "Invalid category or limit value." });
        }

        // Upsert logic: update if the category exists, otherwise insert
        const result = await limitCollection.updateOne(
          { category }, // Find the document by category
          { $set: { category, limit } }, // Update or set new data
          { upsert: true } // Insert if the category doesn't exist
        );

        // Respond with success message
        res.status(200).json({
          message: "Limit set successfully",
          result,
        });
      } catch (error) {
        console.error("Error setting limit:", error);
        res
          .status(500)
          .json({ error: "An error occurred while setting the limit." });
      }
    });

    app.get("/api/limits", async (req, res) => {
      const query = {};
      const limit = await limitCollection.find(query).toArray();
      res.send(limit);
    });
  } finally {
  }
}

run().catch(console.log);
app.get("/", (req, res) => {
  res.send("Welcome to the Expense Tracking");
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
