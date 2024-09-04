import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

import {
    createPost,
    viewPost,
    deletePost,
    updatePost,
    getAllPosts,
    getUserPosts,
} from "../controllers/post.controllers.js";

const router = Router();

//createPost
router
    .route("/create")
    .post(verifyJwt, upload.single("featuredImage"), createPost);

//viewPost
router.route("/:slug").get(verifyJwt, viewPost);

//DeletePost
router.route("/:slug").delete(verifyJwt, deletePost);

//updatePost
router
    .route("/:slug")
    .patch(verifyJwt, upload.single("featuredImage"), updatePost);

//getAllPosts
router.route("/all/posts").get(verifyJwt, getAllPosts);

//GetUserPosts
router.route("/user/:userId").get(verifyJwt, getUserPosts);

export default router;
