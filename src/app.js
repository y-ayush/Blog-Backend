import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler } from "./utils/errorHandler.js";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

// routes
app.get("/api/v1/hello", (req, res) => {
    res.json({
        message: "Hello User",
        advice: "Why are you still here? Go get a life 👋",
    });
});

//user route
import userRoutes from "./routes/user.routes.js";
app.use("/api/v1/users", userRoutes);

//post route
import postRoutes from "./routes/post.routes.js";
app.use("/api/v1/posts", postRoutes);

app.use(errorHandler);

export { app };
