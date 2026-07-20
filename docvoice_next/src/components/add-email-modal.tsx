import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Mail, CheckCircle2 } from 'lucide-react';

interface AddEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddEmailModal({ isOpen, onClose }: AddEmailModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary h-2 w-full"></div>
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-gray-900">Add New Email</DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium pt-1">
                            Link another email address to your Aramex account for better notification management.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="new-email" className="text-sm font-bold text-gray-700">Email Address</Label>
                            <Input
                                id="new-email"
                                placeholder="new.email@example.com"
                                className="h-14 border-gray-200 focus:border-primary focus:ring-primary/10 rounded-2xl text-lg font-medium"
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 flex gap-3 border border-gray-100">
                            <CheckCircle2 className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                We'll send a verification link to this address. You'll need to confirm it before you can use it for notifications.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-10 gap-3 flex flex-col sm:flex-row">
                        <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-gray-500 hover:bg-gray-50" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button className="flex-1 h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg rounded-2xl shadow-lg transition-all active:scale-95">
                            Send Verification
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
