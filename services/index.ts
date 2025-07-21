import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import router from "../controllers/ChatRoutes";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User";
import Message from "../models/Message";

const ACCESS_SECRET = process.env.ACCESS_SECRET || "default_access_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "default_refresh_secret";

//ТОКЕНИ ТА РОБОТА З КОРИСТУВАЧЕМ
export const registerUser = async (username: string, password: string) => {
  const existing = await User.findOne({ username });
  if (existing) throw new Error("Користувач вже існує");

  const hashedPass = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    password: hashedPass,
  });

  const accessToken = jwt.sign({ id: newUser._id, username }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: newUser._id, username }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  newUser.refreshToken = { token: refreshToken };

  await newUser.save();

  return { accessToken, refreshToken, username };
};

export const loginUser = async (username: string, password: string) => {
  const user = await User.findOne({ username });
  if (!user) throw new Error("Користувача не знайдено");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Невірний пароль");

  const accessToken = jwt.sign({ id: user._id, username }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user._id, username }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  user.refreshToken = { token: refreshToken, createdAt: new Date() };
  await user.save();

  return { accessToken, refreshToken, username };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    if (typeof decoded !== "object" || !("id" in decoded)) {
      throw new Error("Некоректний формат токена");
    }

    const user = await User.findOne({ _id: decoded.id });

    if (!user) throw new Error("Користувача не знайдено");

    if (!user.refreshToken || user.refreshToken.token !== refreshToken) {
      throw new Error("Недійсний refresh token");
    }

    const newAccessToken = jwt.sign(
      { id: user._id, username: user.username },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error("Недійсний або прострочений refresh token");
  }
};

//НАЛАШТУВАННЯ СЕРВЕРА
const app = express();
const PORT = 5001;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://chat-app-frontend-deploy-psi.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", router);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://chat-app-frontend-deploy-psi.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Необхідна авторизація"));

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    if (typeof decoded === "object" && "username" in decoded) {
      socket.data.user = decoded;
      next();
    } else {
      next(new Error("Некоректний формат токена"));
    }
  } catch (err) {
    next(new Error("Недійсний токен"));
  }
});

let users: { id: string; username: string; socketID: string }[] = [];

io.on("connection", (socket) => {
  const userId = socket.data.user?.id;
  const username = socket.data.user?.username;

  if (!userId || !username) {
    return socket.disconnect();
  }

  console.log(`${username} (${socket.id}) підключився`);

  users = users.filter((user) => user.id !== userId);
  users.push({ id: userId, username, socketID: socket.id });

  io.emit("responseNewUser", users);

  socket.on("getUsers", () => {
    socket.emit("usersList", users);
  });

  socket.on("message", (data) => {
    if (!data.text) return;
    const message = {
      text: data.text,
      name: username,
      id: `${socket.id}-${Date.now()}`,
      socketID: socket.id,
    };
    io.emit("response", message);
  });

  //ОБРОБНИК ПРИВАТНИХ ПОВІДОМЛЕНЬ
  socket.on("private_message", async (messagePayload) => {
    try {
      const { content, to: receiverId } = messagePayload;
      const senderId = socket.data.user.id;

      if (!content || !receiverId) {
        console.error("Помилка: відсутній текст або одержувач.");
        return;
      }

      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        content: content,
      });
      const savedMessage = await newMessage.save();

      //знайти сокет одержувача щоб відправити йому повідомлення
      const receiverSocket = users.find((user) => user.id === receiverId);

      //відправити збережене повідомлення (з _id і createdAt) назад собі
      io.to(socket.id).emit("new_message", savedMessage);

      //якщо одержувач онлайн, відправляємо повідомлення і йому
      if (receiverSocket) {
        io.to(receiverSocket.socketID).emit("new_message", savedMessage);
      }
    } catch (error) {
      console.error("Помилка при обробці приватного повідомлення:", error);
    }
  });

  socket.on("typing", () => {
    socket.broadcast.emit("responseTyping", `${username} is typing`);
  });

  socket.on("disconnect", () => {
    const disconnectedUser = socket.data.user;

    if (disconnectedUser) {
      console.log(`${disconnectedUser.username} (${socket.id}) відключився`);
      users = users.filter((user) => user.id !== disconnectedUser.id);
      io.emit("responseNewUser", users);
    } else {
      console.log(`Невідомий користувач (${socket.id}) відключився`);
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("Mongo бд підключена"))
  .catch((err) => console.error("Помилка бази даних:", err));

server.listen(PORT, () => {
  console.log(`Server is working on port ${PORT}`);
});
