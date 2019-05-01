const
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  mongoose = require('mongoose');

mongoose.connect("mongodb+srv://sys:oracle@cluster0-gx6nk.mongodb.net/test?retryWrites=true").then(() => {
  console.log("Connected to database!");
})
  .catch((error) => {
    console.log("Connection failed!");
    console.log(error);
  });

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

var Schema = mongoose.Schema;
var GebruikerModel = mongoose.model('Gebruiker', new Schema({
  username: { type: String, required: true },
}));

var ExerciseModel = mongoose.model('Exercise', new Schema({
  userId: { type: String, required: true },
  description: { type: String },
  duration: { type: Number },
  date: { type: Date }
}));

app.post('/api/exercise/new-user', (req, res) => {
  if (req.body.username === '') {
    res.send('Username cannot be blank');
  }

  var person = new GebruikerModel({ username: req.body.username });
  person.save((error, data) => {
    if (error) {
      if (error.code === 11000) {
        res.send('Unique name validation error');
      } else {
        res.send('Error occurred while saving user' + error);
      }
    }
    res.json(data);
  });
});

app.post('/api/exercise/add', (req, res) => {
  const
    username = req.body.username,
    description = req.body.description;

  let
    duration = req.body.duration,
    date = req.body.date,
    userId;

  User.findOne({ username }, (err, user) => {
    if (err || !user) {
      res.send('We do not know this username');
    } else {
      userId = user.id;
      duration = Number(duration);

      if (date === '') {
        date = new Date();
      } else {
        date = Date.parse(date);
      }

      const newExercise = new ExerciseModel({
        userId,
        description,
        duration,
        date,
      });

      newExercise.save((errSave, data) => {
        if (errSave) {
          res.send('Error occurred while saving exercise' + errSave);
        } else {
          res.json(data);
        }
      });
    }
  });
});

app.get('/api/exercise/:log', (req, res) => {
  const username = req.query.username;
  let
    from = req.query.from,
    to = req.query.to,
    limit = req.query.limit,
    userId;

  let query = {};

  if (username === undefined) {
    res.send('Required Field(s) are missing.');
  } else if (username === '') {
    res.send('Required Field(s) are blank.');
  } else if (username.length > 10) {
    res.send('Username cannot be greater than 10 characters');
  } else if (from !== undefined && isNaN(Date.parse(from)) === true) {
    res.send('From is not a valid date');
  } else if (to !== undefined && isNaN(Date.parse(to)) === true) {
    res.send('From is not a valid date');
  } else if (limit !== undefined && isNaN(limit) === true) {
    res.send('Limit is not a valid number');
  } else if (limit !== undefined && Number(limit) < 1) {
    res.send('Limit must be greater than 0');
  } else {
    // Find userId for username\
    User.findOne({ username }, (err, user) => {
      if (err) {
        res.send('Error while searching for username, try again');
      } else if (!user) {
        res.send('Username not found');
      } else {
        userId = user.id;
        query.userId = userId;

        if (from !== undefined) {
          from = new Date(from);
          query.date = { $gte: from };
        }

        if (to !== undefined) {
          to = new Date(to);
          to.setDate(to.getDate() + 1); // Add 1 day to include date
          query.date = { $lt: to };
        }

        if (limit !== undefined) {
          limit = Number(limit);
        }

        Exercise.find(query).select('userId description date duration ').limit(limit).exec((errExercise, exercises) => {
          if (err) {
            res.send('Error while searching for exercises, try again');
          } else if (!user) {
            res.send('Exercises not found');
          } else {
            res.json(exercises);
          }
        });
      }
    });
  }
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


// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})
