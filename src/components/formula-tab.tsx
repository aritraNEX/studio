
"use client";

import { useState } from "react";
import Latex from "react-latex-next";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function FormulaTab() {
  const [latexInput, setLatexInput] = useState("$$E = mc^2$$");
  const [error, setError] = useState<string | null>(null);

  const handleLatexChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLatexInput(e.target.value);
    setError(null);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        <Label htmlFor="latex-input" className="font-semibold text-md">
          Enter LaTeX Formula
        </Label>
        <Textarea
          id="latex-input"
          value={latexInput}
          onChange={handleLatexChange}
          placeholder="Type your LaTeX code here, e.g., $$ \frac{\pi}{2} $$"
          className="h-96 resize-y bg-background focus-visible:ring-accent font-mono"
        />
      </div>
      <div className="flex flex-col gap-4">
        <Label className="font-semibold text-md">Live Preview</Label>
        <Card className="min-h-96 bg-background/50 flex flex-col items-center justify-center">
          <CardContent className="flex-grow flex items-center justify-center p-6 w-full overflow-auto">
            <div className="text-2xl text-foreground w-full text-center">
              <Latex
                delimiters={[
                  { left: "$$", right: "$$", display: true },
                  { left: "$", right: "$", display: false },
                  { left: "\\[", right: "\\]", display: true },
                  { left: "\\(", right: "\\)", display: false },
                ]}
                strict={(errorCode, errorMsg) => {
                  // This function is called on error, but we can't set state directly here
                  // as it runs during render. We can schedule a state update.
                  setTimeout(() => setError(`[${errorCode}] ${errorMsg}`), 0);
                  return 'ignore';
                }}
              >
                {latexInput}
              </Latex>
            </div>
          </CardContent>
        </Card>
        {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>LaTeX Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}
