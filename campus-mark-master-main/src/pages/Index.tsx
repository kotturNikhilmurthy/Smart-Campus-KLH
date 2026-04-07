import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, Search, Bell, Users, GraduationCap, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Search,
      title: "Lost & Found",
      description: "Quickly report and recover lost items across campus with our smart tracking system.",
    },
    {
      icon: Calendar,
      title: "Event Management",
      description: "Stay updated with campus events, workshops, and activities. RSVP with one click.",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Get real-time updates about important campus announcements and activities.",
    },
    {
      icon: Users,
      title: "Community Hub",
      description: "Connect with students, faculty, and staff in a unified campus ecosystem.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/KLH-Aziznagar.jpeg')" }}
        ></div>
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/20">
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm font-medium">Your All-in-One Campus Solution</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Smart Campus Ecosystem
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
              A unified ecosystem connecting students, faculty, and staff. Manage events, track lost items, and stay connected—all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 h-auto shadow-xl"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make campus life easier and more connected
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all hover:scale-[1.05] border-2">
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { label: "Active Users", value: "5000+" },
              { label: "Events Hosted", value: "200+" },
              { label: "Items Recovered", value: "150+" },
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <p className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-lg text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-br from-primary to-accent text-white border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTEwdjJIMjR2LTJoMTJ6bTAtMTB2MkgyNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            <CardContent className="py-16 px-8 relative z-10">
              <div className="max-w-2xl mx-auto text-center">
                <Shield className="w-16 h-16 mx-auto mb-6" />
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Transform Your Campus Experience?
                </h3>
                <p className="text-lg text-white/90 mb-8">
                  Join thousands of students and faculty already using Smart Campus
                </p>
                <Button 
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 h-auto shadow-xl"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 Smart Campus. Built with ❤️ for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
