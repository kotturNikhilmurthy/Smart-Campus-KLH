import { useMemo } from "react";
import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IconProps } from "phosphor-react";
import {
  BellSimpleRinging,
  CalendarBlank,
  CalendarCheck,
  ChartBar,
  ChartLineUp,
  ChatCircleDots,
  ClipboardText,
  MagnifyingGlass,
  MegaphoneSimple,
  Books,
  Files,
  SignOut,
  UserCircle,
  UsersThree,
} from "phosphor-react";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";

interface EventSummary {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  attendees?: string[];
  attendeeCount?: number;
  createdAt: string;
  createdBy?: string;
}

interface AnnouncementSummary {
  _id: string;
  title: string;
  content: string;
  category: string;
  postedAt: string;
  postedBy: string;
  isPinned: boolean;
}

interface LostItemSummary {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  date?: string;
}

interface FeedbackSummary {
  _id: string;
  category: string;
  status: string;
  submittedAt: string;
}

interface StudentDashboardSummary {
  joinedClubs: number;
  activeEvents: number;
  availableResources: number;
  openPolls: number;
}

interface TeacherDashboardSummary {
  managedEvents: number;
  uploadedResources: number;
  pendingFeedback: number;
}

type IconComponent = ComponentType<IconProps>;

type QuickStat = {
  label: string;
  value: string | number;
  icon: IconComponent;
  color: string;
};

type ActivityItem = {
  action: string;
  time: string;
  icon: IconComponent;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: isAuthLoading } = useAuth();

  const { data: announcements = [], isLoading: isAnnouncementsLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<AnnouncementSummary[]>("/api/announcements"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const { data: events = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.get<EventSummary[]>("/api/events"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const { data: lostItems = [], isLoading: isLostItemsLoading } = useQuery({
    queryKey: ["lost-items"],
    queryFn: () => api.get<LostItemSummary[]>("/api/lost-found"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const { data: feedback = [], isLoading: isFeedbackLoading } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => api.get<FeedbackSummary[]>("/api/feedback"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const { data: studentSummary } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => api.get<StudentDashboardSummary>("/api/student/dashboard"),
    enabled: currentUser?.role === "student",
    staleTime: 1000 * 60,
  });

  const { data: teacherSummary } = useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: () => api.get<TeacherDashboardSummary>("/api/teacher/dashboard"),
    enabled: currentUser?.role === "teacher",
    staleTime: 1000 * 60,
  });

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    navigate("/auth");
  };

  const isLoading =
    isAuthLoading ||
    isAnnouncementsLoading ||
    isEventsLoading ||
    isLostItemsLoading ||
    isFeedbackLoading;

  const quickStats = useMemo<QuickStat[]>(() => {
    if (!currentUser) {
      return [];
    }

    if (currentUser.role === "student" && studentSummary) {
      return [
        { label: "Joined Clubs", value: studentSummary.joinedClubs, icon: UsersThree, color: "text-primary" },
        { label: "Active Events", value: studentSummary.activeEvents, icon: CalendarCheck, color: "text-accent" },
        { label: "Resources", value: studentSummary.availableResources, icon: Books, color: "text-green-400" },
        { label: "Open Polls", value: studentSummary.openPolls, icon: ChartBar, color: "text-purple-400" },
      ];
    }

    if (currentUser.role === "teacher" && teacherSummary) {
      return [
        { label: "My Events", value: teacherSummary.managedEvents, icon: CalendarCheck, color: "text-primary" },
        { label: "Resources", value: teacherSummary.uploadedResources, icon: Files, color: "text-accent" },
        { label: "Feedback Queue", value: teacherSummary.pendingFeedback, icon: ChatCircleDots, color: "text-green-400" },
        { label: "Announcements", value: announcements.length, icon: MegaphoneSimple, color: "text-purple-400" },
      ];
    }

    return [
      { label: "Announcements", value: announcements.length, icon: MegaphoneSimple, color: "text-primary" },
      {
        label: "Upcoming Events",
        value: events.filter((event) => new Date(event.date || event.createdAt) >= new Date()).length,
        icon: CalendarBlank,
        color: "text-accent",
      },
      { label: "Active Feedback", value: feedback.filter((item) => item.status !== "resolved").length, icon: ChatCircleDots, color: "text-green-400" },
      { label: "Lost & Found", value: lostItems.length, icon: MagnifyingGlass, color: "text-purple-400" },
    ];
  }, [announcements.length, currentUser, events, feedback, lostItems.length, studentSummary, teacherSummary]);

  const recentActivities = useMemo(() => {
    const activityItems: ActivityItem[] = [];

    events.slice(0, 5).forEach((event) => {
      activityItems.push({
        action: `Event • ${event.title}`,
        time: new Date(event.date || event.createdAt).toLocaleString(),
        icon: CalendarBlank,
      });
    });

    announcements.slice(0, 5).forEach((announcement) => {
      activityItems.push({
        action: `Announcement • ${announcement.title}`,
        time: new Date(announcement.postedAt).toLocaleString(),
        icon: MegaphoneSimple,
      });
    });

    feedback.slice(0, 5).forEach((item) => {
      activityItems.push({
        action: `Feedback (${item.status}) • ${item.category}`,
        time: new Date(item.submittedAt).toLocaleString(),
        icon: ChatCircleDots,
      });
    });

    lostItems.slice(0, 5).forEach((item) => {
      activityItems.push({
        action: `Lost & Found • ${item.title} (${item.status})`,
        time: new Date(item.createdAt || item.date || new Date().toISOString()).toLocaleString(),
        icon: ClipboardText,
      });
    });

    return activityItems
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [announcements, events, feedback, lostItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">SC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Smart Campus</h1>
                <p className="text-sm text-muted-foreground">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="capitalize">
                {currentUser.role}
              </Badge>
              <Button variant="ghost" size="icon">
                <BellSimpleRinging className="w-5 h-5" weight="duotone" />
              </Button>
              <Button variant="ghost" size="icon">
                <UserCircle className="w-5 h-5" weight="duotone" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <SignOut className="w-5 h-5" weight="duotone" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">{currentUser.email}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const StatIcon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                      <StatIcon className="w-6 h-6" weight="duotone" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="group hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer border-border/50 hover:border-primary/50" onClick={() => navigate("/events")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                  <CalendarCheck className="w-6 h-6 text-primary-foreground" weight="duotone" />
                </div>
                <div>
                  <CardTitle className="group-hover:text-primary transition-colors">Events</CardTitle>
                  <CardDescription>Campus events</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer border-border/50 hover:border-primary/50" onClick={() => navigate("/lost-found")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                  <MagnifyingGlass className="w-6 h-6 text-primary-foreground" weight="duotone" />
                </div>
                <div>
                  <CardTitle className="group-hover:text-primary transition-colors">Lost & Found</CardTitle>
                  <CardDescription>Find lost items</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer border-border/50 hover:border-primary/50" onClick={() => navigate("/feedback")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                  <ChatCircleDots className="w-6 h-6 text-primary-foreground" weight="duotone" />
                </div>
                <div>
                  <CardTitle className="group-hover:text-primary transition-colors">Feedback</CardTitle>
                  <CardDescription>Share concerns</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {(currentUser.role === "student" || currentUser.role === "admin") && (
            <Card className="group hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer border-border/50 hover:border-primary/50" onClick={() => navigate("/clubs")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                    <UsersThree className="w-6 h-6 text-primary-foreground" weight="duotone" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-primary transition-colors">Clubs</CardTitle>
                    <CardDescription>
                      {currentUser.role === "admin" ? "Manage student clubs" : "Join clubs"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {currentUser.role === "student" && (
            <Card className="group hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer border-border/50 hover:border-primary/50" onClick={() => navigate("/polls")}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                      <ChartLineUp className="w-6 h-6 text-primary-foreground" weight="duotone" />
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">Polls</CardTitle>
                      <CardDescription>Vote on polls</CardDescription>
                    </div>
                  </div>
                </CardHeader>
            </Card>
          )}

          <Card className="group hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer border-border/50 hover:border-primary/50" onClick={() => navigate("/resources")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                  <Books className="w-6 h-6 text-primary-foreground" weight="duotone" />
                </div>
                <div>
                  <CardTitle className="group-hover:text-primary transition-colors">Resources</CardTitle>
                  <CardDescription>Study materials</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer border-border/50 hover:border-primary/50" onClick={() => navigate("/announcements")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                  <MegaphoneSimple className="w-6 h-6 text-primary-foreground" weight="duotone" />
                </div>
                <div>
                  <CardTitle className="group-hover:text-primary transition-colors">Announcements</CardTitle>
                  <CardDescription>Campus updates</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8 shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest campus interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity yet. Start by creating an event or sharing feedback!</p>
              )}
              {recentActivities.map((activity, index) => {
                const ActivityIcon = activity.icon;
                return (
                  <div key={`${activity.action}-${index}`} className="flex items-center gap-3 py-3 px-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/50 transition-all">
                    <ActivityIcon className="w-4 h-4 text-primary" weight="duotone" />
                    <p className="text-sm flex-1">{activity.action}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
