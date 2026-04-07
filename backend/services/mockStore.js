import { randomUUID } from "crypto";

const clone = (value) => JSON.parse(JSON.stringify(value));
const nowIso = () => new Date().toISOString();
const createId = (prefix) => `${prefix}_${randomUUID()}`;

const createUser = ({ name, email, role, googleId = "", profilePic = "" }) => ({
  _id: createId("user"),
  name,
  email: email.toLowerCase(),
  googleId,
  profilePic,
  role,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const createStudentProfile = (user) => ({
  _id: createId("student"),
  user: user._id,
  name: user.name,
  email: user.email,
  googleId: user.googleId || "",
  profilePic: user.profilePic || "",
  role: "student",
  department: "CSE",
  year: "1",
  joinedClubs: [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const createTeacherProfile = (user) => ({
  _id: createId("teacher"),
  user: user._id,
  name: user.name,
  email: user.email,
  googleId: user.googleId || "",
  profilePic: user.profilePic || "",
  role: "teacher",
  department: "General",
  designation: "Faculty",
  managedEvents: [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const state = {
  users: [],
  students: [],
  teachers: [],
  announcements: [],
  events: [],
  lostItems: [],
  polls: [],
  resources: [],
  feedback: [],
  clubs: [],
};

const ensureRoleProfile = (user) => {
  if (user.role === "student" && !state.students.find((entry) => entry.user === user._id)) {
    state.students.push(createStudentProfile(user));
  }

  if (user.role === "teacher" && !state.teachers.find((entry) => entry.user === user._id)) {
    state.teachers.push(createTeacherProfile(user));
  }
};

const getUserRoleDetails = (user) => {
  if (!user) {
    return null;
  }

  if (user.role === "student") {
    const student = state.students.find((entry) => entry.user === user._id);
    if (!student) {
      return null;
    }

    return {
      department: student.department,
      year: student.year,
      joinedClubs: student.joinedClubs
        .map((clubId) => state.clubs.find((club) => club._id === clubId))
        .filter(Boolean)
        .map((club) => ({ _id: club._id, name: club.name, category: club.category })),
      profilePic: student.profilePic,
    };
  }

  if (user.role === "teacher") {
    const teacher = state.teachers.find((entry) => entry.user === user._id);
    if (!teacher) {
      return null;
    }

    return {
      department: teacher.department,
      designation: teacher.designation,
      managedEvents: teacher.managedEvents
        .map((eventId) => state.events.find((event) => event._id === eventId))
        .filter(Boolean)
        .map((event) => ({ _id: event._id, title: event.title, date: event.date, location: event.location })),
      profilePic: teacher.profilePic,
    };
  }

  return null;
};

const createSeedData = () => {
  const admin = createUser({
    name: "Campus Admin",
    email: "admin@smartcampus.local",
    role: "admin",
  });
  const teacher = createUser({
    name: "Demo Faculty",
    email: "faculty@smartcampus.local",
    role: "teacher",
  });
  const student = createUser({
    name: "Demo Student",
    email: "student@klh.edu.in",
    role: "student",
  });

  state.users.push(admin, teacher, student);
  ensureRoleProfile(teacher);
  ensureRoleProfile(student);

  const roboticsClub = {
    _id: createId("club"),
    name: "Robotics Club",
    description: "Hands-on projects, contests, and campus demos.",
    category: "Technical",
    members: [student._id],
    eventsHosted: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const literaryClub = {
    _id: createId("club"),
    name: "Literary Circle",
    description: "Debates, poetry, writing workshops, and reading sessions.",
    category: "Creative",
    members: [],
    eventsHosted: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.clubs.push(roboticsClub, literaryClub);
  const seededStudent = state.students.find((entry) => entry.user === student._id);
  if (seededStudent) {
    seededStudent.joinedClubs.push(roboticsClub._id);
  }

  state.announcements.push(
    {
      _id: createId("announcement"),
      title: "Welcome to Smart Campus",
      content: "The app is currently running in local memory mode for development.",
      category: "General",
      isPinned: true,
      postedBy: admin.name,
      postedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      _id: createId("announcement"),
      title: "Robotics Workshop",
      content: "Join the weekend workshop in the innovation lab.",
      category: "Events",
      isPinned: false,
      postedBy: teacher.name,
      postedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
  );

  const event = {
    _id: createId("event"),
    title: "Campus Orientation",
    description: "A guided orientation for students to explore clubs and facilities.",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    location: "Main Auditorium",
    category: "Campus",
    createdBy: teacher._id,
    attendees: [student._id],
    attendeeCount: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.events.push(event);
  const seededTeacher = state.teachers.find((entry) => entry.user === teacher._id);
  if (seededTeacher) {
    seededTeacher.managedEvents.push(event._id);
  }

  state.resources.push({
    _id: createId("resource"),
    title: "Engineering Mathematics Notes",
    type: "PDF",
    department: "CSE",
    semester: "1",
    uploadedBy: teacher._id,
    uploaderName: teacher.name,
    downloads: 0,
    fileUrl: "https://example.com/demo-resource.pdf",
    uploadedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  state.polls.push({
    _id: createId("poll"),
    question: "What should be the next club event theme?",
    description: "Help us pick the next flagship student event.",
    options: [
      { optionKey: "option_1", text: "Hackathon", votes: 1 },
      { optionKey: "option_2", text: "Startup Pitch", votes: 0 },
      { optionKey: "option_3", text: "Design Sprint", votes: 0 },
    ],
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdBy: admin._id,
    votes: [{ user: student._id, optionKey: "option_1" }],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
};

createSeedData();

const normalizeRole = (role) => {
  const normalized = String(role || "student").trim().toLowerCase();
  if (normalized === "faculty") {
    return "teacher";
  }
  if (normalized === "teacher" || normalized === "admin") {
    return normalized;
  }
  return "student";
};

const sortByNewest = (items, field = "createdAt") =>
  clone(items).sort((left, right) => new Date(right[field]).getTime() - new Date(left[field]).getTime());

const sortByOldest = (items, field = "date") =>
  clone(items).sort((left, right) => new Date(left[field]).getTime() - new Date(right[field]).getTime());

const store = {
  normalizeRole,

  findUserById(userId) {
    const user = state.users.find((entry) => entry._id === userId);
    return user ? clone(user) : null;
  },

  getRoleDetails(user) {
    return clone(getUserRoleDetails(user));
  },

  upsertOAuthUser({ name, email, googleId, profilePic, role }) {
    const normalizedRole = normalizeRole(role);
    const normalizedEmail = String(email || "").trim().toLowerCase();
    let user = state.users.find((entry) => entry.googleId === googleId) || state.users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      user = createUser({ name, email: normalizedEmail, role: normalizedRole, googleId, profilePic });
      state.users.push(user);
    } else {
      user.name = name;
      user.email = normalizedEmail;
      user.googleId = googleId;
      user.profilePic = profilePic || "";
      user.role = normalizedRole;
      user.updatedAt = nowIso();
    }

    ensureRoleProfile(user);
    return clone(user);
  },

  upsertDevUser({ name, email, role }) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const existing = state.users.find((entry) => entry.email === normalizedEmail);
    const normalizedRole = normalizeRole(role || existing?.role || "student");

    if (existing) {
      if (name) {
        existing.name = name;
      }
      existing.role = normalizedRole;
      existing.updatedAt = nowIso();
      ensureRoleProfile(existing);
      return clone(existing);
    }

    const fallbackName = name?.trim() || normalizedEmail.split("@")[0] || "Campus User";
    const user = createUser({ name: fallbackName, email: normalizedEmail, role: normalizedRole });
    state.users.push(user);
    ensureRoleProfile(user);
    return clone(user);
  },

  getAnnouncements() {
    return clone(state.announcements).sort((left, right) => {
      if (left.isPinned !== right.isPinned) {
        return left.isPinned ? -1 : 1;
      }
      return new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime();
    });
  },

  createAnnouncement({ title, content, category, isPinned, postedBy }) {
    const announcement = {
      _id: createId("announcement"),
      title,
      content,
      category,
      isPinned: Boolean(isPinned),
      postedBy,
      postedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.announcements.unshift(announcement);
    return clone(announcement);
  },

  deleteAnnouncement(announcementId) {
    const index = state.announcements.findIndex((entry) => entry._id === announcementId);
    if (index === -1) {
      return null;
    }
    const [deleted] = state.announcements.splice(index, 1);
    return clone(deleted);
  },

  getEvents() {
    return sortByOldest(state.events, "date").map((event) => ({
      ...event,
      attendeeCount: event.attendees.length,
    }));
  },

  createEvent({ title, description, date, location, category, createdBy }) {
    const event = {
      _id: createId("event"),
      title,
      description,
      date,
      location,
      category,
      createdBy,
      attendees: [],
      attendeeCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.events.push(event);

    const teacher = state.teachers.find((entry) => entry.user === createdBy);
    if (teacher && !teacher.managedEvents.includes(event._id)) {
      teacher.managedEvents.push(event._id);
      teacher.updatedAt = nowIso();
    }

    return clone(event);
  },

  updateEvent(eventId, userId, updates) {
    const event = state.events.find((entry) => entry._id === eventId && entry.createdBy === userId);
    if (!event) {
      return null;
    }

    Object.assign(event, updates, { updatedAt: nowIso() });
    event.attendeeCount = event.attendees.length;
    return clone(event);
  },

  deleteEvent(eventId, userId) {
    const index = state.events.findIndex((entry) => entry._id === eventId && entry.createdBy === userId);
    if (index === -1) {
      return null;
    }

    const [deleted] = state.events.splice(index, 1);
    const teacher = state.teachers.find((entry) => entry.user === userId);
    if (teacher) {
      teacher.managedEvents = teacher.managedEvents.filter((id) => id !== eventId);
      teacher.updatedAt = nowIso();
    }

    return clone(deleted);
  },

  rsvpEvent(eventId, userId) {
    const event = state.events.find((entry) => entry._id === eventId);
    if (!event) {
      return null;
    }

    if (!event.attendees.includes(userId)) {
      event.attendees.push(userId);
      event.updatedAt = nowIso();
    }

    event.attendeeCount = event.attendees.length;
    return clone(event);
  },

  getLostItems() {
    return sortByNewest(state.lostItems);
  },

  createLostItem(payload) {
    const item = {
      _id: createId("lost"),
      ...payload,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.lostItems.unshift(item);
    return clone(item);
  },

  updateLostItemStatus(itemId, status) {
    const item = state.lostItems.find((entry) => entry._id === itemId);
    if (!item) {
      return null;
    }
    item.status = status;
    item.updatedAt = nowIso();
    return clone(item);
  },

  getPollsForUser(userId) {
    return sortByNewest(state.polls).map((poll) => {
      const userVote = poll.votes.find((vote) => vote.user === userId);
      return clone({
        ...poll,
        totalVotes: poll.votes.length,
        userVote: userVote ? userVote.optionKey : null,
        voted: Boolean(userVote),
      });
    });
  },

  createPoll({ question, description, options, endDate, createdBy }) {
    const poll = {
      _id: createId("poll"),
      question,
      description,
      options: options.map((option) => ({ ...option, votes: 0 })),
      endDate,
      createdBy,
      votes: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.polls.unshift(poll);
    return clone({ ...poll, totalVotes: 0, userVote: null, voted: false });
  },

  votePoll(pollId, userId, optionKey) {
    const poll = state.polls.find((entry) => entry._id === pollId);
    if (!poll) {
      return { error: "not_found" };
    }

    if (poll.votes.some((vote) => vote.user === userId)) {
      return { error: "already_voted" };
    }

    const option = poll.options.find((entry) => entry.optionKey === optionKey);
    if (!option) {
      return { error: "invalid_option" };
    }

    option.votes += 1;
    poll.votes.push({ user: userId, optionKey });
    poll.updatedAt = nowIso();

    return {
      poll: clone({
        ...poll,
        totalVotes: poll.votes.length,
        userVote: optionKey,
        voted: true,
      }),
    };
  },

  getResources() {
    return sortByNewest(state.resources, "uploadedAt");
  },

  registerResourceDownload(resourceId) {
    const resource = state.resources.find((entry) => entry._id === resourceId);
    if (!resource) {
      return null;
    }
    resource.downloads += 1;
    resource.updatedAt = nowIso();
    return clone(resource);
  },

  uploadResource({ title, type, department, semester, fileUrl, uploadedBy, uploaderName }) {
    const resource = {
      _id: createId("resource"),
      title,
      type,
      department,
      semester,
      fileUrl,
      uploadedBy,
      uploaderName,
      downloads: 0,
      uploadedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.resources.unshift(resource);
    return clone(resource);
  },

  updateResource(resourceId, userId, updates) {
    const resource = state.resources.find((entry) => entry._id === resourceId && entry.uploadedBy === userId);
    if (!resource) {
      return null;
    }
    Object.assign(resource, updates, { updatedAt: nowIso() });
    return clone(resource);
  },

  deleteResource(resourceId, userId) {
    const index = state.resources.findIndex((entry) => entry._id === resourceId && entry.uploadedBy === userId);
    if (index === -1) {
      return null;
    }
    const [deleted] = state.resources.splice(index, 1);
    return clone(deleted);
  },

  submitFeedback({ category, description, submittedBy }) {
    const feedback = {
      _id: createId("feedback"),
      category,
      description,
      status: "submitted",
      submittedBy,
      response: "",
      respondedBy: null,
      submittedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.feedback.unshift(feedback);
    return clone(feedback);
  },

  getFeedbackForUser(user) {
    const entries =
      user.role === "student"
        ? state.feedback.filter((entry) => entry.submittedBy === user._id)
        : state.feedback;

    return sortByNewest(entries, "submittedAt");
  },

  respondToFeedback(feedbackId, userId, response, status) {
    const feedback = state.feedback.find((entry) => entry._id === feedbackId);
    if (!feedback) {
      return null;
    }
    feedback.response = response;
    feedback.status = status;
    feedback.respondedBy = userId;
    feedback.updatedAt = nowIso();
    return clone(feedback);
  },

  getClubsForUser(user) {
    const joinedClubIds =
      user.role === "student"
        ? state.students.find((entry) => entry.user === user._id)?.joinedClubs || []
        : [];

    return clone(state.clubs).map((club) => ({
      id: club._id,
      name: club.name,
      description: club.description,
      category: club.category,
      members: club.members.length,
      eventCount: club.eventsHosted.length,
      joined: joinedClubIds.includes(club._id),
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    }));
  },

  createClub({ name, description, category }) {
    const club = {
      _id: createId("club"),
      name,
      description,
      category,
      members: [],
      eventsHosted: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.clubs.push(club);
    return clone({
      id: club._id,
      name: club.name,
      description: club.description,
      category: club.category,
      members: 0,
      eventCount: 0,
      joined: false,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    });
  },

  deleteClub(clubId) {
    const index = state.clubs.findIndex((entry) => entry._id === clubId);
    if (index === -1) {
      return null;
    }

    const [deleted] = state.clubs.splice(index, 1);
    state.students.forEach((student) => {
      student.joinedClubs = student.joinedClubs.filter((id) => id !== clubId);
      student.updatedAt = nowIso();
    });

    return clone(deleted);
  },

  joinClub(clubId, userId) {
    const club = state.clubs.find((entry) => entry._id === clubId);
    const student = state.students.find((entry) => entry.user === userId);
    if (!club || !student) {
      return null;
    }

    if (!student.joinedClubs.includes(clubId)) {
      student.joinedClubs.push(clubId);
      student.updatedAt = nowIso();
    }

    if (!club.members.includes(userId)) {
      club.members.push(userId);
      club.updatedAt = nowIso();
    }

    return clone(club);
  },

  leaveClub(clubId, userId) {
    const club = state.clubs.find((entry) => entry._id === clubId);
    const student = state.students.find((entry) => entry.user === userId);
    if (!club || !student) {
      return null;
    }

    student.joinedClubs = student.joinedClubs.filter((id) => id !== clubId);
    student.updatedAt = nowIso();
    club.members = club.members.filter((id) => id !== userId);
    club.updatedAt = nowIso();

    return clone(club);
  },

  getStudentDashboardSummary(userId) {
    const student = state.students.find((entry) => entry.user === userId);
    return {
      joinedClubs: student?.joinedClubs.length || 0,
      activeEvents: state.events.filter((entry) => new Date(entry.date) >= new Date()).length,
      availableResources: state.resources.length,
      openPolls: state.polls.filter((entry) => new Date(entry.endDate) >= new Date()).length,
    };
  },

  getTeacherDashboardSummary(userId) {
    const teacher = state.teachers.find((entry) => entry.user === userId);
    return {
      managedEvents: state.events.filter((entry) => entry.createdBy === userId).length,
      uploadedResources: state.resources.filter((entry) => entry.uploadedBy === userId).length,
      pendingFeedback: state.feedback.filter((entry) => entry.status === "submitted").length,
      teacherProfile: teacher ? clone(teacher) : null,
    };
  },
};

export default store;
