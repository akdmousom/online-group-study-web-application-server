// Require all packages here
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')


// Define here the app listening port here

const port = process.env.PORT || 5000;

// Create an express app

const app = express();

// All require middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


// All API

app.get('/', async(req,res)=>{
    res.send(`Hello server is running`)
})

// Connect database here


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.chkrm7d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    const database = client.db('Online-Group-Study');
    const onlineGroupStudy = database.collection('users');
    const featureCollection = database.collection('feature');

    // Create token for each user login
    app.post('/api/v1/access-token', async(req,res)=>{
      const userEmail = req.body;
      const token = jwt.sign(userEmail,process.env.ACCESS_TOKEN,{ expiresIn: '1h' });
      res
      .cookie('token', token)
      .send({operation: 'success'})
    })
    


    // This api insert profile details in users collection
    app.post('/api/v1/users', async(req,res)=>{
        const doc = req.body;
        const result = await onlineGroupStudy.insertOne(doc)
        res.send(result);
    })

    // users information get using this api
    app.get('/api/v1/users', async(req,res)=>{
      const userEmail = req.query.email;
      const query = {email: userEmail};
      const cursor = onlineGroupStudy.findOne(query)
      const result = await cursor
      res.send(result)
     
    })

    // this api help us to get application feature data
    app.get('/api/v1/features', async(req,res)=>{
      const cursor = featureCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })


    









    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






// App listening function start here

app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
})
