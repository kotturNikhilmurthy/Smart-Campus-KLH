import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface EventItem {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: string[];
  attendeeCount?: number;
  category: string;
  createdBy?: string;
}

type CreateEventPayload = Record<"title" | "description" | "date" | "location" | "category", string>;

const Events = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isAuthLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    data: events = [],
    isLoading,
  } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.get<EventItem[]>("/api/events"),
    enabled: Boolean(currentUser),
    staleTime: 1000 * 60,
  });

  const createEventMutation = useMutation({
    mutationFn: (payload: CreateEventPayload) => api.post<EventItem>("/api/events", payload),
    onSuccess: () => {
      toast.success("Event created successfully!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsDialogOpen(false);
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: (eventId: string) => api.post<EventItem>(`/api/events/${eventId}/rsvp`),
    onSuccess: () => {
      toast.success("RSVP confirmed!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);
    const payload: CreateEventPayload = {
      title: (formData.get("title") as string) || "",
      description: (formData.get("description") as string) || "",
      date: (formData.get("date") as string) || "",
      location: (formData.get("location") as string) || "",
      category: (formData.get("category") as string) || "General",
    };

    createEventMutation.mutate(payload);
  };

  const handleRSVP = (eventId: string) => {
    rsvpMutation.mutate(eventId);
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Event Management</h1>
                <p className="text-sm text-muted-foreground">Discover and create campus events</p>
              </div>
            </div>
            
            {(currentUser?.role === "admin" || currentUser?.role === "teacher") && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>Fill in the details to create a campus event</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input id="title" name="title" placeholder="Tech Fest 2024" required disabled={createEventMutation.isPending} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" placeholder="Event description..." required disabled={createEventMutation.isPending} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" required disabled={createEventMutation.isPending} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" placeholder="Technology" required disabled={createEventMutation.isPending} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" placeholder="Main Auditorium" required disabled={createEventMutation.isPending} />
                    </div>
                    <Button type="submit" className="w-full" disabled={createEventMutation.isPending}>
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const attendeeCount = event.attendeeCount ?? event.attendees?.length ?? 0;
            const isPastEvent = new Date(event.date) < new Date();
            const alreadyJoined = event.attendees?.some((id) => id === currentUser?.id);

            return (
              <Card key={event._id} className="hover:shadow-lg transition-all hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{event.category}</Badge>
                    {currentUser?.role !== "teacher" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRSVP(event._id)}
                        disabled={rsvpMutation.isPending || alreadyJoined || isPastEvent}
                      >
                        {alreadyJoined ? "RSVP'd" : isPastEvent ? "Past" : "RSVP"}
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{attendeeCount} attending</span>
                    </div>
                    {currentUser?.role === "teacher" && currentUser.id === event.createdBy && (
                      <p className="text-xs text-muted-foreground">Created by you</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No events yet. {currentUser?.role === "teacher" ? "Create the first event!" : "Check back soon."}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;
