import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import api from "@/lib/api";

type AuthSuccess = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = (formData.get("password") as string) || "";

    const payload = await api
      .post<AuthSuccess>("/auth/login", { email, password }, { skipToast: true })
      .catch((error: Error) => {
        toast.error(error.message || "Login failed");
        return null;
      });

    if (payload) {
      localStorage.setItem("authToken", payload.token);
      localStorage.setItem("userProfile", JSON.stringify(payload.user));
      localStorage.setItem("userEmail", payload.user.email ?? email);
      localStorage.setItem("userRole", payload.user.role ?? "student");
      toast.success("Welcome back!");
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const role = ((formData.get("role") as string) || "student").trim();
    const name = (formData.get("name") as string) || "";
    const password = (formData.get("password") as string) || "";

    const payload = await api
      .post<AuthSuccess>("/auth/register", { name, email, password, role }, { skipToast: true })
      .catch((error: Error) => {
        toast.error(error.message || "Signup failed");
        return null;
      });

    if (payload) {
      localStorage.setItem("authToken", payload.token);
      localStorage.setItem("userProfile", JSON.stringify(payload.user));
      localStorage.setItem("userEmail", payload.user.email ?? email);
      localStorage.setItem("userRole", payload.user.role ?? role);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/KLH-Aziznagar.jpeg')" }}
    >
  <div className="absolute inset-0 bg-black/50" />

  <Card className="w-full max-w-md relative z-10 shadow-2xl border border-white/30 bg-white/30 backdrop-blur text-white">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Smart Campus
            </CardTitle>
            <CardDescription className="text-base mt-2 text-white/80">
              Your all-in-one campus ecosystem
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-black font-bold">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="student@campus.edu"
                    className="text-black font-semibold placeholder:text-gray-600 bg-white/80 border-white/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-black font-bold">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="text-black font-semibold placeholder:text-gray-600 bg-white/80 border-white/40"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-black font-bold">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    className="text-black font-semibold placeholder:text-gray-600 bg-white/80 border-white/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-black font-bold">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="student@campus.edu"
                    className="text-black font-semibold placeholder:text-gray-600 bg-white/80 border-white/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select name="role" defaultValue="student" required>
                    <SelectTrigger className="bg-white/80 text-black font-semibold border-white/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-black font-bold">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="text-black font-semibold placeholder:text-gray-600 bg-white/80 border-white/40"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
