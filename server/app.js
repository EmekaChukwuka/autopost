import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import session from "express-session";
import path from "path";
import ngrok from '@ngrok/ngrok';
import { fileURLToPath } from "url";
import axios from "axios";

// Import routers
import clearwordsAIRouter from "./routes/aiRouter.js";
import newAIRouter from "./routes/newAIRouter.js";
import authRouter from "./routes/auth.js";
import router from "./routes/regisAuthRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import calendarRouter from './routes/calendarRoutes.js';

import cron from "node-cron";
import { processLinkedInPosts } from "./workers/linkedinScheduler.js";

cron.schedule("*/1 * * * *", async () => {
  console.log("⏱ Running LinkedIn scheduler...");
  await processLinkedInPosts();
});



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

import SubscriptionPlan from "./models/SubscriptionPlan.js";

async function seedSubscriptionPlans() {
  const existingPlans = await SubscriptionPlan.countDocuments();

  if (existingPlans > 0) {
    console.log("✅ Subscription plans already exist");
    return;
  }

  await SubscriptionPlan.insertMany([
    {
      name: "Starter",
      description: "Perfect for individuals getting started",
      price: 2500,
      duration_days: 30,
      social_accounts_limit: 3,
      monthly_posts_limit: 30,
      ai_content_access: true,
      analytics_access: false
    },
    {
      name: "Professional",
      description: "For growing brands and small teams",
      price: 5500,
      duration_days: 30,
      social_accounts_limit: 10,
      monthly_posts_limit: 100,
      ai_content_access: true,
      analytics_access: true,
      team_members_limit: 2
    },
    {
      name: "Business",
      description: "For agencies & large organizations",
      price: 15500,
      duration_days: 30,
      social_accounts_limit: 25,
      monthly_posts_limit: 300,
      ai_content_access: true,
      analytics_access: true,
      team_members_limit: 5,
      priority_support: true
    }
  ]);

  console.log("✅ Subscription plans seeded successfully");
}

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
app.use('/calendar', calendarRouter);

//
// 🔗 API Routes
//
app.use("/api", newAIRouter);
app.use("/clearwordsapi", clearwordsAIRouter);
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

const url = `https://autopost-backend-hbck.onrender.com/`;
const interval = 30000; // Interval in milliseconds (30 seconds)

//Reloader Function
function reloadWebsite() {
  axios.get(url)
    .then(response => {
      console.log(`Reloaded at ${new Date().toISOString()}: Status Code ${response.status}`);
    })
    .catch(error => {
      console.error(`Error reloading at ${new Date().toISOString()}:`, error.message);
    });
}

setInterval(reloadWebsite, interval);


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
ngrok.connect({ addr: 3000, authtoken: process.env.NGROK_AUTH_TOKEN })
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));
  
  seedSubscriptionPlans(); 