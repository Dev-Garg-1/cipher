import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import childRoutes from "./routes/child.js";
import monitorRoutes from './routes/monitorRoutes.js';
import authRoutes from "./routes/authRoutes.js";
import parentRoutes from "./routes/parentRoutes.js"
dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "chrome-extension://*",     // Chrome extensions
      "https://*.ngrok-free.app",  // ngrok
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("/", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// app.use("/api/auth", authRoutes);
import mongoose from "mongoose";

 const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
connectDB();


app.use('/api/monitor', monitorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/child", childRoutes);
app.use("/api/parent",parentRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
