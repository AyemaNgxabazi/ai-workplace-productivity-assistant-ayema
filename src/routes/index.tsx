import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      navigate({ to: data.session ? "/dashboard" : "/login", replace: true });
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Loading…
    </div>
  );
}
