import express from "express";
import compression from "compression"; // Compression
import helmet from "helmet"; // Helmet
import cors from "cors"; //cors
import bodyParser from "body-parser";
import morgan from "morgan";
import http from "http";
import path from "path";
import authRouter from "./routes/auth.route";
import agentRouter from "./routes/agent.route";
import communityRouter from "./routes/community.route";
import propertyRouter from "./routes/property.route";
import testimonialRouter from "./routes/testimonial.route";
import instagramRouter from "./routes/instagram.route";
import contactRouter from "./routes/contact.route";
import conciergeRouter from "./routes/concierge.route";
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(bodyParser.json());
app.use(compression());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.disable("x-powered-by");

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const apiVersion = "/api/v1";

app.use(`${apiVersion}/auth`, authRouter);
app.use(`${apiVersion}/agent`, agentRouter);
app.use(`${apiVersion}/community`, communityRouter);
app.use(`${apiVersion}/property`, propertyRouter);
app.use(`${apiVersion}/testimonial`, testimonialRouter);
app.use(`${apiVersion}/instagram`, instagramRouter);
app.use(`${apiVersion}/contact`, contactRouter);
app.use(`${apiVersion}/concierge`, conciergeRouter);
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
