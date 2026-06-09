import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // const uploadResult = await cloudinary.uploader
        const res = await cloudinary.uploader.upload
            (localFilePath, {
                resource_type: "auto"
            })
        // file has been uploaded successfull
        // console.log("file is upload on cloudinary", res.url);
        fs.unlinkSync(localFilePath);
        return res;

    } catch (err) {
        console.error("Cloudinary Error:", err);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null
    }
}

export { uploadOnCloudinary }