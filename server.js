const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let rooms = {};

app.use(express.static(path.join(__dirname, "./public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinGame", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];

    if (rooms[roomId].length < 2) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      io.to(socket.id).emit("playerAssignment", rooms[roomId].length === 1 ? "X" : "O");

      if (rooms[roomId].length === 2) {
        io.to(roomId).emit("gameStart");
      }
    } else {
      io.to(socket.id).emit("roomFull");
    }
  });

  socket.on("makeMove", ({ roomId, index, player }) => {
    socket.to(roomId).emit("moveMade", { index, player });
  });

  socket.on("restartGame", (roomId) => {
    io.to(roomId).emit("restart");
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((id) => id !== socket.id);
      if (rooms[room].length === 0) delete rooms[room];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
