const bcrypt = require('bcrypt');
var db = require('../config/connect');
var coll = require('../config/collections');
var objid = require('mongodb').ObjectId;

module.exports = {

    // Signup action

    doSignup: (details) => {
        return new Promise(async (resolve, reject) => {

            //Checking if userName exist

            var user = await db.get().collection(coll.user).findOne({ userName: details.userName });
            if (user) {
                reject('This user name is in use');
            } else {
                let userData = {};

                //Hashing password 

                bcrypt.genSalt().then((salt) => {
                    bcrypt.hash(details.Password, salt).then((hash) => {
                        details.Password = hash;
                        details.friends = [];
                        details.friendRequestSend = [];
                        details.friendRequestReceive = [];
                        details.blockedUsers = [];

                        //Storing userDetails in database 
                        db.get().collection(coll.user).insertOne(details).then((responce) => {
                            if (responce) {
                                userData = details;
                                resolve(userData);
                            }
                        });
                    });
                });
            }

        })

    },
    doLogin: (details) => {
        return new Promise(async (resolve, reject) => {

            //Checking userName exist

            var userDetail = await db.get().collection(coll.user).findOne({ userName: details.userName });
            if (userDetail) {
                let userData = {};

                //Checking if password is right

                Password = userDetail.Password;
                bcrypt.compare(details.Password, Password).then(function (result) {
                    if (result) {
                        userData = userDetail;
                        var info = { email: userData.email, userName: userData.userName, id: userData._id, friends: userDetail.friends };
                        resolve(info);
                    } else {
                        reject('Wrong Password');
                    }
                })
            } else {
                reject('There is no user with this UserName');
            }
            ;
        });

    },
    getChannels: (userId) => {
        return new Promise(async (resolve, reject) => {
            var channels = await db.get().collection(coll.channel).aggregate([
                {
                    $match: {}
                },
                {
                    $lookup: {
                        from: coll.user,
                        localField: 'owner',
                        foreignField: '_id',
                        as: 'owner'
                    }
                },
                {
                    $unwind: '$owner'
                },
                {
                    $project: {
                        '_id': '$_id',
                        'name': '$name',
                        'ownerDetails.userName': '$owner.userName',
                        'ownerDetails._id': '$owner._id',
                        'ownerDetails.friends': '$owner.friends',
                        'ownerDetails.email': '$owner.email'
                    }
                }
            ]).toArray();
            console.log(channels);
            resolve(channels);
        })
    },
    createChannel: (channel, user) => {
        return new Promise((resolve, reject) => {
            db.get().collection(coll.channel).insertOne({ name: channel, owner: objid(user) }).then((responce) => {
                resolve(responce.insertedId);
            });
        });
    },
    deleteChannel: (room) => {

        return new Promise(async (resolve, reject) => {

            await db.get().collection(coll.channel).deleteOne({ channel: room });
            resolve();

        });
    },
    getUsers: (user) => {
        return new Promise(async (resolve, reject) => {
            var users = await db.get().collection(coll.user).find({ _id: { $ne: objid(user) } }, { projection: { Password: 0, email: 0 } }).toArray();
            resolve(users);
        })
    },
    onlineUsers: (ids) => {
        return new Promise(async (resolve, reject) => {
            let userDetail = []
            for (let i = 0; i < ids.length; i++) {
                userDetail[i] = await db.get().collection(coll.user).findOne({ _id: objid(ids[i]) })
            }
            resolve(userDetail);
        })


    },
    addFriend: (user, friend) => {
        return new Promise((resolve, reject) => {

            var promise = [db.get().collection(coll.user).updateOne({ _id: objid(user) }, { $push: { 'friendRequestSend': objid(friend) } }),
            db.get().collection(coll.user).updateOne({ _id: objid(friend) }, { $push: { 'friendRequestReceive': objid(user) } })];

            Promise.all(promise).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            })

        });
    },
    getFriendRequests: (user) => {

        return new Promise(async (resolve, reject) => {
            let friendRequests = await db.get().collection(coll.user).aggregate([
                {
                    $match: { _id: objid(user) }
                },
                {
                    $unwind: '$friendRequestReceive'
                },
                {
                    $lookup: {
                        from: coll.user,
                        localField: 'friendRequestReceive',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                {
                    $unwind: '$userDetails'
                },
                {
                    $project: {
                        '_id': '$userDetails._id',
                        'userName': '$userDetails.userName',
                        'friends': '$userDetails.friends'
                    }
                }
            ]).toArray();
            resolve(friendRequests)
        });
    },
    getwho: (user, otheruser) => {
        return new Promise(async (resolve, reject) => {

            Promise.all([db.get().collection(coll.user).findOne({ _id: objid(user) }, { projection: { friendRequestReceive: 1, _id: 0, friends: 1, friendRequestSend: 1, blockedUsers: 1 } }),
            db.get().collection(coll.user).findOne({ _id: objid(otheruser) }, { projection: { blockedUsers: 1 } })]).then(([userDetails, otheruserDetials]) => {

                otheruserDetials.blockedUsers.map((obj) => {
                    if (user === obj.toHexString()) resolve('blockedyou');
                });
                userDetails.friends.map((obj) => {
                    if (otheruser === obj.toHexString()) resolve('friend');
                });
                userDetails.friendRequestReceive.map((obj) => {
                    if (otheruser === obj.toHexString()) resolve('requestreceive');
                });
                userDetails.friendRequestSend.map((obj) => {
                    if (otheruser === obj.toHexString()) resolve('requestsend');
                });
                userDetails.blockedUsers.map((obj) => {
                    if (otheruser === obj.toHexString()) resolve('blocked');
                });
                resolve('stranger');
            });
        });
    },
    removeFriend: (user, friend) => {
        return new Promise((resolve, reject) => {
            Promise.all([db.get().collection(coll.user).updateOne({ _id: objid(friend) }, { $pull: { 'friends': objid(user) } }),
            db.get().collection(coll.user).updateOne({ _id: objid(user) }, { $pull: { 'friends': objid(friend) } }),]).then(() => {
                resolve();
            });
        });
    },
    acceptFriend: (user, friend) => {
        return new Promise((resolve, reject) => {
            Promise.all([db.get().collection(coll.user).updateOne({ _id: objid(friend) }, { $pull: { 'friendRequestSend': objid(user) } }),
            db.get().collection(coll.user).updateOne({ _id: objid(user) }, { $pull: { 'friendRequestReceive': objid(friend) } }),
            db.get().collection(coll.user).updateOne({ _id: objid(friend) }, { $push: { 'friends': objid(user) } }),
            db.get().collection(coll.user).updateOne({ _id: objid(user) }, { $push: { 'friends': objid(friend) } })]).then(() => {
                resolve();
            });
        });
    },
    cancelFriendRequest: (user, friend) => {
        return new Promise((resolve, reject) => {
            Promise.all([db.get().collection(coll.user).updateOne({ _id: objid(user) }, { $pull: { 'friendRequestSend': objid(friend) } }),
            db.get().collection(coll.user).updateOne({ _id: objid(friend) }, { $pull: { 'friendRequestReceive': objid(user) } })]).then(() => {
                resolve();
            });
        });
    },
    rejectFriendRequest: (user, friend) => {
        return new Promise((resolve, reject) => {
            console.log('hello');
            Promise.all([db.get().collection(coll.user).updateOne({ _id: objid(friend) }, { $pull: { 'friendRequestSend': objid(user) } }),
            db.get().collection(coll.user).updateOne({ _id: objid(user) }, { $pull: { 'friendRequestReceive': objid(friend) } })]).then(() => {
                resolve();
            });
        });
    },
    blockUser: (user, block) => {
        return new Promise((resolve, reject) => {
            db.get().collection(coll.user).updateOne({ _id: objid(user) }, { $push: { blockedUsers: objid(block) } }).then(() => {
                resolve();
            });
        });
    },
    unblockUser: (user, block) => {
        return new Promise((resolve, reject) => {
            db.get().collection(coll.user).updateOne({ _id: objid(user) }, { $pull: { blockedUsers: objid(block) } }).then(() => {
                resolve();
            });
        });
    },
    getFriends: (user) => {

        return new Promise(async (resolve, reject) => {
            let friends = await db.get().collection(coll.user).aggregate([
                {
                    $match: { _id: objid(user) }
                },
                {
                    $unwind: '$friends'
                },
                {
                    $lookup: {
                        from: coll.user,
                        localField: 'friends',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                {
                    $unwind: '$userDetails'
                },
                {
                    $project: {
                        '_id': '$userDetails._id',
                        'userName': '$userDetails.userName',
                        'friends': '$userDetails.friends'
                    }
                }
            ]).toArray();
            resolve(friends);
        });
    },
    getUserDetails: (user) => {
        return new Promise(async (resolve, reject) => {
            userDetails = await db.get().collection(coll.user).findOne({ _id: objid(user) }, { projection: { Password: 0, email: 0 } });
            resolve(userDetails);
        });
    }
}
