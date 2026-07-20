'use client';

import { summarizeAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Contact, FileText, Loader2, Sparkles } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
      {pending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}
      Summarize
    </Button>
  );
}

export function SummarizeOrderForm() {
  const [state, formAction] = useActionState(summarizeAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card>
      <form ref={formRef} action={formAction}>
        <CardHeader>
          <CardTitle>AI-Powered Summarizer</CardTitle>
          <CardDescription>Paste your shipping receipt text below to get a quick summary.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            name="receiptText"
            placeholder="e.g. 'Order #12345, shipped to John Doe, 123 Main St...'"
            className="min-h-[150px] resize-y"
            required
          />
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>

      {state.success && state.summary && (
        <div className="p-4 pt-0">
          <Alert className="bg-primary/10 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Summary Generated</AlertTitle>
            <AlertDescription className="mt-2 space-y-4 text-foreground">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                <p>{state.summary}</p>
              </div>
              {state.contactInformation && (
                <div className="flex items-start gap-3">
                  <Contact className="h-4 w-4 mt-1 flex-shrink-0" />
                  <p>
                    <span className="font-semibold">Contact Info:</span> {state.contactInformation}
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
