//Import required modules
const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

//Create Express application
const app = express();
const PORT = 8080;

//Import helper functions
const { getUserByEmail } = require('./helpers');

//Set the view engine to use EJS templates
app.set('view engine', 'ejs');

// Generates random strings needed for URLs and keys in cookie session configuration
const generateRandomString = function(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortURLId = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    shortURLId += characters[randomIndex];
  }
  return shortURLId;
};

//Configure Express middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: [generateRandomString(), generateRandomString()]
}));

//Helper function to search for URLs based on user ID
const urlsForUser = function(id) {
  const userURLs = {};
  for (let key in urlDatabase) {
    if (urlDatabase.hasOwnProperty(key) && urlDatabase[key].userID === id) {
      userURLs[key] = urlDatabase[key].longURL;
    }
  }
  return userURLs;
};


//Database of URLs and associated user information
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user2RandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user1RandomID"
  },
};

//Database of example users
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//Start the Express server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get('/', (req, res) => {
  res.redirect('/login');
});

//Return the URL database as a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//If user is logged in, retrieves URLs associated with user and renders the urls_index template
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("You cannot view your URLS if you are not logged in.");
  }
  const userId = req.session.user_id;
  const userURLS = urlsForUser(userId);
  const templateVars = {
    user: users[req.session.user_id],
    urls: userURLS,
  };
  res.render("urls_index", templateVars);

});

//If user logged in, prepares template variables and renders the urls_new template
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//Performs check on URL, user, and and userID, then deletes from urlDatabase and redirects to '/urls'
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const urlId = req.params.id;
  const url = urlDatabase[urlId];
  if (!url) {
    return res.status(404).send("URL not found.");
  }
  if (!req.session.user_id) {
    return res.status(401).send("You cannot view URLS if you are not logged in.");
  }
  if (url.userID !== userId) {
    return res.status(403).send("This URL does not belong to you.");
  }
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

//Extracts id parameter and updates the longURL with the corresponding id
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id].longURL = newLongURL;
  res.redirect("/urls");
});

//
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const urlId = req.params.id;
  const url = urlDatabase[urlId];
  if (!url) {
    return res.status(404).send("URL not found.");
  }
  if (!req.session.user_id) {
    return res.status(401).send("You cannot view URLS if you are not logged in.");
  }
  if (url.userID !== userId) {
    return res.status(403).send("This URL does not belong to you.");
  }
  const templateVars = {
    user: users[req.session.user_id],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("You cannot shorten URLS if you are not logged in.");
  }
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = {
    longURL: longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${id}`);
  
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  if (!url) {
    res.status(404).render("error", { errorMessage: "URL not found." });
  } else {
    res.redirect(url.longURL);
  }
});

app.post("/login", (req, res) => {
  const { email, password} = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("Error 403: Invalid email or password");
    return;
  }
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    res.status(401).send("Error 401: Incorrect password.");
    return;
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", { user: undefined });
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", { user: undefined });
  }
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Error 400: Email and password are required.");
    return;
  }
  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    res.status(400).send("Error 400: User already exsists.");
    return;
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userID,
    email: email,
    password: hashedPassword
  };
  users[userID] = newUser;
  req.session.user_id = userID;
  res.redirect("/urls");
});

