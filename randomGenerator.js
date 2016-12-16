"use strict"

const randomUrlGenerator = function (){
  let shortURL = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++ ) {
    shortURL += possible.charAt(Math.floor(Math.random() * possible.length));
  };
  return shortURL;
};

module.exports = {
  randomUrl: randomUrlGenerator
};