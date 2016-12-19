"use strict";

const bodyParser = require("body-parser");
const randomGenerator = require("./randomGenerator");
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
//Next line creates a public folder for ease of access to images and the like
app.use(express.static("public"));
app.use(cookieSession({ name: "session", keys: ["key1", "key2"]}));


const urlDatabase = {
  //shortURL: {id: user_id, longURL: longURL}
};

const users = {
  // users_id: { id, email, hashed_password }
};


app.get("/", (req, res) => {
  const templateVars = { urls: urlDatabase,
    user: req.session.user_id,
    userList: users };
  if (!users.hasOwnProperty(templateVars.user)) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
})

//Get request to the homepage of a logged in user.
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase,
    user: req.session.user_id,
    userList: users };
  if (!users.hasOwnProperty(templateVars.user)) {
    res.status(401).send("Error 401, You must be logged in to access this page. \n <a href = /login>Click here</a> to get to the login page.");
  } else {
    res.status(200);
    res.render("urls_index", templateVars);
  }
})

//Get request to page to add new URL.
app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase,
    user: req.session.user_id,
    userList: users };

  if (users.hasOwnProperty(req.session.user_id)) {
    res.status(200);
    res.render("urls_new", templateVars);
  } else {
    res.status(400).send("Error 401, You must be logged in to access this page. \n <a href = /login>Click here</a> to get to the login page.");
  }
})

//Get request to page displaying info regarding a specific url of a specific user.
app.get("/urls/:id", (req, res) => {
  const templateVars = {shortURL: req.params.id,
    user: req.session.user_id,
    userList: users };
  if (!urlDatabase.hasOwnProperty(templateVars.shortURL)) {
    res.status(404).send("Error 404. The page you are trying to access does not exist! Get back to <a href = /> Home Page</a>.");
  }
  /*Next line adds the longURL key to templateVars once we know it the shortURL is defined*/
  templateVars.longURL = urlDatabase[templateVars.shortURL]["longURL"];
  if (!users.hasOwnProperty(templateVars.user)) {
    res.status(401).send("Error 401, You must be logged in to access this page. \n <a href = /login>Click here</a> to get to the login page.");
  } else if (templateVars.user !== urlDatabase[templateVars.shortURL]["id"]) {
    res.status(403).send("Error 403. You are not the owner of this URL! <a href = /login>Click here</a> to log in as the right user");
  } else {
    res.render("urls_show", templateVars);
  }
})

//Get request redirecting to the long URL.
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
   if (!urlDatabase.hasOwnProperty(shortURL)) {
    res.status(404).send("Error 404. This short url does not exist! Get back to <a href = /> Home Page</a>.");
  } else {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL);
  }
})

//Get request to display register form page.
app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase,
    user: req.session.user_id,
    userList: users };
  if (users.hasOwnProperty(templateVars.user)) {
    res.redirect("/");
  } else {
    res.status(200);
    res.render("urls_register", templateVars);
  }
})

//Get request to log in page.
app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase,
    user: req.session.user_id,
    userList: users };
  if (users.hasOwnProperty(templateVars.user)) {
    res.redirect("/");
  } else {
    res.status(200);
    res.render("urls_login", templateVars);
  }
})

//Post request to input new url of a specific user.
app.post("/urls", (req, res) => {
  const shortURL = randomGenerator.randomUrl();

  if (req.body.longURL[0] !== "h") {
    res.status(400).send("Error 400. The format of your URL is not valid, please make sure to add http:// at the begining");
  } else if (!req.session.user_id) {
    res.status(401).send("Error 401. You are not logged in. <a href = /login>Click here</a> to get to the login page.");
  } else {
    // next line adds object {id: user_id, longURL: longUrl} to urlDatabase
    urlDatabase[shortURL] = {id: req.session.user_id, longURL: req.body.longURL};
    res.redirect(`/urls/${shortURL}`);
    }
})

//Post request to delete a specific url of a specific user.
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
})

//Post request to login as an already registered user.
app.post("/login", (req, res) => {
  const {email, password} = req.body;
  //Next line returns the user id of the user whose email has been inputted.
  const id = Object.keys(users).find((id) => users[id].email === email );
  const user = users[id];

  if(!password || !email) {
    res.status(400).send(`Error 400, You did not enter any password or email address!`);
  } else if (!id) {
    res.status(400).send(`Error 400, email ${email} does not exist.`);
  } else if (!bcrypt.compareSync(password, user.hashed_password)) {
    res.status(401).send(`Error 401, Wrong password. <a href = /login>Click here</a> to get to the login page.`);
  } else {
    req.session.user_id = id;
    res.redirect("/");
  }
})

//Post request to logout.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
})

//Post request to register a new user.
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashed_password = bcrypt.hashSync(password, 10);

  let id = Object.keys(users).find((id) => users[id].email === email );
  if (!password || !email) {
    res.status(400).send(`Error 400, You did not enter any password or any email address! <a href = /register>Click here</a> to go back to the register page.`);
  } else if (id) {
    res.status(400).send(`Error 400. Email ${email} already. <a href = /register>Click here</a> to go back to the register page.`);
  } else {
    // Generate new id and add new user to users
    id = randomGenerator.randomUrl();
    users[id] = { id, email, hashed_password };
    req.session.user_id = users[id]["id"];
    res.redirect("/");
  }
})

//Post request to update a given short url.
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const user = req.session.user_id;
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    res.status(404).send(`Error 404. Short url ${shortURL} does not exist! Get back to <a href = /> Home Page</a>.`);
  } else if (!users.hasOwnProperty(user)) {
    res.status(401).send("Error 401, You must be logged in to access this page. <a href = /login>Click here</a> to get to the login page.");
  } else if (user !== urlDatabase[shortURL]["id"]) {
    res.status(403).send("Error 403. You are not the owner of this URL! <a href = /login>Click here</a> to log in as the right user");
  } else {
    urlDatabase[shortURL]["longURL"] = longURL;
    res.status(200);
    res.redirect(`/urls/${shortURL}`);
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
})
