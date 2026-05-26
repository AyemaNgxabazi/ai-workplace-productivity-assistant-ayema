import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { runAiTool } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Sparkles, Copy, AlertTriangle, Loader2 } from "lucide-react";

type Kind = "email" | "meeting" | "task" | "research";

export function ToolWorkspace({
  kind,
  title,
  description,
  icon: Icon,
  inputLabel,
  placeholder,
  showTone = false,
}: {
  kind: Kind;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  inputLabel: string;
  placeholder: string;
  showTone?: boolean;
}) {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("Professional");
  const [output, setOutput] = useState("");
  const run = useServerFn(runAiTool);

  const generate = useMutation({
    mutationFn: () => run({ data: { kind, input, tone: showTone ? tone : undefined } }),
    onSuccess: (res) => setOutput(res.text),
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Copied");
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground shadow-[var(--shadow-glow)]">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{inputLabel}</Label>
            {showTone && (
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Professional", "Friendly", "Concise", "Persuasive", "Apologetic", "Enthusiastic"].map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="min-h-[280px] resize-none bg-background/40"
          />
          <Button
            onClick={() => generate.mutate()}
            disabled={!input.trim() || generate.isPending}
            className="w-full gap-2"
          >
            {generate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Output (editable)</Label>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          </div>
          <Textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="AI output will appear here…"
            className="min-h-[280px] resize-none bg-background/40 font-mono text-sm"
          />
          <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>
              AI-generated. Review for accuracy, tone, and confidential information before
              using or sharing.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}