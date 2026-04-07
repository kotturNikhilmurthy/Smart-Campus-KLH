import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Announcement from "../models/Announcement.js";
import Event from "../models/Event.js";
import LostItem from "../models/LostItem.js";
import Poll from "../models/Poll.js";
import Resource from "../models/Resource.js";
import Feedback from "../models/Feedback.js";
import { LOST_FOUND_UPLOAD_BASE_PATH } from "../middleware/uploadMiddleware.js";
import path from "path";
import mockStore from "../services/mockStore.js";
import { isDatabaseEnabled } from "../services/runtimeConfig.js";

/**
 * Returns the authenticated user profile along with role-specific details.
 */
export const getCurrentUser = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized", data: null });
  }

  const user = isDatabaseEnabled ? await User.findById(userId).select("-__v") : mockStore.findUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found", data: null });
  }

  let roleDetails = null;

  if (!isDatabaseEnabled) {
    roleDetails = mockStore.getRoleDetails(user);
  } else if (user.role === "student") {
    roleDetails = await Student.findOne({ user: user._id })
      .populate("joinedClubs", "name category")
      .select("department year joinedClubs profilePic");
  } else if (user.role === "teacher") {
    roleDetails = await Teacher.findOne({ user: user._id })
      .populate("managedEvents", "title date location")
      .select("department designation managedEvents profilePic");
  }

  return res.status(200).json({
    success: true,
    message: "User profile fetched",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      roleDetails,
    },
  });
};

/**
 * Retrieves announcements sorted by pinned status and recency.
 */
export const getAnnouncements = async (req, res) => {
  const announcements = isDatabaseEnabled
    ? await Announcement.find({}).sort({ isPinned: -1, postedAt: -1 })
    : mockStore.getAnnouncements();
  return res.status(200).json({ success: true, message: "Announcements fetched", data: announcements });
};

/**
 * Allows administrators to create announcements for the campus.
 */
export const createAnnouncement = async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden", data: null });
  }

  const { title, content, category, isPinned } = req.body;
  const sanitizedTitle = title?.toString().trim();
  const sanitizedContent = content?.toString().trim();
  const sanitizedCategory = category?.toString().trim() || "General";

  if (!sanitizedTitle || !sanitizedContent) {
    return res.status(400).json({ success: false, message: "Title and content are required", data: null });
  }

  const announcement = isDatabaseEnabled
    ? await Announcement.create({
        title: sanitizedTitle,
        content: sanitizedContent,
        category: sanitizedCategory,
        isPinned: Boolean(isPinned),
        postedBy: req.user.name,
        postedAt: new Date(),
      })
    : mockStore.createAnnouncement({
        title: sanitizedTitle,
        content: sanitizedContent,
        category: sanitizedCategory,
        isPinned: Boolean(isPinned),
        postedBy: req.user.name,
      });

  return res.status(201).json({ success: true, message: "Announcement created", data: announcement });
};

/**
 * Removes an announcement (admin only).
 */
export const deleteAnnouncement = async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden", data: null });
  }

  const announcementId = req.params.announcementId;
  const deleted = isDatabaseEnabled
    ? await Announcement.findByIdAndDelete(announcementId)
    : mockStore.deleteAnnouncement(announcementId);

  if (!deleted) {
    return res.status(404).json({ success: false, message: "Announcement not found", data: null });
  }

  return res.status(200).json({ success: true, message: "Announcement deleted", data: null });
};

/**
 * Returns all campus events ordered by date.
 */
export const getEvents = async (req, res) => {
  const events = isDatabaseEnabled ? await Event.find({}).sort({ date: 1 }) : mockStore.getEvents();
  return res.status(200).json({ success: true, message: "Events fetched", data: events });
};

/**
 * Adds the authenticated user as an attendee for the provided event.
 */
export const rsvpEvent = async (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized", data: null });
  }

  if (!isDatabaseEnabled) {
    const event = mockStore.rsvpEvent(eventId, userId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found", data: null });
    }

    return res.status(200).json({ success: true, message: "RSVP recorded", data: event });
  }

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found", data: null });
  }

  if (event.hasAttendee(userId)) {
    return res.status(200).json({ success: true, message: "Already RSVP'd", data: event });
  }

  event.attendees.push(userId);
  await event.save();

  return res.status(200).json({ success: true, message: "RSVP recorded", data: event });
};

/**
 * Lists lost-and-found items ordered by recency.
 */
export const getLostItems = async (req, res) => {
  const items = isDatabaseEnabled ? await LostItem.find({}).sort({ createdAt: -1 }) : mockStore.getLostItems();
  return res.status(200).json({ success: true, message: "Lost & found items fetched", data: items });
};

/**
 * Creates a lost-or-found item entry.
 */
export const createLostItem = async (req, res) => {
  const { title, description, category, location, date, status, imageUrl, studentId } = req.body;
  const uploadedImage = req.file;

  const sanitizedTitle = title?.toString().trim();
  const sanitizedDescription = description?.toString().trim();
  const sanitizedLocation = location?.toString().trim();
  const sanitizedStudentId = studentId?.toString().trim();

  if (!sanitizedTitle || !sanitizedDescription || !sanitizedLocation || !sanitizedStudentId) {
    return res.status(400).json({ success: false, message: "Title, description, location, and student ID are required", data: null });
  }

  if (!/^\d{10}$/.test(sanitizedStudentId)) {
    return res.status(400).json({ success: false, message: "Student ID must be a 10-digit number", data: null });
  }

  let parsedDate = date ? new Date(date) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    parsedDate = new Date();
  }

  const allowedStatuses = ["lost", "found", "claimed"];
  const normalizedStatusInput = status?.toString().trim().toLowerCase();
  const normalizedStatus = allowedStatuses.includes(normalizedStatusInput) ? normalizedStatusInput : "lost";

  let resolvedImageUrl = imageUrl?.toString().trim() || "";

  if (uploadedImage) {
    resolvedImageUrl = path.posix.join(LOST_FOUND_UPLOAD_BASE_PATH, uploadedImage.filename);
  }

  const item = isDatabaseEnabled
    ? await LostItem.create({
        title: sanitizedTitle,
        description: sanitizedDescription,
        category: (category || "Others").toString().trim(),
        location: sanitizedLocation,
        date: parsedDate,
        status: normalizedStatus,
        imageUrl: resolvedImageUrl,
        studentId: sanitizedStudentId,
        reportedBy: req.user?.id || null,
      })
    : mockStore.createLostItem({
        title: sanitizedTitle,
        description: sanitizedDescription,
        category: (category || "Others").toString().trim(),
        location: sanitizedLocation,
        date: parsedDate.toISOString(),
        status: normalizedStatus,
        imageUrl: resolvedImageUrl,
        studentId: sanitizedStudentId,
        reportedBy: req.user?.id || null,
      });

  return res.status(201).json({ success: true, message: "Item submitted", data: item });
};

/**
 * Updates the status of a lost item (e.g., mark as found or claimed).
 */
export const updateLostItemStatus = async (req, res) => {
  const itemId = req.params.itemId;
  const { status } = req.body;
  const allowedStatuses = ["lost", "found", "claimed"];
  const normalizedStatus = status?.toString().trim().toLowerCase();

  if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ success: false, message: "Invalid status", data: null });
  }

  const item = isDatabaseEnabled
    ? await LostItem.findByIdAndUpdate(itemId, { status: normalizedStatus }, { new: true })
    : mockStore.updateLostItemStatus(itemId, normalizedStatus);
  if (!item) {
    return res.status(404).json({ success: false, message: "Item not found", data: null });
  }

  return res.status(200).json({ success: true, message: "Item status updated", data: item });
};

/**
 * Returns polls annotated with the authenticated user's vote.
 */
export const getPolls = async (req, res) => {
  if (!isDatabaseEnabled) {
    return res.status(200).json({
      success: true,
      message: "Polls fetched",
      data: mockStore.getPollsForUser(req.user?.id),
    });
  }

  const polls = await Poll.find({}).sort({ createdAt: -1 }).lean();
  const userId = req.user?.id?.toString();

  const enriched = polls.map((poll) => {
    const userVote = poll.votes?.find((vote) => vote.user.toString() === userId);
    return {
      ...poll,
      totalVotes: poll.votes?.length || 0,
      userVote: userVote ? userVote.optionKey : null,
      voted: Boolean(userVote),
    };
  });

  return res.status(200).json({ success: true, message: "Polls fetched", data: enriched });
};

/**
 * Allows any authenticated user to create a poll.
 */
export const createPoll = async (req, res) => {
  const { question, description, options, endDate } = req.body;

  const sanitizedQuestion = question?.toString().trim();
  const sanitizedDescription = description?.toString().trim() || "";

  if (!sanitizedQuestion) {
    return res.status(400).json({ success: false, message: "Question is required", data: null });
  }

  const optionEntries = Array.isArray(options) ? options : [];

  const preparedOptions = optionEntries
    .map((option, index) => {
      const text = (typeof option === "string" ? option : option?.text)?.toString().trim();
      if (!text) {
        return null;
      }

      const providedKey = typeof option === "object" && option !== null ? option.optionKey : undefined;
      const normalizedKey = providedKey?.toString().trim() || `option_${index + 1}`;

      return {
        optionKey: normalizedKey,
        text,
      };
    })
    .filter(Boolean);

  if (preparedOptions.length < 2) {
    return res.status(400).json({ success: false, message: "At least two poll options are required", data: null });
  }

  const pollEndDate = endDate ? new Date(endDate) : null;

  if (!pollEndDate || Number.isNaN(pollEndDate.getTime())) {
    return res.status(400).json({ success: false, message: "A valid end date is required", data: null });
  }

  const poll = isDatabaseEnabled
    ? await Poll.create({
        question: sanitizedQuestion,
        description: sanitizedDescription,
        options: preparedOptions,
        endDate: pollEndDate,
        createdBy: req.user?.id,
      })
    : mockStore.createPoll({
        question: sanitizedQuestion,
        description: sanitizedDescription,
        options: preparedOptions,
        endDate: pollEndDate.toISOString(),
        createdBy: req.user?.id,
      });

  return res.status(201).json({ success: true, message: "Poll created", data: poll });
};

/**
 * Records a vote for the specified poll option.
 */
export const votePoll = async (req, res) => {
  const pollId = req.params.pollId;
  const { optionKey } = req.body;
  const userId = req.user?.id;

  const normalizedOptionKey = optionKey?.toString().trim();

  if (!normalizedOptionKey) {
    return res.status(400).json({ success: false, message: "Option key is required", data: null });
  }

  if (!isDatabaseEnabled) {
    const result = mockStore.votePoll(pollId, userId, normalizedOptionKey);

    if (result.error === "not_found") {
      return res.status(404).json({ success: false, message: "Poll not found", data: null });
    }

    if (result.error === "already_voted") {
      return res.status(400).json({ success: false, message: "User already voted", data: null });
    }

    if (result.error === "invalid_option") {
      return res.status(400).json({ success: false, message: "Invalid option", data: null });
    }

    return res.status(200).json({ success: true, message: "Vote recorded", data: result.poll });
  }

  const poll = await Poll.findById(pollId);
  if (!poll) {
    return res.status(404).json({ success: false, message: "Poll not found", data: null });
  }

  if (poll.hasUserVoted(userId)) {
    return res.status(400).json({ success: false, message: "User already voted", data: null });
  }

  const option = poll.options.find((opt) => opt.optionKey === normalizedOptionKey);
  if (!option) {
    return res.status(400).json({ success: false, message: "Invalid option", data: null });
  }

  option.votes += 1;
  poll.votes.push({ user: userId, optionKey: normalizedOptionKey });
  await poll.save();

  return res.status(200).json({ success: true, message: "Vote recorded", data: poll });
};

/**
 * Lists downloadable resources.
 */
export const getResources = async (req, res) => {
  const resources = isDatabaseEnabled ? await Resource.find({}).sort({ createdAt: -1 }) : mockStore.getResources();
  return res.status(200).json({ success: true, message: "Resources fetched", data: resources });
};

/**
 * Increments the download count for a resource.
 */
export const registerResourceDownload = async (req, res) => {
  const resourceId = req.params.resourceId;

  const resource = isDatabaseEnabled
    ? await Resource.findByIdAndUpdate(
        resourceId,
        { $inc: { downloads: 1 } },
        { new: true }
      )
    : mockStore.registerResourceDownload(resourceId);

  if (!resource) {
    return res.status(404).json({ success: false, message: "Resource not found", data: null });
  }

  return res.status(200).json({ success: true, message: "Download registered", data: resource });
};

/**
 * Stores a feedback entry from a student.
 */
export const submitFeedback = async (req, res) => {
  const { category, description } = req.body;

  const sanitizedCategory = category?.toString().trim();
  const sanitizedDescription = description?.toString().trim();

  if (!sanitizedCategory || !sanitizedDescription) {
    return res.status(400).json({ success: false, message: "Category and description are required", data: null });
  }

  const feedback = isDatabaseEnabled
    ? await Feedback.create({
        category: sanitizedCategory,
        description: sanitizedDescription,
        submittedBy: req.user?.id,
        status: "submitted",
        submittedAt: new Date(),
      })
    : mockStore.submitFeedback({
        category: sanitizedCategory,
        description: sanitizedDescription,
        submittedBy: req.user?.id,
      });

  return res.status(201).json({ success: true, message: "Feedback submitted", data: feedback });
};

/**
 * Returns feedback entries (teachers can view all, students only their own).
 */
export const getFeedback = async (req, res) => {
  if (!isDatabaseEnabled) {
    return res.status(200).json({
      success: true,
      message: "Feedback fetched",
      data: mockStore.getFeedbackForUser({ _id: req.user.id, role: req.user.role }),
    });
  }

  let query = {};

  if (req.user?.role === "student") {
    query = { submittedBy: req.user.id };
  }

  const feedback = await Feedback.find(query).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, message: "Feedback fetched", data: feedback });
};
