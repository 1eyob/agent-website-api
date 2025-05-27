import express, { RequestHandler } from "express";
import axios from "axios";

const router = express.Router();

router.post("/embed", (async (req, res) => {
  try {
    const { postUrl } = req.body;

    // Validate the URL
    if (!postUrl || !postUrl.includes("instagram.com/p/")) {
      return res.status(400).json({ error: "Invalid Instagram post URL" });
    }

    // Get access token from environment variable
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      return res
        .status(500)
        .json({ error: "Instagram access token not configured" });
    }

    // Make request to Instagram oEmbed API
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/instagram_oembed?url=${encodeURIComponent(
        postUrl
      )}&access_token=${accessToken}`
    );

    console.log("Instagram API Response:", response.data);

    if (!response.data || !response.data.html) {
      return res
        .status(400)
        .json({ error: "Invalid response from Instagram API" });
    }

    // Return the embed code
    res.json({ embedCode: response.data.html });
  } catch (error: any) {
    console.error(
      "Error fetching Instagram embed:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to fetch Instagram embed",
      details: error.response?.data || error.message,
    });
  }
}) as RequestHandler);

export default router;
