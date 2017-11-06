//access.js

/*module.exports.saveBook = function(db, title, author, text, callback) {
	db.collection('text').save({title:title, author:author, text:text}, callback);
};*/

module.exports.findBookByTitle = function(db, title, callback) {
	db.collection('text').findOne({title:title}, function(err, doc) {
		if (err || !doc)
			callback(null);
		else
			callback(doc.text);
	});
};

module.exports.findBookByTitleCached = function(db, redis, title, callback) {
	redis.get(title, function(err, reply) {
		if (err)
			callback(null);
		else if (reply) //Book exists in cache
			callback(JSON.parse(reply));
		else {
			//Book doesn't exist in cache - we need to query the main database
			db.collection('text').findOne({title:title}, function(err, doc) {
				if (err || !doc)
					callback(null);
				else {
					//Book found in database, save to cache and return to client
					redis.hset("book",doc.title, JSON.stringify(doc), function() {
                        console.log("Inside redis",doc.title);
                        callback(doc);
                    }); 
				}
			});
		}
	});
};

module.exports.deleteBookByTitleCached = function(db, redis, title, callback) {
	redis.get(title, function(err, reply){
		if(err){
			console.log('inside if');
			callback(null);
		}
		/*else if(reply){
			console.log('access.js inside else if');
			callback(JSON.parse(reply));
		}*/
		else{
			console.log('inside else',title);
			db.collection('text').remove({title:title},function(err, doc){
				console.log("delete");
				if(err || !doc)
					callback(null);
				else{
					redis.hdel("book",doc.title, function() {
						console.log("Inside redis",title);
                        callback(doc);
                    });
				}
			})
		}
	})
}

module.exports.saveBook = function(db, redis, title, author, text, callback) {
	doc = {
		title: title,
		author: author,
		text: text
	}
	redis.hmset("book", doc.title, doc.author, doc.text, JSON.stringify(doc), function(err, reply){
		console.log(reply, 'check reply');
		if(!reply){
			console.log("SaveBook Inside If");
			callback(null);
		}
		else{
			console.log('in else part')
			db.collection('text').save({title:title, author:author, text:text}, function(err, doc){
				if(err || !doc){
					callback(null);
				}
				else{
					redis.del("book",doc.title,function(){
						console.log("Inside redis",doc.title);
						callback(doc);
					}
				}
			})
		}
	});
/*	db.collection('text').save({title:title, author:author, text:text}, function(err, doc){
		console.log("Insert", doc.title);
		if(err || !doc){
			console.log("Error");
			callback(null);
		}
		else {
			redis.set("book",doc.title,JSON.stringify(doc),function(){
				console.log("Inside redis",doc.title);
				callback(doc);
			})
		}
	});
*/};


/*module.exports.access.updateBookByTitle = function(db, redis, title, newText, callback) {
	db.collection("text").findAndModify({title:title}, {$set:{text:text}}, 
	function (err, doc) { //Update the main database
		if(err)
			callback(err);
		else if (!doc)
			callback('Missing book');
		else {
			//Save new book version to cache
			redis.set(title, JSON.stringify(doc), function(err) {
				if(err)
					callback(err);
				else
					callback(null);
			});
		}
	});
};*/