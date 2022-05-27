const express = require("express");
const jwt = require('jsonwebtoken');
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// connection to mongodb
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ofuvw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

console.log(uri);

async function run() {
  try {
    await client.connect();
    console.log("Database connected");
    const productCollection = client.db("comparts").collection("products")

    const usersCollection = client.db("comparts").collection('users')

    // get all product api
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const product = await cursor.toArray();
      res.send(product);
    });
    app.get('/user', async (req, res) => {
      const query = {}
      const cursor = usersCollection.find(query)
      const users = await cursor.toArray()
      res.send(users)
    })
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const user = req.body;
      const updatedDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });
    // add single product
    app.post("/product", async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);
