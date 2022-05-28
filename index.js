const express = require("express");
const jwt = require('jsonwebtoken');
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


require("dotenv").config();
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello manufacturing industry!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// connection to mongodb success
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
    const orderCollection = client.db("comparts").collection('orders')
    const reviewsCollection = client.db("comparts").collection('reviews')
    const paymentsCollection = client.db("comparts").collection('payments')



    // get all product api
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const product = await cursor.toArray();
      res.send(product);
    });



    app.get("/products/:productId", async (req, res) => {
      const id = req.params.productId;
      const query = { _id: ObjectId(id) }
      const product = await productCollection.findOne(query);
      res.send(product)
    })

    // get single user info
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const order = await usersCollection.findOne(query);
      res.send(order);
    });

    // get all user
    app.get("/users", async (req, res) => {
      const query = {};
      const cursor = usersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
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
    // Add Reviews
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    // get all reviews 
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });


    // delete api
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(filter);
      res.send(result);
    });

    // get all order
    app.get("/orders", async (req, res) => {
      const query = {};
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.get("/order", async (req, res) => {
      const userEmail = req.query.userEmail;
      const query = { userEmail: userEmail };
      const orders = await orderCollection.find(query).toArray();
      res.send(orders);
    });

    // make admin
    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result)
    });
    // update Profile
    app.put("/profile/:email", async (req, res) => {
      const profile = req.body;
      console.log(profile);
      const email = req.params.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: profile,
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // for payment
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const order = await orderCollection.findOne(query)
      res.send(order);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      const price = order.orderPrice;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.patch("/order/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const updatedOrder = await orderCollection.updateOne(filter, updateDoc);
      const result = await paymentsCollection.insertOne(payment);
      res.send(updateDoc);
    });
  } finally {
  }
}

run().catch(console.dir);
