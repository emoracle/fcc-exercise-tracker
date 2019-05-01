const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' );

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});


var Schema = mongoose.Schema;
var Person = mongoose.model('Person', new Schema({
    username:{ type: String, required: true},
}));

app.post('/api/exercise/new-user', (req,res)=>{
  var person = new Person ({username: req.body.username})
  person.save( function(error,data){
    if (error) return req.send(error);
    console.log(data);
    req.send(data);
  });   
});

app.post('api/exercise/add', (req,res)=>{
  console.log(req.body.userId);
  console.log(req.body.description);
  console.log(req.body.duration);
  console.log(req.body.date);
  res.send();
});

app.get('/api/exercise/log', (req,res)=>{
  console.log(req.query.userId);
  console.log(req.query.from);
  console.log(req.query.to);
  console.log(req.query.limit);
  res.send();
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})
