
class SocketCon {
    constructor() {
        this.socket = io.connect('http://192.168.100.9:5000');
    }

    joinRoom(username, roomCode) {
        this.socket.emit('join',{
            username: username,
            room_code: roomCode
        });
    }

    sendMessage(username, message, roomCode_) {
        if (message == '') {
            return false;
        } else {
            this.socket.emit('message', {username:username, msg:message, room_code:roomCode_});
            var date= new Date();
            var date_ = date.toTimeString();
            console.log(date_);
            var time = date_.substring(0,5);
            var hours = (parseInt(time.substring(0,2))+11)%12 + 1;
            var minutes = time.substring(3,5);
            createMessage(username, message, "sender", hours + ":" + minutes + " " + (new Date().getHours() >= 12 ? 'PM' : 'AM'));
            document.getElementById('message').value = '';
            return false;
        }
    }

    recievedMessage() {
        this.socket.on('recieved_msg', function(data) {
            var date= new Date();
            var date_ = date.toTimeString();
            console.log(date_);
            var time = date_.substring(0,5);
            var hours = (parseInt(time.substring(0,2))+11)%12 + 1;
            var minutes = time.substring(3,5);
            createMessage(data.username, data.msg, "receiver", hours + ":" + minutes + " " + (new Date().getHours() >= 12 ? 'PM' : 'AM'));
        });
    }

    leaveRoom(username, roomCode) {
        this.socket.emit('leave', {
            username: username,
            room_code: roomCode
        });
        window.location.href = "/chat";
    }
}