import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { asyncHandler } from "./asyncHandler.js";

cloudinary.config({
    cloud_name: process.env.CLUODINARY_CLOUD_NAME,
    api_key: process.env.CLUODINARY_API_KEY,
    api_secret: process.env.CLUODINARY_API_SECRET,
    secure: true,
});

function getFilePublicId(fileUrl) {
    const urlPartsArray = fileUrl.split("/");
    const filePublicId = urlPartsArray
        .slice(urlPartsArray.indexOf("upload") + 2)
        .join("/")
        .split(".")[0];
    return filePublicId;
}

const uploadOnCloudnary = async function (localFilePath, folder = "BlogPosts") {
    try {
        if (!localFilePath) {
            console.log("File not found");
            return null;
        } else {
            const response = await cloudinary.uploader.upload(localFilePath, {
                folder: folder,
                resource_type: "auto",
            });
            fs.unlinkSync(localFilePath); // remove the file from local server
            return response.url;
        }
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the file from local server
        console.log("File Upload Filed On Cloudinary \n", error);
        return null;
    }
};

const deleteFromCloudinary = asyncHandler(async function (
    fileUrl,
    folder = "BlogPosts"
) {
    try {
        if (!fileUrl) console.log("File Cloud Url not found");
        const filePublicId = getFilePublicId(fileUrl);
        await cloudinary.uploader.destroy(filePublicId);
    } catch (error) {
        console.log("file delete failed on cloudinary", error);
    }
});

export { uploadOnCloudnary, deleteFromCloudinary };
