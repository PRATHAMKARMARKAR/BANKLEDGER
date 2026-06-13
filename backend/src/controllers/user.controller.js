import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { User} from "../models/user.models.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";



const generateAccessTokenANDRefreshToken = async(userId) => {
   try{
       const user =  await User.findById(userId)
       const accessToken =  user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
   }
    catch(error){
        throw new ApiError(500, "TOKEN GENERATION WENT WRONG")
    }
};
const registerUser = asyncHandler(async (req, res) => {

    const { fullName, username, email, password } = req.body;

    if (!fullName || !username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (userExists) {
        throw new ApiError(
            409,
            "User with the same username or email already exists"
        );
    }

    const user = await User.create({
        fullName,
        username,
        email,
        password
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User created successfully"
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const {email, username, password} = req.body;
    if(!(email || username)){
        throw new ApiError(400, "Email or username is required")
    }
    const user = await User.findOne(
        email ? {email} : {username}
    )
    if(!user){
        throw new ApiError(404, "User not found")
    }

    if(!password){
        throw new ApiError(400, "Password is required")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials")
    }

    const {accessToken, refreshToken} = await generateAccessTokenANDRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        htttpOnly: true,
        secure: true
     
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            200,{
            user: loggedInUser,accessToken,refreshToken
        },
            "Login successful"

        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { refreshToken: null });

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Logout successful"
        )
    )
})
export { registerUser, loginUser, logoutUser };