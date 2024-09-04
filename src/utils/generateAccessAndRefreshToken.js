import { User } from "../models/user.model.js";
import { asyncHandler } from "./asyncHandler.js";
import { ApiError } from "./ApiError.js";

const generateAccessAndRefreshToken = asyncHandler(async function (user) {
    const userObj =
        typeof user === "object" && user?._id
            ? user
            : await User.findById(user);

    if (!userObj) throw new ApiError(401, "User Not Found");

    const accessToken = await userObj.generateAccessToken();
    const refreshToken = await userObj.generateRefreshToken();

    userObj.refreshToken = refreshToken;
    await userObj.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
});

export { generateAccessAndRefreshToken };
