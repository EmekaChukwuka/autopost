import {
    createCompletion,
    createStreamingCompletion,
  } from "../services/deepseekService.js";
  
  export const chatWithDeepseek = async (req, res, next) => {
    try {
      const { prompt, platform, tone } = req.body;
        const message = {prompt, platform, tone};
      if (!message) {
        return res.status(400).json({
          status: false,
          message: "Message is required",
        });
      }
  
      const response = await createCompletion(message);
  
      return res.status(200).json({
        status: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  };
  
  export const chatWithStreamDeepseek = async (req, res, next) => {
    try {
      const { message } = req.body;
  
      if (!message) {
        return res.status(400).json({
          status: false,
          message: "Message is required",
        });
      }
  
      const stream = await createStreamingCompletion(message);
  
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
  
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
  
      res.end();
    } catch (error) {
      next(error);
    }
  };