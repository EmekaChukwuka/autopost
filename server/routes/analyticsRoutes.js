import express from "express";
import PostAnalytics from "../models/PostAnalytics.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await PostAnalytics.find({ user_id: userId });

    if (!posts.length) {
      return res.json({ success: true, data: null });
    }

    const totalPosts = posts.length;

    const sum = posts.reduce((acc, p) => {
      acc.likes += p.metrics.likes;
      acc.comments += p.metrics.comments;
      acc.shares += p.metrics.shares;
      acc.impressions += p.metrics.impressions;
      return acc;
    }, { likes:0, comments:0, shares:0, impressions:0 });

    const avgLikes = sum.likes / totalPosts;
    const avgComments = sum.comments / totalPosts;

    const bestPost = posts.sort((a,b) =>
      (b.metrics.likes + b.metrics.comments) -
      (a.metrics.likes + a.metrics.comments)
    )[0];

    res.json({
      success: true,
      data: {
        totalPosts,
        avgLikesPerPost: avgLikes,
        avgCommentsPerPost: avgComments,
        totalLikes: sum.likes,
        totalComments: sum.comments,
        totalShares: sum.shares,
        totalImpressions: sum.impressions,
        bestPost
      }
    });

  } catch (err) {
    res.status(500).json({ success:false });
  }
});

router.get("/averages", authenticateToken, async (req,res) => {

  const result = await PostAnalytics.aggregate([
    { $match: { user_id: req.user._id } },
    {
      $group: {
        _id: null,
        avgComments: { $avg: "$metrics.comments" },
        avgLikes: { $avg: "$metrics.likes" }
      }
    }
  ]);

  res.json(result[0] || {});
});

router.get("/post/:id", authenticateToken, async (req,res) => {

  const post = await PostAnalytics.findOne({
    scheduled_post_id: req.params.id,
    user_id: req.user.id
  });

  res.json(post);
});

router.get("/image-vs-text", authenticateToken, async (req,res) => {

  const data = await PostAnalytics.aggregate([
    { $match: { user_id: req.user._id } },
    {
      $group: {
        _id: "$has_image",
        avgLikes: { $avg: "$metrics.likes" },
        avgComments: { $avg: "$metrics.comments" }
      }
    }
  ]);

  res.json(data);
});

export default router;