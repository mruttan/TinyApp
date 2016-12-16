var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const urlGenerator = require("./randomGenerator");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let shortURL = urlGenerator.randomUrl()
  let longURL = `/urls/${shortURL}`;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  console.log(urlDatabase[req.params.id]);
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  /*Only redirect if the specified url exists, else, just return an error message. Msg can be modified.*/
  if (!urlDatabase.hasOwnProperty(shortURL)){
    res.end("<html><body>Aha, you didn't say the magic word...<br> Your url must have been invalid! ...</body></html>\n");
  } else {res.redirect(longURL)
  };
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  delete urlDatabase[shortURL];
  res.redirect("/urls")
});

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  console.log(req.body);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls")
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


