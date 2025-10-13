import express from "express";
import aiRouter from "./routes/aiRouter.js";
import newAIRouter from "./routes/newAIRouter.js";
import pool from "./config/db.js";
import authRouter from "./routes/auth.js";
import router from "./routes/regisAuthRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
//import Regisrouter from "./controllers/regisAuthController.js";
import dotenv from "dotenv";
import http from 'http';
import cors from 'cors';
import session from 'express-session';
import ngrok from '@ngrok/ngrok';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
app.use(session({
  name: 'autopost.sid',
  secret: 'emeka',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'production' ? 'none' : 'lax'
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use("/api", newAIRouter);
app.use("/auth", authRouter);
app.use("/register", router);
app.use("/paymentApi", paymentRouter);
app.get('/', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/home.html`);
});
app.get('/pricing', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/pricing.html`);
});
app.get('/signup', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/signup.html`);
});
app.get('/signin', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/signin.html`);
});
app.get('/logout', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/logout.html`);
});
app.get('/about', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/about.html`);
});
app.get('/blog', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/blog.html`);
});
app.get('/contact', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/contact.html`);
});
app.get('/features', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/features.html`);
});
app.get('/create', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/create.html`);
});
app.get('/dashboard', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/dashboard.html`);
});
app.get('/settings', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/settings.html`);
});
app.get('/payment', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/payment.html`);
});
app.get('/careers', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/careers.html`);
});
app.get('/analytics', (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/analytics.html`);
});

app.get('/payment-verification', async (req, res) => {
   res.redirect(`${req.protocol}://${req.get('host')}/payment-verification.html?reference=${req.query.reference}`);
  //console.log(`${req.protocol}://${req.get('host')}/verifyPayment?reference=${req.query.reference}`);
  //res.redirect(`${req.protocol}://${req.get('host')}/verifyPayment?reference=${req.query.reference}`);
/*try {
  let reference = req.query.reference;
  console.log(reference);
    const response = await fetch(`${req.protocol}://${req.get('host')}/paymentApi/verify?reference=${req.query.reference}`, {
      method: 'POST',
      body: reference
    });
    const data = response.json();
    if(response.ok){
      res.redirect(`/payment-verification.html?reference=${req.query.reference}`);
    }else{
      console.log('an error occured');
    }
    
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }*/
});


app.post('/trialInfo', async (req, res) => {
  const trialPlan = req.body;
  const pricingPlans = {
    'Starter':{
      'name': 'Starter',
      'description': 'Perfect for individuals getting started with automation',
      'price': '₦2500'
    },
    'Professional':{
      'name': 'Professional',
      'description': 'For growing brands and small teams',
      'price': '₦5500'
    },
    'Business':{
      'name': 'Business',
      'description': 'For agencies and large organizations',
      'price': '₦15500'
    }
  };
  console.log(trialPlan.a);
if (trialPlan.a === 'Starter') {
      res.status(200).json({
      status: 'success',
      plan:  {"Details":{
      'name': 'Starter',
      'description': 'Perfect for individuals getting started with automation',
      'price': '₦2500'
    }} 
    });
  }
if (trialPlan.a === 'Professional') {
      res.status(200).json({
      status: 'success',
      plan: {
    'Details':{
      'name': 'Professional',
      'description': 'For growing brands and small teams',
      'price': '₦5500'
    } }
    });
}
if (trialPlan.a === 'Business') {
      res.status(200).json({
      status: 'success',
      plan: {'Details':{
      'name': 'Business',
      'description': 'For agencies and large organizations',
      'price': '₦15500'
    } }
    });
}
});




// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
  connection.release();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
ngrok.connect({ addr: 3000, authtoken: process.env.NGROK_AUTH_TOKEN })
 .then(listener => console.log(`Ingress established at: ${listener.url()}`));