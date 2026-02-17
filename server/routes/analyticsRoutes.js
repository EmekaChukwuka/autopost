import express from "express";
import PostAnalytics from "../models/PostAnalytics.js";

const analyticsRouter = express.Router();

analyticsRouter.post("/profile", async (req, res) => {
  try {
    const { userId }= req.body;

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

analyticsRouter.post("/averages", async (req,res) => {
  const { userId } = req.body;
  const result = await PostAnalytics.aggregate([
    { $match: { user_id: userId } },
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

analyticsRouter.post("/post/:id", async (req,res) => {
  const { userId } = req.body;
  const post = await PostAnalytics.findOne({
    scheduled_post_id: req.params.id,
    user_id: userId
  });

  res.json(post);
});

analyticsRouter.post("/image-vs-text",  async (req,res) => {
  const { userId } = req.body;
  const data = await PostAnalytics.aggregate([
    { $match: { user_id: userId } },
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

analyticsRouter.post("/posts", async (req,res) => {
  const { userId} = req.body;

  const posts = await PostAnalytics
    .find({ user_id: userId })
    .sort({ "metrics.likes": -1 })
    .limit(10);

  res.json({ data: posts });
});

analyticsRouter.post("/analytics/timeseries", async (req,res) => {
  const { userId} = req.body;
  const posts = await PostAnalytics.find({
    user_id: userId 
  }).sort({ posted_at: 1 });

  const series = posts.map(p => ({
    date: p.posted_at,
    likes: p.metrics.likes || 0,
    comments: p.metrics.comments || 0,
    shares: p.metrics.shares || 0
  }));

  res.json({ data: series });
});

export default analyticsRouter;