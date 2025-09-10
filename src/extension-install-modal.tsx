// components/extension-install-modal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Download, ExternalLink, AlertTriangle } from 'lucide-react';

interface ExtensionInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetryConnection?: () => void;
}

const installSteps = [
  {
    title: 'Install Extension',
    description: 'Download and install the Messenger CRM extension from Chrome Web Store',
    icon: <Download className="h-4 w-4" />,
  },
  {
    title: 'Grant Permissions',
    description: 'Allow the extension to access Messenger and Facebook pages',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    title: 'Sign In',
    description: 'Sign into the extension with the same account you use here',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

export function ExtensionInstallModal({
  open,
  onOpenChange,
  onRetryConnection,
}: ExtensionInstallModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleInstallClick = () => {
    // Replace with your actual Chrome Web Store URL
    window.open(
      'https://chrome.google.com/webstore/detail/your-extension-id',
      '_blank'
    );
    setCurrentStep(1);
  };

  const handleRetry = () => {
    onRetryConnection?.();
    setCurrentStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Extension Required
          </DialogTitle>
          <DialogDescription>
            To send bulk messages, you need to install our browser extension.
            The extension handles the actual message sending on Messenger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Installation Steps */}
          <div className="space-y-4">
            {installSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    index <= currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {step.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <h4
                    className={`text-sm font-medium ${
                      index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="rounded-lg bg-muted p-4">
            <h4 className="text-sm font-medium mb-2">What you'll get:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Automated message sending
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Contact management on Messenger
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Bulk tagging and organization
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Real-time sync with web app
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Privacy & Security
                </p>
                <p className="text-blue-700 dark:text-blue-200 mt-1">
                  The extension only accesses Messenger when you're actively using it.
                  All data is encrypted and synced with your Firebase account.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleInstallClick}
              className="flex-1"
              size="lg"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Install Extension
            </Button>
            
            {currentStep > 0 && (
              <Button
                onClick={handleRetry}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                I've Installed It
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            Need help?{' '}
            <a
              href="/help/extension-setup"
              className="text-primary hover:underline"
              target="_blank"
            >
              View setup guide
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}