var socket = io();
var chatMessages = document.querySelector('.chat-messages');
var msgForm = document.getElementById('chat-form');

//Senter
var us = document.getElementById('userName');
var userName = us.dataset.userName;

var ch = document.getElementById('channel');
var chann = ch.dataset.channel;

console.log('chat');
console.log(chann);

chatMessages.scrollTop = chatMessages.scrollHeight;


var users = document.getElementById('allusers').innerHTML;
console.log('users'+users);
console.log('userName'+userName);
if (users == userName) {
    document.getElementById('allusers').style.display = 'none';
}




msgForm.addEventListener('submit', (e) => {

    e.preventDefault();
    
    //Getting message and message details

    var msg = document.getElementById('msg').value;
    var room = document.getElementById('room-name').innerHTML;
    var messageD = {
        msg: msg,
        userName: userName,
        room: room,
    }

    // sent message to server

    socket.emit('message', messageD);
    document.getElementById('msg').value = '';

});

// displaying recived message 

socket.on(chann, (sm) => {
    outputMessage(sm);
    chatMessages.scrollTop = chatMessages.scrollHeight;
})
var outputMessage = (sm) => {
    var div = document.createElement('div');
    div.classList.add('message');
    var date = new Date().toLocaleDateString();
    div.innerHTML = `<p class="meta">${sm.user}  <span>${sm.time}</span> <span>  ${date}<span></p>
                <p class="text">
                    ${sm.msg}
                </p>`;
    chatMessages.appendChild(div);

}