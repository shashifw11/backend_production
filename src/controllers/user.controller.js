import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js"; 
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req,res)=>{
   // get usr details from frontend
   // validation
   // check if user already exists
   // check for images , check for avtar
   // upload them to cloudinary
   // create user object- create entry in db
   // remove password and refresh token field from resonce
   // check for user creation
   // return response


    // get usr details from frontend
   const {fullName , email , username,password} = req.body

   // validation
//    if(fullName === ""){
//     throw new ApiError(400 , "fullname is required")
//    } 
           // pro method for checking 
    if(
        [fullName , email , username , password].some((field)=>
            field?.trim()==="")
    ){
        throw new ApiError(400,"All fileds are required")
    }

      // check if user already exists
    const existUser =   User.findeOne({
        $or: [{username}, {emil}]
      })

      if(existUser){
        throw ApiError(409 , "User with email or username")
      }
   
         // check for images , check for avtar
          
        const avtarLocalPath =  req.files?.avatar[0]?.path
        const coverImageLocalpath = req.files?.coverImage[0]?.path;
        
        if(!avtarLocalPath){
            throw new ApiError(400 , "Avtar file is required");
        }
        
         const avatar = await uploadOnCloudinary(avtarLocalPath);
         const coverImage = await uploadOnCloudinary(coverImageLocalpath);

         if(!avatar){
            throw new ApiError(400 , "Avtar file is required");
         }

        const user = await  User.create({
            fullName,
            avatar : avatar.url,
            coverImage : coverImage?.url || "" , 
            email,
            password,
            username : username.toLowerCase()
         })
    
    const createdUser = await User.findById(user._id).select(
        "-password - refreshToken"        // these two fileds are not comes after selected
    ) 

    if(!createdUser){
          throw new ApiError(500 , "Something went wrong while registering the user")
    }
       
    return res.status(201).json(
        new ApiResponse(200, createdUser , "user registred successfully")
    )
})
 


export {registerUser}