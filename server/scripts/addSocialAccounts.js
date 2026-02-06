import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected ✅");

    const result = await User.updateMany(
      {
        socialAccounts: { $exists: false }
      },
      {
        $set: {
          socialAccounts: {
            linkedin: {
              connected: false,
              accessToken: null,
              refreshToken: null,
              expiresAt: null,
              profileId: null,
              profileName: null
            }
          }
        }
      }
    );

    console.log("Migration complete ✅");
    console.log("Users modified:", result.modifiedCount);

    process.exit(0);
  } catch (err) {
    console.error("Migration failed ❌", err);
    process.exit(1);
  }
}

run();
