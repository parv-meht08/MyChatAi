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

        return res.status(201).json({ user, token });
    } catch (err) {
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
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        const isValid = await user.isValidPassword(req.body.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        const token = await user.generateJWT();
        delete user._doc.password;
        return res.status(200).json({ user, token });
    } catch (err) {
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
            return res.status(401).json({ error: "UnAuthorized User" });
        }

        redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);
        return res.status(200).json({ message: "Logout Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const allUsers = await userService.getAllUsers({userId: loggedInUser._id});
        return res.status(200).json({ users: allUsers });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}