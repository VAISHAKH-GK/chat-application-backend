const MongoClient = require('mongodb').MongoClient;

var state = { db: null };

module.exports.connect = (done) => {
    var url = "mongodb://localhost:27017/mydb";
    var dbname = 'chat';

    MongoClient.connect(url, function (err, db) {

        if (err) return done(err);
        console.log("Database created!");
        state.db = db.db(dbname);
        done();
    })

}

module.exports.get = () => {
    return state.db;
}
