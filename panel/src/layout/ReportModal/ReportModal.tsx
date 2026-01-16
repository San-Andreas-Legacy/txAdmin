import { useReportModalStateValue } from "@/hooks/reportModal";
import { useOpenPlayerModal } from "@/hooks/playerModal";
import { UserIcon, CheckCircleIcon, SendIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import GenericSpinner from "@/components/GenericSpinner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, getSocket } from "@/lib/utils";
import { useBackendApi } from "@/hooks/fetch";
import { ServerReportDto } from "@shared/reportApiTypes";
import { ReportInitialData } from "@shared/socketioTypes";

export default function ReportModal() {
    const { isModalOpen, closeModal, reportRef } = useReportModalStateValue();
    const openPlayerModal = useOpenPlayerModal();
    
    // modalData now starts as undefined and is filled by the WS initialData
    const [modalData, setModalData] = useState<ServerReportDto | undefined>(undefined);
    const [activeTicket, setActiveTicket] = useState<boolean>(false);
    const [modalError, setModalError] = useState('');
    const [messageInput, setMessageInput] = useState('');
    
    const pageSocket = useRef<ReturnType<typeof getSocket> | null>(null);

    // POST remains for actions like closing
    const closeReportApi = useBackendApi({
        method: 'POST',
        path: `/report/close`,
    });

    useEffect(() => {
        if (!isModalOpen || !reportRef) {
            setModalData(undefined); // Clear data when closed
            return;
        }

        // Initialize socket with the specific report ID
        // The second argument passed to getSocket usually translates to room data
        pageSocket.current = getSocket(['report'], { reportId: reportRef.reportId });
        
        pageSocket.current.on('connect', () => {
            console.log(`Subscribed to report: ${reportRef.reportId}`);
        });

        // Listen for the initial snapshot sent by the room
        pageSocket.current.on('report', (data: ReportInitialData) => {
            if ('error' in data) {
                setModalError(data.error);
            } else {
                setModalData(data.report);
                setActiveTicket(data.active);
            }
        });

        // Listen for real-time messages
        pageSocket.current.on('reportMessage', (message: any) => {
            setModalData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: [...prev.messages, message],
                    tsLastAction: Date.now()
                };
            });
        });

        return () => {
            pageSocket.current?.removeAllListeners();
            pageSocket.current?.disconnect();
        }
    }, [isModalOpen, reportRef?.reportId]);

    const handleCloseReport = () => {
        if (!reportRef) return;

        closeReportApi({
            data: { id: reportRef.reportId },
            success: () => closeModal()
        });
    };

    const handleSendMessage = () => {
        if (!reportRef || !activeTicket) return;
        const trimmed = messageInput.trim();
        if (!trimmed || !pageSocket.current) return;

        // Emit to server - assuming your backend listens for 'newMessage' 
        // or similar on the specific report room/socket
        pageSocket.current.emit('newMessage', {
            reportId: reportRef.reportId,
            message: trimmed
        });

        setMessageInput('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-2xl h-full sm:h-[600px] p-0 flex flex-col gap-0">
                <DialogHeader className="px-4 py-3 mr-8 border-b flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="tracking-wide line-clamp-1 break-all flex-1">
                        {modalData ? (
                            <div className="flex items-center gap-2">
                                <span>{!activeTicket && '[CLOSED] '}{modalData.subject}</span>
                            </div>
                        ) : "Connecting..."}
                    </DialogTitle>
                    
                    {modalData && (
                        <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" className="h-8" onClick={() => openPlayerModal({ license: modalData.reporter_license })}>
                                <UserIcon className="h-4 w-4 mr-1.5" /> Player
                            </Button>
                            {activeTicket && <Button size="sm" variant="destructive" className="h-8" onClick={handleCloseReport}>
                                <CheckCircleIcon className="h-4 w-4 mr-1.5" /> Close
                            </Button>}
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4">
                    {!modalData ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            {modalError ? (
                                <span className="text-destructive font-bold">Error: {modalError}</span>
                            ) : (
                                <GenericSpinner msg="Waiting for stream..." />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {modalData.messages.map((msg, idx) => {
                                const isReporter = msg.author_license === modalData.reporter_license;
                                return (
                                    <div key={idx} className={cn("flex flex-col max-w-[85%]", isReporter ? "self-start" : "self-end items-end")}>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 px-1">{msg.author_name}</span>
                                        <div className={cn("p-3 rounded-2xl text-sm shadow-sm", isReporter ? "bg-secondary" : "bg-primary text-primary-foreground")}>
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {modalData && activeTicket && (
                    <div className="p-3 border-t bg-background">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="flex-1"
                                autoComplete="off"
                            />
                            <Button 
                                size="icon" 
                                onClick={handleSendMessage} 
                                disabled={!messageInput.trim()}
                            >
                                <SendIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}