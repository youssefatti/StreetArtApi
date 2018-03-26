// Le package `dotenv` permet de pouvoir definir des variables d'environnement dans le fichier `.env`
// Nous utilisons le fichier `.slugignore` afin d'ignorer le fichier `.env` dans l'environnement Heroku
require("dotenv").config();

// mongoose.connect(
//   process.env.MONGODB_URI || "mongodb://localhost:27017/foodPicking"
// );
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI, function(err) {
  if (err) console.error("Could not connect to mongodb.");
});

const express = require("express");
const app = express();

// Le package `helmet` est une collection de protections contre certaines vulnérabilités HTTP
const helmet = require("helmet");
app.use(helmet());

// Les réponses (> 1024 bytes) du serveur seront compressées au format GZIP pour diminuer la quantité d'informations transmise
const compression = require("compression");
app.use(compression());

// Parse le `body` des requêtes HTTP reçues
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// Initialisation des models
const User = require("./models/User");

// Le package `passport`
const passport = require("passport");
app.use(passport.initialize()); // TODO test

// Nous aurons besoin de 2 strategies :
// - `local` permettra de gérer le login nécessitant un mot de passe
const LocalStrategy = require("passport-local").Strategy;
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true,
      session: false
    },
    User.authenticateLocal()
  )
);

// - `http-bearer` permettra de gérer toute les requêtes authentifiées à l'aide d'un `token`
var HTTPBearerStrategy = require("passport-http-bearer").Strategy;
passport.use(new HTTPBearerStrategy(User.authenticateBearer())); // La méthode `authenticateBearer` a été déclarée dans le model User

app.get("/", function(req, res) {
  res.send("Welcome to Street Art API.");
});

// `Cross-Origin Resource Sharing` est un mechanisme permettant d'autoriser les requêtes provenant d'un nom de domaine different
// Ici, nous autorisons l'API à repondre aux requêtes AJAX venant d'autres serveurs
const cors = require("cors");
app.use("/", cors());

// Les routes sont séparées dans plusieurs fichiers
const userRoutes = require("./routes/user.js");

// Les routes relatives aux utilisateurs auront pour prefix d'URL `/user`
app.use("/user", userRoutes);

// Toutes les méthodes HTTP (GET, POST, etc.) des pages non trouvées afficheront une erreur 404
app.all("*", function(req, res) {
  res.status(404).json({ error: "Not Found" });
});

// Le dernier middleware de la chaîne gérera les d'erreurs
// Ce `error handler` doit définir obligatoirement 4 paramètres
// Définition d'un middleware : https://expressjs.com/en/guide/writing-middleware.html
app.use(function(err, req, res, next) {
  if (res.statusCode === 200) res.status(400);
  console.error(err);

  if (process.env.NODE_ENV === "production") err = "An error occurred";
  res.json({ error: err });
});

app.listen(process.env.PORT, function() {
  console.log(`Steet Art API running on port ${process.env.PORT}`);
});

// TODO test
// console.log(`process.env.NODE_ENV = ${process.env.NODE_ENV}`);
