var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 5010;
app.set('view engine', 'ejs'); 
app.get("/",(req,res)=> {
  console.log("host:",req.headers.host)
    res.render('./index.ejs',{url:req.headers.host});
});
app.get("/admin",(req,res)=> {
  res.render('./admin.ejs',{url:req.headers.host});
});
app.get("/main",(req,res)=> {
  res.render('./main.ejs',{url:req.headers.host});
});
let tickets = []; 
let winners = [];
function findWinner(timesAttempted) {
  if (timesAttempted > tickets.length) {
      return 0; // no endless loops
  }
  timesAttempted++;
  let winner = tickets[Math.floor(Math.random()*tickets.length)];
  let found = winners.find((w) => { return w == winner; });
  if (found) {
     return findWinner(timesAttempted); 
  } else {
      return winner;
  }
}
let msg;
// Web Socket 
io.on('connection', function(socket){
  console.log("New Player: " + socket.id);
  socket.on('disconnect', (reason) => {
    console.log("disconnect reason:",reason);    
    console.log('& socket.id:',socket.id);
  });
  socket.on('newPlayer', function(TicketCode){
    let YourTicketNo  = 0;
    let YourTicketCode = "";
    console.log("looking for:", TicketCode);
    console.log(tickets);
    tickets.map(t=> {
      if (t.ticketCode == TicketCode)  {
        YourTicketNo = t.TicketNo;
        YourTicketCode = TicketCode;
      }
    });
    if (YourTicketCode == "") {
      YourTicketCode = socket.id;
    }
    let NewTicket = {ticketCode:  YourTicketCode, TicketNo: YourTicketNo}; 
    if (YourTicketNo  == 0) {
      // Really a new user
      YourTicketNo = tickets.length+1; 
      NewTicket = {ticketCode:  YourTicketCode, TicketNo: YourTicketNo};  
      tickets.push(NewTicket);  
      console.log("real new member: ", NewTicket);
      io.emit("newPlayerAdded",YourTicketNo); // broadcast to everyone (including the main screen and secret screen) that we have a new user
    }
    console.log("About to send:",NewTicket)
    socket.emit("YourTicket",NewTicket); // send information to new ticket
  });
  socket.on('reset',data => {
    console.log("reset")
    tickets = []; 
    winners = [];
    io.emit("reset",'');
  });
  socket.on('winner',data => {
    let winner = findWinner(0);
    console.log("winner is:",winner)
    io.emit("winner",winner); // send winner to all
  }); 
});
// Initialize our websocket server on port 5000
app.use(express.static(__dirname + "/"));
http.listen(port, function(){
  console.log('listening on *:' + port);
});

