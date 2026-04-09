import generateToken from "../utils/generateToken.js";
import mockStore from "../services/mockStore.js";
const sendAuthSuccess = (res, user) => {
  const payload = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);
  const roleDetails = mockStore.getRoleDetails(user);

  const profile = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic,
    roleDetails,
  };

  return res.status(200).json({ success: true, message: "Authentication successful", data: { token, user: profile } });
};

export const loginUser = async (req, res) => {
  const email = req.body?.email?.toString().trim().toLowerCase();
  const password = req.body?.password?.toString() || "";

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required", data: null });
  }

  const user = mockStore.authenticateUser({ email, password });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password", data: null });
  }

  return sendAuthSuccess(res, user);
};

export const registerUser = async (req, res) => {
  const name = req.body?.name?.toString().trim() || "";
  const email = req.body?.email?.toString().trim().toLowerCase();
  const password = req.body?.password?.toString() || "";
  const role = mockStore.normalizeRole(req.body?.role);

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required", data: null });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters", data: null });
  }

  const user = mockStore.registerUser({ name, email, password, role });
  return sendAuthSuccess(res, user);
};
