let express = require('express');
let router = express.Router();
let userHelper = require('../helpers/userHelper');
let io = require('../config/socketio');
let timeHelper = require('../helpers/time');
let msgHelpers = require('../helpers/messageHelpers');
const time = require('../helpers/time');

// checking if user logged in 

router.get('/checklog', function (req, res) {
  if (req.session.user) {
    res.json({ login: true, user: req.session.user });
  } else {
    res.json({ login: false });
  }
});

// home page

router.get('/', async function (req, res, next) {
  // let user = req.session.user.userName;
  res.json('hello');
});

//Logout

router.get('/logout', (req, res, next) => {
  req.session.user = null;
  res.send("done");
})

//Signup
router.post('/signup', function (req, res, next) {
  userHelper.doSignup(req.body).then((userData) => {
    res.json(userData);
  }).catch((err) => {
    res.json(err);
  });

});

//Login

router.post('/login', (req, res, next) => {
  userHelper.doLogin(req.body).then((responce) => {
    req.session.user = responce;
    res.json(responce);
  }).catch((err) => {
    res.json({ wrong: err });
  })
});

//Chat page

router.get('/getchannels', function (req, res, next) {
  let user = req.query.user;
  userHelper.getChannels(user).then((channels) => {
    res.json(channels);
  })
});

router.get('/getmessages', (req, res) => {
  let room = req.query.room;
  msgHelpers.getMessage(room).then((messages) => {
    res.json(messages);
  });


});

//get all Users

router.get('/getusers', (req, res) => {
  let user = req.query.user;
  if (user !== 'undefined') {
    userHelper.getUsers(user).then((users) => {
      res.json(users);
    })
  }
})

//Delete Channel

router.get('/deleteChannel', async (req, res, next) => {
  let room = req.query.room;
  await userHelper.deleteChannel(room);
  await msgHelpers.deleteChannelMessage(room);
  res.json("done");
});

// get online users details

router.get('/dmuser', (req, res) => {
  let senter = req.query.senter;
  let receiver = req.query.receiver;
  msgHelpers.getdms(senter, receiver).then((messages) => {
    res.json(messages);
  });
});

router.patch('/addFriend', (req, res) => {
  let user = req.query.user;
  let friend = req.query.friend;
  userHelper.addFriend(user, friend).then(() => {
    res.json(true);
  }).catch((err) => {
    res.json(false);
  })
});

router.patch('/acceptfriendrequest', (req, res) => {
  const user = req.query.user;
  const friend = req.query.friend;
  userHelper.acceptFriend(user, friend).then(() => {
    res.json();
  });
});

router.patch('/removefriend', (req, res) => {
  const user = req.query.user;
  const friend = req.query.friend;
  userHelper.removeFriend(user, friend).then(() => {
    res.json();
  });
});

router.patch('/cancelfriendrequest', (req, res) => {
  const user = req.query.user;
  const friend = req.query.friend;
  userHelper.cancelFriendRequest(user, friend).then(() => {
    res.json();
  });
});

router.get('/getfriendrequests', (req, res) => {
  const user = req.query.user;
  userHelper.getFriendRequests(user).then((friendReq) => {
    res.json(friendReq);
  });
});

router.get('/getwho', (req, res) => {
  const user = req.query.user;
  const otheruser = req.query.otheruser;
  userHelper.getwho(user, otheruser).then((who) => {
    res.json(who);
  });
});

router.patch('/rejectfriendrequest', (req, res) => {
  const user = req.query.user;
  const friend = req.query.friend;
  userHelper.rejectFriendRequest(user, friend).then(() => {
    res.json();
  });
});

router.patch('/blockuser', (req, res) => {
  const user = req.query.user;
  const block = req.query.block;
  userHelper.blockUser(user, block).then(() => {
    res.json();
  });
});

router.patch('/unblockuser', (req, res) => {
  const user = req.query.user;
  const block = req.query.block;
  userHelper.unblockUser(user, block).then(() => {
    res.json();
  })
});

router.get('/getfriends', (req, res) => {
  const user = req.query.user;
  userHelper.getFriends(user).then((friends) => {
    res.json(friends);
  })
});

router.post('/createchannel', (req, res) => {
  const user = req.query.user;
  console.log(req.body);
  userHelper.createChannel(req.body.channelName, user).then((responce) => {
    res.json(responce);
  })
});

router.get('/getuserdetails', (req, res) => {
  const user = req.query.user;
  userHelper.getUserDetails(user).then((userDetails) => {
    res.json(userDetails);
  })
})

//Socket io connections

let onlineSocket = {};
let onlineId = {};

io.on("connection", (socket) => {
  socket.on('userDetals', async (user) => {
    console.log("connected");
    onlineSocket[user._id] = socket.id;
    onlineId[socket.id] = user._id;
    let ids = Object.values(onlineId);
    let users = await userHelper.onlineUsers(ids);
    io.emit('online', users);
  })
  socket.on('disconnect', async () => {
    let userId = onlineId[socket.id];
    delete onlineSocket[userId];
    delete onlineId[socket.id];
    let ids = Object.values(onlineId);
    users = await userHelper.onlineUsers(ids);
    console.log("disconnected");
    io.emit('online', users);
    socket.removeAllListeners();
  });
  socket.on('message', (msgD) => {
    let time = timeHelper.getTime();
    let date = new Date().toLocaleDateString();
    let sm = {
      time: time,
      msg: msgD.msg,
      user: msgD.userName
    }
    msgHelpers.addMessage(msgD.room, sm, date).then((id) => {
      let sentObj = {
        date: date,
        Place: id,
        chats: [sm]
      }
      io.emit(id, sentObj);
    });
  });
  socket.on('changeOnWho', ({ sent, receive }) => {
    io.emit('whochanged' + receive + sent);
  });
  socket.on('dmMessage', (msgD) => {
    let time = timeHelper.getTime();
    var date = new Date().toLocaleDateString();
    let sm = {
      time: time,
      msg: msgD.msg,
      user: msgD.userName
    }
    msgHelpers.addDm(sm, date, msgD.receiver, msgD.userId).then((id) => {
      let sentObj = {
        date: date,
        Place: msgD.userId + msgD.receiver,
        chats: [sm]
      }
      io.emit(msgD.userId + msgD.receiver, sentObj);
    })
  })

});

module.exports = router;
