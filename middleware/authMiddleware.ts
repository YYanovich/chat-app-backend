import express from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = "REDACTED";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string };
    }
  }
}

export const protect = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, ACCESS_SECRET);

      if (typeof decoded === "object" && "id" in decoded) {
        req.user = { id: decoded.id, username: decoded.username };
        return next(); 
      } else {
        throw new Error("Некоректний формат токена");
      }
    } catch (error) {
      res.status(401).json({ message: "Не авторизований, токен невірний" });
      return; 
    }
  }

  if (!token) {
    res.status(401).json({ message: "Не авторизований, немає токена" });
    return;
  }
};
