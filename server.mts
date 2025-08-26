import { createServer } from "node:http";
import { Server } from "socket.io";
import next from "next";
import "dotenv/config"

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

console.log("Hostname", process.env.HOSTNAME);
console.log("Port", process.env.PORT);
console.log("Dev", process.env.NODE_ENV);



const app = next({dev, hostname, port});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log(`user connected ${socket.id}`);
    
    socket.on("join-room", ({room, username}) => {
      socket.join(room);
      console.log(`${username} joined room ${room}`);
      socket.to(room).emit("user-joined", {message: `${username} joined the room`, userId: socket.id});
    });

    socket.on("message", ({room, message, sender}) => {
      socket.to(room).emit("message", {sender, message})
    })

    socket.on("offer", ({room, offer}) => {
      socket.to(room).emit("offer-send", {from: socket.id, offer});
    })

    socket.on("offer-ack", ({to, offerAck}) => {
      socket.to(to).emit("offer-accepted", {from: socket.id, offerAck});
    })

    socket.on("ice-candidate", ({to, candidate}) => {
      socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
    })

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  httpServer.listen(port, () => {
    console.log(`Server is running on http://${hostname}:${port}`);
  });
});