//index.js
var bodyParser = require('body-parser'); 
var express = require('express'),
	MongoClient = require('mongodb').MongoClient,
	app = express(),
	mongoUrl = 'mongodb://localhost:27017/textmonkey';
	
var redisClient = require('redis').createClient;
var redis = redisClient(6379, "localhost");

var access = require('./access.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

MongoClient.connect(mongoUrl, function(err, db) {
	if (err)
		throw 'Error connecting to database - ' + err;
	
	app.post('/book', function(req,res) {
		console.log(req.body, 'Get Saved');
		if (!req.body.title || !req.body.author)
			res.status(400).send("Please send a title and an author for the book");
		else if (!req.body.text)
			res.status(400).send("Please send some text for the book");
		else {
			access.saveBook(db,redis, req.body.title, req.body.author, req.body.text, function(book) {
				if (!book)
					res.status(500).send("Server error");
				else
					res.status(201).send(book);
			});
		}
	});
	
	app.get('/book/:title', function(req,res) {
		console.log("Inside get book/:title")
		if (!req.param('title')) { 
			console.log("Inside if title");
			res.status(400).send("Please send a proper title");
		}
		else {
			console.log("Inside else title",req.param('title'));
			access.findBookByTitleCached(db, redis, req.param('title'), function(book) {

				if (!book){
					console.log("Text");
					res.status(500).send("Server error",book);
				}
				else{
					console.log("Inside Else Get",book);
					res.status(200).send(book);
				}
			});
		}
	});

	app.put('/book/:title', function(req,res) {
		if(!req.param("title"))
			res.status(400).send("Please send the book title");
		else if (!req.param("text"))
			res.status(400).send("Please send the new text");
		else {
			access.updateBookByTitle(db, redis, req.param("title"), req.param("text"), function(err) {
				if(err == "Missing book")
					res.status(404).send("Book not found");
				else if(err)
					res.status(500).send("Server error");
				else
					res.status(200).send("Updated");
			});
		}
	});

	app.delete('/book/:title', function(req,res) {
		console.log("Inside get book/:title")
		if (!req.param('title')) { 
			console.log("Inside if title");
			res.status(400).send("Please send a proper title");
		}
		else {
			console.log("Inside else title",req.param('title'));
			access.deleteBookByTitleCached(db, redis, req.param('title'), function(book) {
console.log('verify method');
				if (!book){
					console.log("Text");
					res.status(500).send("Server error",book);
				}
				else{console.log('inside else else');
					res.status(200).send(book);
				}
				
			});
		}
	});
	
	app.listen(8000, function() {
		console.log('Listening on port 8000');
	});
});



