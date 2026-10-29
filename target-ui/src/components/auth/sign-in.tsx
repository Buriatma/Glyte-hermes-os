"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "auth/client";
import { toast } from "sonner";
import { Loader, Lock, Sparkles } from "lucide-react";

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    setLoading(true);
    const res = await authClient.signIn.email(
      { password, callbackURL: "/" },
      {
        onError(ctx) {
          toast.error(ctx.error.message || "Invalid password");
        },
      }
    );
    if (res?.error) {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen flex flex-col p-4 md:p-8 justify-center items-center bg-background">
      <Card className="w-full max-w-sm border border-border/60 bg-card/60 backdrop-blur-md shadow-xl animate-in fade-in duration-500 rounded-2xl">
        <CardHeader className="text-center pb-4 pt-6 space-y-2">
          <div className="mx-auto p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary w-fit">
            <Lock className="size-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Hermes OS Client
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Enter your <code className="text-primary font-mono font-medium">HERMES_WEBUI_PASSWORD</code> to unlock operator access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input
              id="password"
              autoFocus
              disabled={loading}
              value={password}
              placeholder="Enter webui password..."
              type="password"
              className="h-9 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSignIn();
                }
              }}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            className="w-full h-9 text-xs font-medium"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader className="size-4 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="size-3.5 mr-1.5" />
            )}
            Unlock Client
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
