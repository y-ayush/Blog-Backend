import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    getUserName,
} from "../controllers/user.controllers.js";

const router = Router();

//register route
router.route("/register").post(registerUser);

//login route
router.route("/login").post(loginUser);

//logout route
router.route("/logout").post(verifyJwt, logoutUser);

//getCurrentUserRoute
router.route("/get-current-user").get(verifyJwt, getCurrentUser);

//getUserName
router.route("/id/:userId").get(verifyJwt, getUserName);

//refreshAcessToken
router.route("/refresh-token").post(refreshAccessToken);

export default router;
