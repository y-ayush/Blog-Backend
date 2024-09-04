import { v4 as uuidv4 } from "uuid";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudnary,
} from "../utils/cloudinary.js";
import mongoose from "mongoose";

const createPost = asyncHandler(async function (req, res, next) {
    const user = req?.user;
    const owner = user?._id;
    if (!owner) throw new ApiError(401, "User not found : Please Login");

    const { slug, title, content, status } = req?.body;
    if ([slug, title, content, status].some((e) => e.trim() === ""))
        throw new ApiError(400, "Post's Data Is Incomplete");

    const featuredImageLocalPath = req?.file?.path || null;

    const featuredImageUrl = !featuredImageLocalPath
        ? ""
        : await uploadOnCloudnary(featuredImageLocalPath);

    const post = await Post.create({
        slug: `${slug}-${uuidv4()}`,
        title,
        content,
        owner,
        status,
        featuredImageUrl,
    });

    res.status(201).json(
        new ApiResponse(201, post, "Post Created Successfully")
    );
});

const viewPost = asyncHandler(async function (req, res, next) {
    const user = req?.user;
    if (!user)
        throw new ApiError(401, "Unauthorized Request :: User Is Missing");

    const { slug } = req.params;
    if (!slug) throw new ApiError(404, "Slug is missing :: Post not found");

    const post = await Post.findOne({ slug: slug });
    if (!post) throw new ApiError(404, "Invalid Url :: Post Not found");
    const ownerId = new mongoose.Types.ObjectId(post?.owner);

    const creator = await User.findById(ownerId).select(
        "-password -refreshToken -email "
    );
    if (!creator) throw new ApiError(404, "Somethingh went worng ");

    post.owner = creator;

    res.status(200).json(
        new ApiResponse(200, post, "Post Fetched Successfully")
    );
});

const deletePost = asyncHandler(async function (req, res, next) {
    const user = req?.user;
    if (!user)
        throw new ApiError(401, "Unauthorized Request :: User Is Missing");

    let owner = user._id;
    owner = new mongoose.Types.ObjectId(owner);

    const { slug } = req.params;
    if (!slug) throw new ApiError(404, "Invalid Slug :: Post Not Found");

    const post = await Post.findOneAndDelete({ slug, owner });
    if (!post) throw new ApiError(500, "Deletion Failed");

    await deleteFromCloudinary(post.featuredImageUrl);

    res.status(200).json(new ApiResponse(200, {}, "Post Deleted Successfully"));
});

const updatePost = asyncHandler(async function (req, res, next) {
    const user = req?.user;
    if (!user)
        throw new ApiError(401, "Unauthorized Request :: User Is Missing");

    const { slug } = req?.params;
    if (!slug) throw new ApiError(404, "Slug is Missing :: Post not found");

    const { slug: newSlug, title, content, status } = req?.body;
    const featuredImageLocalPath = req?.file?.path;

    if ([newSlug, title, content, status].some((e) => e.trim() === ""))
        throw new ApiError(400, "Post's Data Is Incomplete");

    const post = await Post.findOne({ slug, owner: user._id });
    if (!post) throw new ApiError(404, "Invalid Slug :: Post not found");

    if (featuredImageLocalPath) {
        try {
            const featuredImageUrl = await uploadOnCloudnary(
                featuredImageLocalPath
            );
            if (featuredImageUrl && post.featuredImageUrl)
                await deleteFromCloudinary(post.featuredImageUrl);

            post.featuredImageUrl = featuredImageUrl;
        } catch (error) {
            throw new ApiError(500, "Image Upload failed");
        }
    }

    if (post.title !== title) post.title = title;
    if (post.content !== content) post.content = content;
    if (post.slug !== newSlug) post.slug = `${newSlug}-${uuidv4()}`;
    if (post.status !== status) post.status = status;

    await post.save({ validateBeforeSave: true });

    res.status(200).json(
        new ApiResponse(200, post, "Post Update successfully")
    );
});

const getAllPosts = asyncHandler(async function (req, res, next) {
    const user = req?.user;
    const page = parseInt(req.query.page, 10) || 1;
    if (page < 1) throw new ApiError(400, "Invalid Page No.");
    const limit = 12;
    const skip = (page - 1) * limit;

    if (!user)
        throw new ApiError(400, "Unauthorized Request :: Login Required");

    const posts = await Post.find(
        { status: true },
        "title slug featuredImageUrl"
    )
        .skip(skip)
        .limit(limit + 1) // Fetch one extra document
        .sort({ createdAt: -1 });

    const hasMorePosts = posts.length > limit;

    if (hasMorePosts) {
        posts.pop(); // Remove the extra document to return the correct number of posts
    }
    if (posts?.length < 1)
        res.status(204).json(new ApiResponse(204, [], "No Posts Found"));
    res.status(200).json(
        new ApiResponse(
            200,
            { posts, hasMorePosts },
            "Posts fetched Successfully"
        )
    );
});

const getUserPosts = asyncHandler(async function (req, res, next) {
    const user = req?.user;
    let userId = req?.params?.userId;
    if (!userId) throw new ApiError(404, "Invalid Request");

    userId = new mongoose.Types.ObjectId(req.params.userId);

    if (!user)
        throw new ApiError(400, "Unauthorized Request :: Login Required");

    let conditions = { owner: userId };

    if (!user._id.equals(userId)) {
        conditions.status = true;
    }

    const posts = await Post.find(
        conditions,
        "title slug featuredImageUrl status",
        {
            sort: { createdAt: -1 },
        }
    );

    if (posts?.length < 1)
        res.status(204).json(new ApiResponse(204, [], "No Posts Found"));
    res.status(200).json(
        new ApiResponse(200, posts, "Posts fetched Successfully")
    );
});

export {
    createPost,
    viewPost,
    deletePost,
    updatePost,
    getAllPosts,
    getUserPosts,
};
