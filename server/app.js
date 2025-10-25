import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

// Import routers
import aiRouter from "./routes/aiRouter.js";
import newAIRouter from "./routes/newAIRouter.js";
import authRouter from "./routes/auth.js";
import router from "./routes/regisAuthRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";

dotenv.config();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

//
// 🧠 MongoDB connection
//
import connectDB from "./config/db.js";

connectDB(); // connect to MongoDB before starting server

//
// 🔐 Session configuration
//
app.use(
  session({
    name: "autopost.sid",
    secret: process.env.SESSION_SECRET || "emeka",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
  })
);

//
// 🧰 Middlewares
//
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

//
// 🔗 API Routes
//
app.use("/api", newAIRouter);
app.use("/auth", authRouter);
app.use("/register", router);
app.use("/paymentApi", paymentRouter);

//
// 🌐 Static Page Redirects
//
const staticPages = [
  "home",
  "pricing",
  "signup",
  "signin",
  "logout",
  "about",
  "blog",
  "contact",
  "features",
  "create",
  "dashboard",
  "settings",
  "payment",
  "careers",
  "analytics"
];

staticPages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.redirect(`${req.protocol}://${req.get("host")}/${page}.html`);
  });
});

// Payment verification redirect
app.get("/payment-verification", async (req, res) => {
  res.redirect(
    `${req.protocol}://${req.get("host")}/payment-verification.html?reference=${req.query.reference}`
  );
});

//
// 🧾 Trial Info Endpoint
//
app.post("/trialInfo", async (req, res) => {
  const trialPlan = req.body;
  const plans = {
    Starter: {
      name: "Starter",
      description: "Perfect for individuals getting started with automation",
      price: "₦2500"
    },
    Professional: {
      name: "Professional",
      description: "For growing brands and small teams",
      price: "₦5500"
    },
    Business: {
      name: "Business",
      description: "For agencies and large organizations",
      price: "₦15500"
    }
  };

  const planData = plans[trialPlan.a];
  if (planData) {
    res.status(200).json({
      status: "success",
      plan: { Details: planData }
    });
  } else {
    res.status(400).json({ status: "error", message: "Invalid plan" });
  }
});

//
// 🚀 Start Server
//
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌍 Server running on http://localhost:${PORT}`);
});
