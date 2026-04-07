import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import generateToken from "../utils/generateToken.js";
import mockStore from "../services/mockStore.js";
import { isDatabaseEnabled } from "../services/runtimeConfig.js";

const getRoleDetails = async (user) => {
  if (!isDatabaseEnabled) {
    return mockStore.getRoleDetails(user);
  }

  if (user.role === "student") {
    return Student.findOne({ user: user._id }).select("name email department year joinedClubs profilePic");
  }

  if (user.role === "teacher") {
    return Teacher.findOne({ user: user._id }).select("name email department designation profilePic");
  }

  return null;
};

const sendAuthSuccess = async (req, res, user, { redirect = false } = {}) => {
  const payload = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);
  const roleDetails = await getRoleDetails(user);

  const profile = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic,
    roleDetails,
  };

  const clientOrigins = process.env.CLIENT_URL?.split(",").map((origin) => origin.trim()).filter(Boolean);

  if (redirect && clientOrigins?.length) {
    const [primaryOrigin] = clientOrigins;

    try {
      const redirectUrl = new URL("/auth/callback", primaryOrigin);
      redirectUrl.searchParams.set("success", "true");
      redirectUrl.searchParams.set("token", token);
      redirectUrl.searchParams.set("profile", JSON.stringify(profile));

      if (req.query?.state) {
        redirectUrl.searchParams.set("state", String(req.query.state));
      }

      return res.redirect(302, redirectUrl.toString());
    } catch (error) {
      console.error("Failed to build OAuth redirect URL", error);
    }
  }

  return res.status(200).json({ success: true, message: "Authentication successful", data: { token, user: profile } });
};

/**
 * Sends the OAuth result to the client along with a freshly minted JWT.
 */
export const handleGoogleCallback = async (req, res, user, info) => {
  if (info?.message === "Invalid domain") {
    return res.status(403).json({ success: false, message: "Invalid domain", data: null });
  }

  if (!user) {
    const message = info?.message || "Authentication failed";
    return res.status(401).json({ success: false, message, data: null });
  }

  return sendAuthSuccess(req, res, user, { redirect: true });
};

export const handleDevLogin = async (req, res) => {
  if (isDatabaseEnabled) {
    return res.status(400).json({
      success: false,
      message: "Dev login is only available when the backend is running without a database",
      data: null,
    });
  }

  const email = req.body?.email?.toString().trim().toLowerCase();
  const requestedRole = mockStore.normalizeRole(req.body?.role);
  const name = req.body?.name?.toString().trim() || "";

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required", data: null });
  }

  const user = mockStore.upsertDevUser({ name, email, role: requestedRole });
  return sendAuthSuccess(req, res, user);
};
