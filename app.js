const express      = require('express');
const path         = require('path');
const favicon      = require('serve-favicon');
const logger       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const mongoose     = require('mongoose');


mongoose.connect('mongodb://localhost/project2');

const app = express();

const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const db = mongoose.connection;
app.use(
  session({
    secret: "mysecretstring",
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({
      mongooseConnection: db,
      ttl: 24 * 60 * 60 * 1000
    })
  })
);

//Passport Setup
const User = require('./models/User');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;




app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


//const session = require('express-session');

//serialize
passport.serializeUser((user, done) => {
  done(null,user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
  .then(dbUser => {
    done(null,dbUser);
  })
  .catch(err => {
    done(err);
  });
});

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username})
    .then(found => {
      if(found === null) {
        done(null, false, {message: "Wrong info" });
      } else if (!bcrypt.compareSync(password, found.password)) {
        done(null, false, {message: "Wrong info"});
      } else {
        done(null, found);
      }
    })
    .catch(err => {
      done(err, false);
    });
  })
);





// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const index = require('./routes/index');
app.use('/', index);

const auth = require('./routes/auth');
app.use('/', auth);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
