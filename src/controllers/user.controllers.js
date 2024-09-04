import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessAndRefreshToken } from "../utils/generateAccessAndRefreshToken.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const cookiesOption = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
};

const registerUser = asyncHandler(async function (req, res, next) {
    const { name, email, password } = req.body;

    if ([name, email, password].some((e) => e.trim() == ""))
        throw new ApiError(
            400,
            "Registration failed: Name, email, and password are required."
        );

    let userExistFlag = await User.findOne({ email });

    if (userExistFlag)
        throw new ApiError(
            400,
            "Registration failed: An account with this email already exists. Please log in."
        );

    const user = await User.create({
        name,
        email,
        password,
    });

    if (!user)
        throw new ApiError(
            500,
            "Internal Server Error, User Registration Failed."
        );

    user.password = undefined;
    user.refreshToken = undefined;

    res.status(201).json(
        new ApiResponse(
            201,
            user,
            "Registration successful: User account created."
        )
    );
});

const loginUser = asyncHandler(async function (req, res, next) {
    const { email, password } = req?.body;

    if (!(email && password))
        throw new ApiError(
            401,
            "Login failed: Email and password are required."
        );

    const user = await User.findOne({ email });

    if (!user)
        throw new ApiError(
            401,
            "Login failed: No account found with this email. Please register."
        );

    let isPasswordCorrectFlag = await user.isPasswordCorrect(password);

    if (!isPasswordCorrectFlag)
        throw new ApiError(
            401,
            "Login failed: Incorrect password. Please try again."
        );

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user
    );

    user.refreshToken = undefined;
    user.password = undefined;

    res.status(200)
        .cookie("accessToken", accessToken, cookiesOption)
        .cookie("refreshToken", refreshToken, cookiesOption)
        .json(new ApiResponse(200, user, "Login successful: Welcome back!"));
});

const getCurrentUser = asyncHandler(async function (req, res, next) {
    const user = req?.user;
    if (!user)
        throw new ApiError(
            401,
            "Access denied: Please log in to view this information."
        );

    res.status(200).json(
        new ApiResponse(200, user, "User details retrieved successfully.")
    );
});

const getUserName = asyncHandler(async function (req, res, next) {
    const user = req.user;
    if (!user)
        throw new ApiError(
            401,
            "Access denied: Please log in to view this information."
        );

    let reqUserId = req?.params?.userId;
    if (!reqUserId) throw new ApiError(404, "Invalid Url");

    reqUserId = new mongoose.Types.ObjectId(reqUserId);

    const newUser = await User.findById(reqUserId, "name");
    if (!newUser) throw new ApiError(404, "Requested user is unavaliable");

    res.status(200).json(new ApiResponse(200, newUser, "Fetched successfully"));
});

const logoutUser = asyncHandler(async function (req, res, next) {
    const userId = req?.user?._id;

    if (!userId) throw new ApiError(401, "Logout failed: User not recognized.");

    await User.findByIdAndUpdate(
        userId,
        {
            $unset: { refreshToken: "" },
        },
        {
            new: true,
        }
    );

    res.status(200)
        .clearCookie("accessToken", cookiesOption)
        .clearCookie("refreshToken", cookiesOption)
        .json(
            new ApiResponse(
                200,
                {},
                "Logout successful: You have been logged out."
            )
        );
});

const refreshAccessToken = asyncHandler(async function (req, res, next) {
    const IncommingRefreshToken =
        req?.cookies?.refreshToken ||
        req?.header("Authorization")?.replace("Bearer ", "");

    if (!IncommingRefreshToken || IncommingRefreshToken === "undefined")
        throw new ApiError(
            401,
            "Token refresh failed: Refresh token is missing or invalid."
        );

    const decodeRefreshToken = jwt.verify(
        IncommingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodeRefreshToken)
        throw new ApiError(
            401,
            "Token refresh failed: Invalid refresh token provided."
        );

    const user = await User.findById(decodeRefreshToken?._id).select(
        "-password"
    );

    if (!user)
        throw new ApiError(
            401,
            "Token refresh failed: Invalid refresh token provided."
        );

    if (IncommingRefreshToken !== user?.refreshToken)
        throw new ApiError(
            401,
            "Token refresh failed: Invalid refresh token provided."
        );

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        decodeRefreshToken._id
    );

    user.refreshToken = undefined;

    res.status(200)
        .cookie("accessToken", accessToken, cookiesOption)
        .cookie("refreshToken", refreshToken, cookiesOption)
        .json(
            new ApiResponse(
                200,
                user,
                "Token refresh successful: New tokens issued."
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    getUserName,
    refreshAccessToken,
};
