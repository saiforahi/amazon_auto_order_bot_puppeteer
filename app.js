require('dotenv').config({ path: __dirname +`/.env` });
const scrapper = require('./scrapper');
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const port = 8000;
const cors = require("cors");
//
app.use(cors());
app.use(bodyParser.json({ limit: "1000mb" }));

app.use(express.static(path.join(__dirname, "/assets/")));
app.use(express.static(path.join(__dirname, "/")));

process.on("uncaughtException", function (err) {
    console.error(new Date().toUTCString() + " uncaughtException:", err.message);
    console.error(err.stack);
});

//Route setup
app.get("/", (req, res) => {
    res.send("root route");
});
scrapper();

app.listen(port, (req, res) => {
    console.log(`server listening on port: ${port}`);
});


// 1 order completed with cloud bot successfully
// order number is : 113-8035677-7609866
//1:30 am 1/6/2021