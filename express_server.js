const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function generateRandomString(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortURLId = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    shortURLId += characters[randomIndex];
  }
  return shortURLId;
};

function findUserByEmail(email) {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null;
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user2randomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user1RandomID"
  },
};

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

app.use((req, res, next) => {
  const userId = req.cookies["user_id"];
  res.locals.user = users[userId];
  next();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user_id: res.locals.user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: res.locals.user
  };
  if (res.locals.user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    user: res.locals.user,
    id: req.params.id, 
    longURL: urlDatabase[req.params.id] 
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (!res.locals.user) {
    res.status(401).send("You cannot shorten URLS if you are not logged in.")
  } else {
  const id = generateRandomString();
  const longURL = req.body.longURL; 
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
  }
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  if (!longURL) {
    res.status(404).send("That URL does not exist.");
  } else {
    res.redirect(longURL);
  }
});

app.post("/login", (req, res) => {
  const { email, password} = req.body;
  const user = Object.values(users).find(user => user.email === email);
  if (!user || user.password !== password) {
    res.status(403).send("Error 403: Invalid email or password");
    return;
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (res.locals.user) {
    res.redirect("/urls")
  } else {
    res.render("urls_login");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("urls_login");
});

app.get("/register", (req, res) => {
  if (res.locals.user) {
    res.redirect("/urls");
  } else {
  res.render("urls_register")
  }
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).send("Error 400: Email and password are required.");
    return;
  }
  const existingUser = Object.values(users).find(user => user.email === email);
  if (existingUser) {
    res.status(400).send("Error 400: User already exsists.");
    return;
  }
  const newUser = {
    id: userID,
    email: email,
    password: password
  };
  users[userID] = newUser;
  res.cookie("user_id", userID);
  res.redirect("/urls");
});