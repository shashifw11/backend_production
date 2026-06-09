import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (err) {
        console.error("ACTUAL ERROR:", err);
        throw err;
        // throw new ApiError(500, "Something went wrong while generating refresh and sccess token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get usr details from frontend
    // validation
    // check if user already exists
    // check for images , check for avatar
    // upload them to cloudinary
    // create user object- create entry in db
    // remove password and refresh token field from resonce
    // check for user creation
    // return response


    // get usr details from frontend
    const { fullName, email, username, password } = req.body

    // validation
    //    if(fullName === ""){
    //     throw new ApiError(400 , "fullname is required")
    //    } 
    // pro method for checking 
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fileds are required")
    }

    // check if user already exists
    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    // check for images , check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalpath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatarLocalPath not found");
    }

    console.log("avatarLocalPath:", avatarLocalPath);

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Cloudinary response:", avatar);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"       // these two fileds are not comes after selected
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registred successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // req body => data
    // username or email
    // find the user 
    // password check 
    // access and refresh token 
    // send secure cookie


    // req body => data
    console.log(req.body)
    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }] // fimd the user either based on username or email
    })

    if (!user) {
        throw new ApiError(404, "Username does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalied user credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,   // if you do  httpOnly : true and secure:true than it will be modified by only by server not by frontend
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User looged In Successfully"

            ),

        )
})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }

        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User looged Out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        if (!user.refreshToken || incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token expired or already used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { newAccessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken
                    },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid old password")
    }

    user.password = newPassword 
    await user.save({validateBeforeSave : false})
  
    return res 
    .status(200)
    .json(new ApiResponse(200 ,{} ,"Password Changed sucessfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200, req.user , "current user fetched sucessfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
      const {fullName , email} = req.body
      if(!fullName || !email){
        throw new ApiError(400 , "All fields are required")
      }

      User.findByIdAndUpdate(
        req.user?._id , 
        {
          $set:{
            fullName , 
            email : email
          }
        },
          {new : true}
      ).select("-passowrd")  // remove password and send to the user
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
     const avatarLocalpath = req.file?.path

     if(!avatarLocalPath){
        throw new ApiError(400 , "Avtar file is missing")
     }

     const avatar = await uploadOnCloudinary(avatarLocalpath)

     if(!avatar.url){
        throw new ApiError(400 , "Error while uploading on avatar")
     }

     await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar : avatar.url
            }
        },
        {new : true}
     ).select("-passowrd")

    return res
     .status(200)
     .json(
        new ApiResponse(200,user , "Avatar updated sucessfully")
     )
})

const coverImageLocalpath = asyncHandler(async(req,res)=>{
     const coverImageLocalpath = req.file?.path

     if(!avatarLocalPath){
        throw new ApiError(400 , "Cover Image file is missing")
     }

     const coverImage = await uploadOnCloudinary(coverImageLocalpath)

     if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading on coverImage")
     }

     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage : coverImage.url
            }
        },
        {new : true}
     ).select("-passowrd")

     return res
     .status(200)
     .json(
        new ApiResponse(200,user , "Cover image updated sucessfully")
     )
})






export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    coverImageLocalpath,
}