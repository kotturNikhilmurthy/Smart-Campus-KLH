import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import mockStore from "../services/mockStore.js";
import { isDatabaseEnabled } from "../services/runtimeConfig.js";

const parseDomainList = (value, fallback) =>
  value
    ? value
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    : fallback;

const isEmailFromAllowedDomain = (email, allowedDomains) =>
  allowedDomains?.some((domain) => email.endsWith(domain)) ?? false;

const STUDENT_DOMAINS = parseDomainList(process.env.ALLOWED_STUDENT_DOMAINS, ["@klh.edu.in"]);
const STAFF_DOMAINS = parseDomainList(process.env.ALLOWED_STAFF_DOMAINS, []);

/**
 * Registers Google OAuth strategies for both student and teacher login flows.
 */
const configurePassport = (passport) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback";

  if (!clientId || !clientSecret) {
    console.warn("Google OAuth credentials are not configured. OAuth routes will fail.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret,
        callbackURL,
        passReqToCallback: true,
        scope: ["profile", "email"],
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const state = typeof req.query.state === "string" ? req.query.state.toLowerCase() : "";
          const requestedRole = state === "teacher" ? "teacher" : state === "admin" ? "admin" : "student";
          const isStaffRole = requestedRole === "teacher" || requestedRole === "admin";
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const name = profile.displayName || "Unnamed User";
          const profilePic = profile.photos?.[0]?.value || "";

          if (!email) {
            return done(null, false, { message: "Unable to read Google account email" });
          }

          if (requestedRole === "student" && !isEmailFromAllowedDomain(email, STUDENT_DOMAINS)) {
            return done(null, false, { message: "Invalid domain" });
          }

          if (isStaffRole && STAFF_DOMAINS.length && !isEmailFromAllowedDomain(email, STAFF_DOMAINS)) {
            return done(null, false, { message: "Invalid domain" });
          }

          let user;

          if (!isDatabaseEnabled) {
            user = mockStore.upsertOAuthUser({
              name,
              email,
              googleId: profile.id,
              profilePic,
              role: requestedRole,
            });
          } else {
            user = await User.findOne({ googleId: profile.id });

            if (!user) {
              user = await User.create({
                name,
                email,
                googleId: profile.id,
                profilePic,
                role: requestedRole,
              });
            } else {
              user.name = name;
              user.email = email;
              user.profilePic = profilePic;
              user.role = requestedRole;
              await user.save();
            }

            if (requestedRole === "student") {
              await Student.findOneAndUpdate(
                { user: user._id },
                {
                  user: user._id,
                  name,
                  email,
                  googleId: profile.id,
                  profilePic,
                  role: "student",
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
            } else if (requestedRole === "teacher") {
              await Teacher.findOneAndUpdate(
                { user: user._id },
                {
                  user: user._id,
                  name,
                  email,
                  googleId: profile.id,
                  profilePic,
                  role: "teacher",
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
