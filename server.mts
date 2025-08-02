import { createServer } from "node:http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

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
      socket.to(room).emit("user-joined", `${username} joined the room`);
    });

    socket.on("message", ({room, message, sender}) => {
      socket.to(room).emit("message", {sender, message})
    })

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });

  });

  httpServer.listen(port, () => {
    console.log(`Server is running on http://${hostname}:${port}`);
  });
});