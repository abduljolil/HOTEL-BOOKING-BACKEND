require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT || 5000 ;
const cookie = require('cookie-parser');

const app = express();
const cors = require('cors');



// middleware
app.use(cors({
  origin: ['http://localhost:5173',"https://assingment-10-frontent.web.app"],
  credentials: true
}));
app.use(express.json());
app.use(cookie());
 
  

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.j0ovfoc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
}); 

const logger =(req,res,next)=>{
  console.log('called',req.host,req.originalUrl)
  next();
}
  
  const verifyToken = async(req,res,next)=>{
    const token =req.cookies?.token;
    console.log('token',token);
    if(!token){
      return res.status(401).send({message:'not authorized'})
    }
    jwt.verify(token,process.env.ACCESS_TOKEN,(err,decode)=>{
      if(err){
        console.log(err);
        return res.status(401).send({message:'unauthorized'})
      }
      console.log('verify',decode);
      req.user = decode;
      next()
    })
   
  }
 
  

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const roomsCollection = client.db('hotel').collection('rooms');
    const  offerCollection = client.db('hotel').collection('offer');
    const  bookingCollection = client.db('hotel').collection('booking');

    app.post('/jwt', logger,async(req,res)=>{
      const user =req.body;
      console.log({user});
      const token = jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:'1h'});
      console.log(token);
      res.
      cookie('token',token,{
        httpOnly:true,
        secure:false,
        sameSite:'none'
      })
      .send({success:true});
    })

    // server api
    app.get('/rooms',async(req,res)=>{

      let queryObj ={}
      let sortObj={}

      const category =req.query.category;
      const sortField=req.query.sortField;
      const sortOrder=req.query.sortOrder;
      if(category){
        queryObj.category=category;
      }
      if(sortField && sortOrder){
        sortObj[sortField]=sortOrder
      }

      const result = await roomsCollection.find(queryObj).sort({}).toArray();
      res.send(result);
     })
    app.get('/offer',async(req,res)=>{
      const result = await offerCollection.find().toArray();
      res.send(result);
     })

     app.get('/rooms/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await roomsCollection.findOne(query);
      res.send(result);
     })

     app.post('/booking', async(req,res)=>{
      const user = req.body;
      const result = await bookingCollection.insertOne(user);
      res.send(result);
     })

     app.get('/booking', async(req,res)=>{
      const result = await bookingCollection.find( ).toArray();
      res.send(result);
    })

    app.patch('/booking/:id',async(req,res)=>{
      const id =req.params.id;
      const filter ={_id:new ObjectId(id)};
      const update= req.body;
      console.log(update);
      const updateDoc = {
        $set: {
          date:update.date,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
     })

     app.delete('/booking/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result =await bookingCollection.deleteOne(query);
      res.send(result);
     })




    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


  
  
app.get('/',(req, res)=>{
    res.send('hotel service is running')
  })
  
  app.listen(port),()=>{
    console.log(` hotel server is running ${port}`)
  }