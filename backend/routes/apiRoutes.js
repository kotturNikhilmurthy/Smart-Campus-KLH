import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { getClubs, createClub, deleteClub } from "../controllers/studentController.js";
import {
  getCurrentUser,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getEvents,
  rsvpEvent,
  getLostItems,
  createLostItem,
  updateLostItemStatus,
  getPolls,
  votePoll,
  getResources,
  registerResourceDownload,
  submitFeedback,
  getFeedback,
  createPoll,
} from "../controllers/userController.js";
import { createEvent } from "../controllers/teacherController.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadLostFoundImage } from "../middleware/uploadMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/user/me", asyncHandler(getCurrentUser));

router.get("/announcements", asyncHandler(getAnnouncements));
router.post("/announcements", requireRole("admin"), asyncHandler(createAnnouncement));
router.delete("/announcements/:announcementId", requireRole("admin"), asyncHandler(deleteAnnouncement));

router.get("/events", asyncHandler(getEvents));
router.post("/events", requireRole("teacher", "admin"), asyncHandler(createEvent));
router.post("/events/:eventId/rsvp", asyncHandler(rsvpEvent));

router.get("/lost-found", asyncHandler(getLostItems));
router.post("/lost-found", uploadLostFoundImage, asyncHandler(createLostItem));
router.patch("/lost-found/:itemId/status", requireRole("teacher", "admin"), asyncHandler(updateLostItemStatus));

router.get("/polls", asyncHandler(getPolls));
router.post("/polls", asyncHandler(createPoll));
router.post("/polls/:pollId/vote", asyncHandler(votePoll));

router.get("/resources", asyncHandler(getResources));
router.post("/resources/:resourceId/download", asyncHandler(registerResourceDownload));

router.post("/feedback", asyncHandler(submitFeedback));
router.get("/feedback", asyncHandler(getFeedback));

router.get("/clubs", asyncHandler(getClubs));
router.post("/clubs", requireRole("admin"), asyncHandler(createClub));
router.delete("/clubs/:clubId", requireRole("admin"), asyncHandler(deleteClub));

export default router;
