import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { findAdmin } from "../../models/Admin";

const secretKey = process.env.JWT_SECRET_KEY || ''; // Keep this in an environment variable
const router = express.Router();

// Admin login route to get JWT token
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await findAdmin(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate JWT token only for admin users
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    secretKey,
    { expiresIn: "1h" }
  );
  return res.json({ token });
});

export default router;
