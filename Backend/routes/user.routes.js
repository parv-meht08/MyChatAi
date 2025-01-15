import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register",
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 3 }).withMessage("Password must be at least 3 characters"),
    userController.createUserController
);

router.post("/login",
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 3 }).withMessage("Password must be at least 3 characters"),
    userController.loginUserController
);

router.get("/profile", authMiddleware.authUser, userController.profileUserController);

router.get("/logout", authMiddleware.authUser, userController.logoutUserController);

router.get("/all", authMiddleware.authUser, userController.getAllUsers);
export default router;