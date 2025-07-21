import express from "express";
import { registerUser, loginUser, refreshAccessToken } from "../services/index";
import User from "../models/User";
import Message from "../models/Message";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post(
  "/register",
  async (req: express.Request, res: express.Response) => {
    try {
      const { username, password } = req.body;
      // 👇 ОСЬ ТУТ ВИПРАВЛЕННЯ
      const {
        accessToken,
        refreshToken,
        username: registeredUsername,
      } = await registerUser(username, password);
      res
        .status(201)
        .json({ accessToken, refreshToken, username: registeredUsername });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.post("/login", async (req: express.Request, res: express.Response) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/refresh", async (req: express.Request, res: express.Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

router.get(
  "/users",
  protect,
  async (req: express.Request, res: express.Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const searchQuery = (req.query.search as string) || "";

      //фільтра для бази даних
      const filter = {
        // шукаємо по полю username
        // $regex пошук по регулярному виразу, частковий збіг
        // $options: 'i' робить пошук нечутливим до регістру
        username: { $regex: searchQuery, $options: "i" },
      };

      const [users, totalUsers] = await Promise.all([
        User.find(filter, "username _id").skip(offset).limit(limit),
        User.countDocuments(filter),
      ]);

      res.status(200).json({
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
      });
    } catch (error: any) {
      console.error("Помилка під час отримання користувачів:", error);
      res.status(500).json({ message: "Помилка сервера" });
    }
  }
);

router.get(
  "/messages/:otherUserId",
  protect,
  async (req: express.Request, res: express.Response) => {
    try {
      const firstUser = req.user!.id;
      const secondUser = req.params.otherUserId as string;

      const messages = await Message.find({
        $or: [
          { sender: firstUser, receiver: secondUser },
          { sender: secondUser, receiver: firstUser },
        ],
      }).sort({ createdAt: 1 });

      res.status(200).json(messages);
    } catch (error: any) {
      console.error("Помилка у приватних чатах: ", error);
      res.status(500).json({ message: "Помилка сервера" });
    }
  }
);

export default router;
