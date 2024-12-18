require('dotenv').config();
const express = require('express');
const mongoose = require("mongoose");
const cors = require('cors');
const bodyParser = require("body-parser");
const dns = require("dns");
const url = require("url");
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect("mongodb://127.0.0.1:27017/urlshortener", { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true },
});

const URL = mongoose.model("URL", urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;
  const parsedUrl = url.parse(originalUrl);

  // Validate URL using dns.lookup
  dns.lookup(parsedUrl.hostname, async (err) => {
    if (err || !parsedUrl.protocol) {
      return res.json({ error: "invalid url" });
    }

    // Save to database
    const newUrl = new URL({ original_url: originalUrl, short_url: shortUrlCounter++ });
    await newUrl.save();

    res.json({ original_url: originalUrl, short_url: newUrl.short_url });
  });
});

// GET route to redirect
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = req.params.short_url;

  const urlEntry = await URL.findOne({ short_url: shortUrl });
  if (urlEntry) {
    res.redirect(urlEntry.original_url);
  } else {
    res.json({ error: "No short URL found" });
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
