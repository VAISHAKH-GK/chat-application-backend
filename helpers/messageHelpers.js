var db = require('../config/connect');
var coll = require('../config/collections');
var objid = require('mongodb').ObjectId;


module.exports = {

    addMessage: (place, sm, today) => {
        return new Promise(async (resolve, reject) => {

            //Checking if any messages stored today in current channe

            var chatPlaceExist = await db.get().collection(coll.msg).findOne({ Place: place, date: today });
            if (chatPlaceExist) {

                //Updating messages to database

                db.get().collection(coll.msg).updateOne({ Place: place, date: today }, { $push: { chats: sm } }).then(async (responce) => {
                    var channel = await db.get().collection('Channels').findOne({ _id: objid(place) });
                    channel = channel._id;
                    resolve(channel.toString());
                });
            } else {

                //Storing messages to database

                var chats = [sm];
                var msgDetail = {
                    Place: place,
                    date: today,
                    chats: chats
                };
                db.get().collection(coll.msg).insertOne(msgDetail).then(async () => {
                    var channel = await db.get().collection('Channels').findOne({ _id: objid(place) });
                    channel = channel._id;
                    resolve(channel.toString());
                });
            }
        })
    },
    getMessage: (room) => {

        return new Promise(async (resolve, reject) => {
            var messages = await db.get().collection(coll.msg).aggregate([{ $match: { Place: room } }]).toArray();
            resolve(messages);

        })

    },
    deleteChannelMessage: (room) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(coll.msg).deleteMany({ Place: room });
            resolve();
        });
    },
    getdms: (user1, user2) => {
        return new Promise((resolve, reject) => {
            db.get().collection('dms').aggregate([
                {
                    $match: { $and: [{ $or: [{ 'user1': user1 }, { 'user2': user1 }] }, { $or: [{ 'user1': user2 }, { 'user2': user2 }] }] }
                }
            ]).toArray().then((dms) => {
                resolve(dms);
            })
        });
    },
    addDm: (sm, today, receiver, senter) => {
        return new Promise(async(resolve, reject) => {

            let chatPlaceExist = await db.get().collection('dms')
                .findOne({ $and: [{ $or: [{ 'user1': receiver }, { 'user2': receiver }] }, { $or: [{ 'user1': senter }, { 'user2': senter }] }], date: today });

            if (chatPlaceExist) {

                db.get().collection('dms').updateOne({
                    $and: [{ $or: [{ 'user1': receiver }, { 'user2': receiver }] }, { $or: [{ 'user1': senter }, { 'user2': senter }] }]
                    , date: today
                }, { $push: { chats: sm } }).then(async (responce) => {
                    resolve();
                });

            } else {

                var msgDetail = {
                    user1:senter,
                    user2:receiver,
                    date: today,
                    chats: [sm]
                };
                db.get().collection('dms').insertOne(msgDetail).then(async () => {
                    resolve('');
                });
            }
        })
    }

}