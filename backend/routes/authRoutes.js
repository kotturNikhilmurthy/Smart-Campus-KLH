import { Router } from "express";
import passport from "passport";
import { handleDevLogin, handleGoogleCallback } from "../controllers/authController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/google/student",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: "student",
    prompt: "select_account",
  })
);

router.get(
  "/google/teacher",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: "teacher",
    prompt: "select_account",
  })
);

router.get(
  "/google/admin",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: "admin",
    prompt: "select_account",
  })
);

router.post("/dev-login", asyncHandler(handleDevLogin));

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    if (err) {
      return next(err);
    }

    try {
      await handleGoogleCallback(req, res, user, info);
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

export default router;
