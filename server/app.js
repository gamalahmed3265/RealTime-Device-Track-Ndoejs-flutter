const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurations
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Socket.io events
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("send-location", (data, callback) => {
    console.log(`Received location from ${socket.id}:`, data);

    // إضافة معرف المستخدم للبيانات
    const locationData = { ...data, id: socket.id };

    // إرسال الموقع لجميع المستخدمين عدا المرسل
    socket.broadcast.emit("receive-location", locationData);

    // الرد على العميل
    callback && callback({ status: "success", message: "Location received" });
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    io.emit("user-disconnect", socket.id);
  });
});

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("*", (req, res) => res.status(404).json("Page Not Found"));

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
