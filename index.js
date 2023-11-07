// Require all packages here
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

app.get('/', async (req, res) => {
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
    const assignmentCollection = database.collection('assignments');

    // Verify token 

    const gateMan = async (req, res, next) => {

      const { token } = req.cookies

      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {

        if (!token) {
          return res.status(401).send('You are not authorized')
        }

        if (err) {

          return res.status(401).send("You are not authorized")

        }

        req.user = decoded
        next();
      })



    }

    // Create token for each user login
    app.post('/api/v1/access-token', async (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN, { expiresIn: '1h' });

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      })
        .send({ operation: 'success' })
    })






    // This api insert profile details in users collection
    app.post('/api/v1/users', async (req, res) => {
      const doc = req.body;
      const result = await onlineGroupStudy.insertOne(doc)
      res.send(result);
    })

    // users information get using this api
    app.get('/api/v1/users', async (req, res) => {
      const userEmail = req.query.email;
 
    
        const query = { email: userEmail };
        const cursor = onlineGroupStudy.findOne(query)
        const result = await cursor
        res.send(result)


    })

    // this api help us to get application feature data
    app.get('/api/v1/features', async (req, res) => {
      const cursor = featureCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // this api help us to create an assignment
    app.post('/api/v1/assignments', gateMan, async(req,res)=>{
      const doc = req.body;
      const result = assignmentCollection.insertOne(doc);
      res.send(result);
      
    })

    app.get('/api/v1/get-assignments', async(req,res)=>{
      

      const {difficultyField} = req.query;

      let query = {}

      if (difficultyField) {

        query = {difficultyLevel: difficultyField}
        
      }
    
      const cursor = assignmentCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.delete('/api/v1/delete-assignment', gateMan, async (req,res)=>{
      const {userEmail} = req.query
      const {id} = req.query
      const user = req.user
      const filter = {_id: new ObjectId(id)}
      const cursor = await assignmentCollection.findOne(filter)
      // console.log(cursor.userEmail);
      if (cursor?.userEmail === user.userEmail) {
      const result = assignmentCollection.deleteOne(filter)
      return res.send(result)

      }

      res.status(401).send({message: 'Unauthorized'})

    })

    app.get('/api/v1/single-assignment/:id', gateMan, async(req,res)=>{
      const {id }= req.params;
      const query = {_id: new ObjectId(id)}
      const cursor = assignmentCollection.findOne(query)
      const result = await cursor
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
