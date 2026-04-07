import Student from "../models/Student.js";
import Club from "../models/Club.js";
import Event from "../models/Event.js";
import Poll from "../models/Poll.js";
import Resource from "../models/Resource.js";
import mockStore from "../services/mockStore.js";
import { isDatabaseEnabled } from "../services/runtimeConfig.js";

/**
 * Supplies high-level dashboard metrics tailored for students.
 */
export const getStudentDashboardSummary = async (req, res) => {
  if (!isDatabaseEnabled) {
    return res.status(200).json({
      success: true,
      message: "Student dashboard summary",
      data: mockStore.getStudentDashboardSummary(req.user?.id),
    });
  }

  const userId = req.user?.id;
  const studentProfile = await Student.findOne({ user: userId }).populate("joinedClubs", "name");

  const joinedClubs = studentProfile?.joinedClubs?.length || 0;
  const activeEvents = await Event.countDocuments({ date: { $gte: new Date() } });
  const availableResources = await Resource.countDocuments({});
  const openPolls = await Poll.countDocuments({ endDate: { $gte: new Date() } });

  return res.status(200).json({
    success: true,
    message: studentProfile ? "Student dashboard summary" : "Student profile not found, returning default metrics",
    data: {
      joinedClubs,
      activeEvents,
      availableResources,
      openPolls,
    },
  });
};

/**
 * Returns all clubs marking those already joined by the student.
 */
const shapeClub = (club, joinedClubIds = new Set()) => ({
  id: club._id.toString(),
  name: club.name,
  description: club.description,
  category: club.category,
  members: Array.isArray(club.members) ? club.members.length : 0,
  eventCount: Array.isArray(club.eventsHosted) ? club.eventsHosted.length : 0,
  joined: joinedClubIds.has(club._id.toString()),
  createdAt: club.createdAt,
  updatedAt: club.updatedAt,
});

/**
 * Returns all clubs, annotating joined status for students.
 */
export const getClubs = async (req, res) => {
  if (!isDatabaseEnabled) {
    return res.status(200).json({
      success: true,
      message: "Clubs fetched",
      data: mockStore.getClubsForUser({ _id: req.user?.id, role: req.user?.role }),
    });
  }

  let joinedClubIds = new Set();

  if (req.user?.role === "student") {
    const student = await Student.findOne({ user: req.user?.id }).select("joinedClubs");
    joinedClubIds = new Set(student?.joinedClubs?.map((clubId) => clubId.toString()) || []);
  }

  const clubs = await Club.find({}).lean({ virtuals: true });
  const shaped = clubs.map((club) => shapeClub(club, joinedClubIds));

  return res.status(200).json({ success: true, message: "Clubs fetched", data: shaped });
};

/**
 * Allows administrators to create a new student club.
 */
export const createClub = async (req, res) => {
  const { name, description, category } = req.body;

  const sanitizedName = name?.toString().trim();
  const sanitizedDescription = description?.toString().trim();
  const sanitizedCategory = category?.toString().trim();

  if (!sanitizedName || !sanitizedDescription || !sanitizedCategory) {
    return res.status(400).json({ success: false, message: "Name, description, and category are required", data: null });
  }

  const existing = await Club.findOne({ name: sanitizedName });
  if (existing) {
    return res.status(409).json({ success: false, message: "A club with this name already exists", data: null });
  }

  if (!isDatabaseEnabled) {
    const created = mockStore.createClub({
      name: sanitizedName,
      description: sanitizedDescription,
      category: sanitizedCategory,
    });

    return res.status(201).json({
      success: true,
      message: "Club created",
      data: created,
    });
  }

  const club = await Club.create({
    name: sanitizedName,
    description: sanitizedDescription,
    category: sanitizedCategory,
    members: [],
    eventsHosted: [],
  });

  return res.status(201).json({
    success: true,
    message: "Club created",
    data: shapeClub(club.toObject({ virtuals: true }), new Set()),
  });
};

/**
 * Allows administrators to remove a club and clean up memberships.
 */
export const deleteClub = async (req, res) => {
  const clubId = req.params.clubId;

  if (!isDatabaseEnabled) {
    const deleted = mockStore.deleteClub(clubId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }

    return res.status(200).json({ success: true, message: "Club deleted", data: null });
  }

  const deleted = await Club.findByIdAndDelete(clubId);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Club not found", data: null });
  }

  await Student.updateMany({}, { $pull: { joinedClubs: clubId } });

  return res.status(200).json({ success: true, message: "Club deleted", data: null });
};

/**
 * Adds the student to a club membership list.
 */
export const joinClub = async (req, res) => {
  const clubId = req.params.clubId;

  if (!isDatabaseEnabled) {
    const club = mockStore.joinClub(clubId, req.user?.id);
    if (!club) {
      return res.status(404).json({ success: false, message: "Student profile or club not found", data: null });
    }

    return res.status(200).json({ success: true, message: "Joined club", data: club });
  }

  const student = await Student.findOne({ user: req.user?.id });

  if (!student) {
    return res.status(404).json({ success: false, message: "Student profile not found", data: null });
  }

  const club = await Club.findById(clubId);
  if (!club) {
    return res.status(404).json({ success: false, message: "Club not found", data: null });
  }

  club.members = club.members || [];

  const alreadyJoined = student.joinedClubs.some((id) => id.toString() === clubId);
  if (!alreadyJoined) {
    student.joinedClubs.push(clubId);
  }

  const memberAlreadyPresent = club.members.some((memberId) => memberId.toString() === req.user.id);
  if (!memberAlreadyPresent) {
    club.members.push(req.user.id);
  }

  await Promise.all([student.save(), club.save()]);

  return res.status(200).json({ success: true, message: "Joined club", data: club });
};

/**
 * Removes the student from the club membership list.
 */
export const leaveClub = async (req, res) => {
  const clubId = req.params.clubId;

  if (!isDatabaseEnabled) {
    const club = mockStore.leaveClub(clubId, req.user?.id);
    if (!club) {
      return res.status(404).json({ success: false, message: "Student profile or club not found", data: null });
    }

    return res.status(200).json({ success: true, message: "Left club", data: club });
  }

  const student = await Student.findOne({ user: req.user?.id });

  if (!student) {
    return res.status(404).json({ success: false, message: "Student profile not found", data: null });
  }

  const club = await Club.findById(clubId);
  if (!club) {
    return res.status(404).json({ success: false, message: "Club not found", data: null });
  }

  club.members = club.members || [];

  student.joinedClubs = student.joinedClubs.filter((id) => id.toString() !== clubId);
  club.members = club.members.filter((memberId) => memberId.toString() !== req.user.id);

  await Promise.all([student.save(), club.save()]);

  return res.status(200).json({ success: true, message: "Left club", data: club });
};
