import userModel from "../models/user.model.js";
import * as userService from "../services/user.service.js";
import { validationResult } from "express-validator";
import redisClient from "../services/radis.service.js";

export const createUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await userService.createUser(req.body);
        const token = await user.generateJWT();

        delete user._doc.password;

        console.log("User Created Successfully");
        console.log("User Data: ", user);
        console.log("Generated Token: ", token);

        return res.status(201).json({ user, token });
    } catch (err) {
        console.log("Error Creating User: ", err);
        return res.status(500).json({ error: err.message });
    }
};

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await userModel.findOne({ email: req.body.email }).select(
            "+password"
        );
        if (!user) {
            console.log("Invalid Credentials");
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        const isValid = await user.isValidPassword(req.body.password);
        if (!isValid) {
            console.log("Invalid Credentials");
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        const token = await user.generateJWT();
        delete user._doc.password;
        console.log("User Logged In Successfully");
        console.log("User Data: ", user);
        console.log("Generated Token: ", token);

        return res.status(200).json({ user, token });
    } catch (err) {
        console.log("Error Logging In User: ", err);
        return res.status(500).json({ error: err.message });
    }
};

export const profileUserController = async (req, res) => {
    console.log(req.user);
    return res.status(200).json({ user: req.user });
};

export const logoutUserController = async (req, res) => {
    try {
        const token = req.cookies.token || req.header('Authorization').replace(/^Bearer\s+/i, '');

        if (!token) {
            console.log("UnAuthorized User");
            return res.status(401).json({ error: "UnAuthorized User" });
        }

        redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);
        console.log("User Logged Out Successfully");
        return res.status(200).json({ message: "Logout Successfully" });
    } catch (error) {
        console.log("Error Logging Out User: ", error);
        return res.status(500).json({ error: error.message });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const allUsers = await userService.getAllUsers({userId: loggedInUser._id});
        console.log("All Users Retrieved Successfully");
        console.log("Users Data: ", allUsers);
        return res.status(200).json({ users: allUsers });
    } catch (error) {
        console.log("Error Retrieving All Users: ", error);
        return res.status(500).json({ error: error.message });
    }
}