//MongoDB
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.urvn5ho.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const fs = require("fs");
const ejs = require("ejs");
const express = require("express");
process.stdin.setEncoding("utf8");

const databaseAndCollection = {db: "CMSC335DB", collection:"movieDatabase"};
const app = express();

app.set("views", path.resolve(__dirname, "template"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(express.static('css'));

//the posts and get functions
app.get("/", (req, res) => {
    let values = {
        port:port,
    }
    res.render("main", values);
});

app.post("/movieSearch", async (req, res) => {
  try {
    // Connect to the MongoDB client
    await client.connect();
    const search = req.body.movie;

    const url = `https://movie-database-alternative.p.rapidapi.com/?s=${search}&r=json&page=1`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': '852ee8bb6cmsh6ed8e581c8ca38dp161815jsneebf99e81008',
        'X-RapidAPI-Host': 'movie-database-alternative.p.rapidapi.com'
      }
    };
  
    const response = await fetch(url, options);
    const data = await response.json();
  
    let movies = data.Search;
    let tableData;
  
    console.log(movies);
    if(!movies) {
      let values = {
        port:port,
      }
      res.render("nomovies", values);
    } else {
      tableData = movies.map(movie => {
        return {
          poster: movie.Poster,
          title: movie.Title,
          year: movie.Year,
          imdb: movie.imdbID,
        };
      });
  
      let result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection)
      // insert tableData into MongoDB
      await insertData(result, tableData);
      const values = {
        tableData: tableData,
        port: port,
      };
    
      res.render("search", values);
    }
  } catch (error) {
    console.error(error);
  } finally {
    // Make sure to close the client when done
    await client.close();
  }
});
  
app.post("/movieList", async (req, res) => {
  try {
    // Connect to the MongoDB client
    await client.connect();

    let table = "";
    let filter = {};
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter).toArray();
    console.log(result);

    table += "<table border = '1'><tr><th>Title</th><th>Year</th><th>imdb</th></tr>";
    table += result.map((item) => `<tr><td>${item.title}</td><td>${item.year}</td><td>${item.imdb}</td></tr>`).join("") + `</table>`;

    let values = {
        port: port,
        table: table,
    }

    res.render("list", values);
  } catch (error) {
    console.error(error);
  } finally {
    // Make sure to close the client when done
    await client.close();
  }
})


app.post("/moviesRemove", async (req, res) => {
  try {
{    // Connect to the MongoDB client
    await client.connect();
    // remove all applications from the database
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
    const count = result.deletedCount;
    let values = {
      port: port,
      count: count
    }
    res.render("delete", values);}
  } catch (error) {
    console.error(error);
  } finally {
    // Make sure to close the client when done
    await client.close();
  }
});

//Functions for the webpage
async function insertData(collection, data) {
    const result = await collection.insertMany(data);
    console.log(`${result.insertedCount} documents were inserted into the collection`);
}

// Main Function
let port = process.argv[2];

async function main() {
    num = 1000;
    port = num;
    process.stdout.write(`Web server started and running at http://localhost:${port}/\n`);
}

app.listen(port);
main().catch(console.error);
