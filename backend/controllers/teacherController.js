import Teacher from "../models/Teacher.js";
import Event from "../models/Event.js";
import Feedback from "../models/Feedback.js";
import Resource from "../models/Resource.js";
import mockStore from "../services/mockStore.js";
import { isDatabaseEnabled } from "../services/runtimeConfig.js";

/**
 * Provides overview metrics for logged-in teachers.
 */
export const getTeacherDashboardSummary = async (req, res) => {
  if (!isDatabaseEnabled) {
    return res.status(200).json({
      success: true,
      message: "Teacher dashboard summary",
      data: mockStore.getTeacherDashboardSummary(req.user?.id),
    });
  }

  const teacherProfile = await Teacher.findOne({ user: req.user?.id });

  const myEvents = await Event.countDocuments({ createdBy: req.user?.id });
  const resources = await Resource.countDocuments({ uploadedBy: req.user?.id });
  const pendingFeedback = await Feedback.countDocuments({ status: "submitted" });

  return res.status(200).json({
    success: true,
    message: teacherProfile ? "Teacher dashboard summary" : "Teacher profile not found, returning default metrics",
    data: {
      managedEvents: myEvents,
      uploadedResources: resources,
      pendingFeedback,
      teacherProfile,
    },
  });
};

/**
 * Allows teachers to create campus events.
 */
export const createEvent = async (req, res) => {
  const { title, description, date, location, category } = req.body;

  const sanitizedTitle = title?.toString().trim();
  const sanitizedDescription = description?.toString().trim();
  const sanitizedLocation = location?.toString().trim();
  const sanitizedCategory = category?.toString().trim() || "General";

  if (!sanitizedTitle || !sanitizedDescription || !date || !sanitizedLocation) {
    return res.status(400).json({ success: false, message: "Title, description, date, and location are required", data: null });
  }

  const eventDate = new Date(date);
  if (Number.isNaN(eventDate.getTime())) {
    return res.status(400).json({ success: false, message: "Invalid event date", data: null });
  }

  if (!isDatabaseEnabled) {
    const event = mockStore.createEvent({
      title: sanitizedTitle,
      description: sanitizedDescription,
      date: eventDate.toISOString(),
      location: sanitizedLocation,
      category: sanitizedCategory,
      createdBy: req.user?.id,
    });

    return res.status(201).json({ success: true, message: "Event created", data: event });
  }

  const event = await Event.create({
    title: sanitizedTitle,
    description: sanitizedDescription,
    date: eventDate,
    location: sanitizedLocation,
    category: sanitizedCategory,
    createdBy: req.user?.id,
    attendees: [],
  });

  if (req.user?.role === "teacher") {
    await Teacher.findOneAndUpdate(
      { user: req.user?.id },
      { $addToSet: { managedEvents: event._id } },
      { upsert: true, new: true }
    );
  }

  return res.status(201).json({ success: true, message: "Event created", data: event });
};

/**
 * Updates event details created by the teacher.
 */
export const updateEvent = async (req, res) => {
  const eventId = req.params.eventId;
  const updates = req.body;

  if (updates.date) {
    const parsedDate = new Date(updates.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid event date", data: null });
    }
    updates.date = parsedDate;
  }

  if (updates.title) {
    updates.title = updates.title.toString().trim();
  }

  if (updates.description) {
    updates.description = updates.description.toString().trim();
  }

  if (updates.location) {
    updates.location = updates.location.toString().trim();
  }

  if (updates.category) {
    updates.category = updates.category.toString().trim();
  }

  const event = isDatabaseEnabled
    ? await Event.findOneAndUpdate({ _id: eventId, createdBy: req.user?.id }, updates, { new: true })
    : mockStore.updateEvent(eventId, req.user?.id, updates);

  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found", data: null });
  }

  return res.status(200).json({ success: true, message: "Event updated", data: event });
};

/**
 * Removes an event created by the teacher.
 */
export const deleteEvent = async (req, res) => {
  const eventId = req.params.eventId;

  const event = isDatabaseEnabled
    ? await Event.findOneAndDelete({ _id: eventId, createdBy: req.user?.id })
    : mockStore.deleteEvent(eventId, req.user?.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found", data: null });
  }

  await Teacher.findOneAndUpdate(
    { user: req.user?.id },
    { $pull: { managedEvents: eventId } }
  );

  return res.status(200).json({ success: true, message: "Event deleted", data: null });
};

/**
 * Enables teachers to respond to feedback entries.
 */
export const respondToFeedback = async (req, res) => {
  const feedbackId = req.params.feedbackId;
  const { response, status } = req.body;

  const sanitizedResponse = response?.toString().trim();

  if (!sanitizedResponse) {
    return res.status(400).json({ success: false, message: "Response message is required", data: null });
  }

  const allowedStatuses = ["submitted", "in_review", "resolved"];
  const normalizedStatus = status?.toString().trim().toLowerCase();
  const chosenStatus = allowedStatuses.includes(normalizedStatus) ? normalizedStatus : "in_review";

  if (!isDatabaseEnabled) {
    const updated = mockStore.respondToFeedback(feedbackId, req.user?.id, sanitizedResponse, chosenStatus);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Feedback not found", data: null });
    }

    return res.status(200).json({ success: true, message: "Feedback updated", data: updated });
  }

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    return res.status(404).json({ success: false, message: "Feedback not found", data: null });
  }

  feedback.response = sanitizedResponse;
  feedback.status = chosenStatus;
  feedback.respondedBy = req.user?.id;
  await feedback.save();

  return res.status(200).json({ success: true, message: "Feedback updated", data: feedback });
};

/**
 * Allows teachers to upload or register new resources.
 */
export const uploadResource = async (req, res) => {
  const { title, type, department, semester, fileUrl } = req.body;

  const sanitizedTitle = title?.toString().trim();
  const sanitizedType = type?.toString().trim();
  const sanitizedDepartment = department?.toString().trim();
  const sanitizedSemester = semester?.toString().trim();
  const sanitizedFileUrl = fileUrl?.toString().trim();

  if (!sanitizedTitle || !sanitizedType || !sanitizedDepartment || !sanitizedSemester) {
    return res.status(400).json({ success: false, message: "Title, type, department, and semester are required", data: null });
  }

  const resource = isDatabaseEnabled
    ? await Resource.create({
        title: sanitizedTitle,
        type: sanitizedType,
        department: sanitizedDepartment,
        semester: sanitizedSemester,
        fileUrl: sanitizedFileUrl || "",
        uploadedBy: req.user?.id,
        uploaderName: req.user?.name,
      })
    : mockStore.uploadResource({
        title: sanitizedTitle,
        type: sanitizedType,
        department: sanitizedDepartment,
        semester: sanitizedSemester,
        fileUrl: sanitizedFileUrl || "",
        uploadedBy: req.user?.id,
        uploaderName: req.user?.name,
      });

  return res.status(201).json({ success: true, message: "Resource uploaded", data: resource });
};

/**
 * Updates resource metadata (teacher-owned resources only).
 */
export const updateResource = async (req, res) => {
  const resourceId = req.params.resourceId;
  const updates = req.body;

  if (updates.title === "" || updates.type === "" || updates.department === "") {
    return res.status(400).json({ success: false, message: "Resource fields cannot be empty", data: null });
  }

  if (updates.title) {
    updates.title = updates.title.toString().trim();
  }

  if (updates.type) {
    updates.type = updates.type.toString().trim();
  }

  if (updates.department) {
    updates.department = updates.department.toString().trim();
  }

  if (updates.semester) {
    updates.semester = updates.semester.toString().trim();
  }

  if (updates.fileUrl) {
    updates.fileUrl = updates.fileUrl.toString().trim();
  }

  const resource = isDatabaseEnabled
    ? await Resource.findOneAndUpdate({ _id: resourceId, uploadedBy: req.user?.id }, updates, { new: true })
    : mockStore.updateResource(resourceId, req.user?.id, updates);
  if (!resource) {
    return res.status(404).json({ success: false, message: "Resource not found", data: null });
  }

  return res.status(200).json({ success: true, message: "Resource updated", data: resource });
};

/**
 * Deletes a resource uploaded by the teacher.
 */
export const deleteResource = async (req, res) => {
  const resourceId = req.params.resourceId;

  const resource = isDatabaseEnabled
    ? await Resource.findOneAndDelete({ _id: resourceId, uploadedBy: req.user?.id })
    : mockStore.deleteResource(resourceId, req.user?.id);
  if (!resource) {
    return res.status(404).json({ success: false, message: "Resource not found", data: null });
  }

  return res.status(200).json({ success: true, message: "Resource deleted", data: null });
};
