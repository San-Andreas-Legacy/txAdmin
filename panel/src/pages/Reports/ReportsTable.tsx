import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ScrollArea } from '@/components/ui/scroll-area';
import TxAnchor from '@/components/TxAnchor';
import { cn } from '@/lib/utils';
import { convertRowDateTime } from '@/lib/dateTime';
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2Icon, AlertCircleIcon, CheckCircle2Icon, TimerIcon, UserIcon } from 'lucide-react';
import { useBackendApi } from '@/hooks/fetch';
import { ReportsTablePlayerType } from '@shared/reportApiTypes';
import { useOpenReportModal } from '@/hooks/reportModal';

// Types adapted for Reports
// You would define these in your @shared types file
type ReportRowProps = {
    rowData: ReportsTablePlayerType;
    modalOpener: ReturnType<typeof useOpenReportModal>;
}

/**
 * Report Row Component
 */
function ReportRow({ rowData, modalOpener }: ReportRowProps) {
    const openModal = () => {
        modalOpener({ reportId: rowData.id });
    }

    const statusIcons = {
        'open': <AlertCircleIcon className="h-5 text-destructive-inline animate-pulse" />,
        'in-progress': <TimerIcon className="h-5 text-warning-inline" />,
        'resolved': <CheckCircle2Icon className="h-5 text-success-inline" />
    };

    return (
        <TableRow onClick={openModal} className='cursor-pointer hover:bg-muted/50'>
            <TableCell className='px-4 py-2 border-r font-medium'>
                <div className='flex items-center gap-2'>
                    {statusIcons[rowData.status]}
                    <span className='capitalize'>{rowData.status}</span>
                </div>
            </TableCell>
            <TableCell className='px-4 py-2 border-r'>
                <div className='flex flex-col'>
                    <span>{rowData.reporter_name}</span>
                </div>
            </TableCell>
            <TableCell className='px-4 py-2 border-r max-w-[200px]'>
                <span className='overflow-hidden line-clamp-1'>
                    {rowData.subject}
                </span>
            </TableCell>
            <TableCell className='px-4 py-2 text-right'>
                {convertRowDateTime(rowData.ts_lastaction)}
            </TableCell>
        </TableRow>
    );
}

/**
 * Main Reports Table
 */
export default function ReportsTable({ search, filters }: { search: any, filters: any }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [reports, setReports] = useState<ReportsTablePlayerType[]>([]);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [sorting, setSorting] = useState({ key: 'tsOpened', desc: true });
    const openReportModal = useOpenReportModal();

    const reportsApi = useBackendApi<any>({
        method: 'GET',
        path: '/reports/search',
        abortOnUnmount: true,
    });

    const fetchNextPage = async (resetOffset?: boolean) => {
        setIsFetching(true);
        setLoadError(null);
        try {
            const queryParams: any = {
                sortingKey: sorting.key,
                sortingDesc: sorting.desc,
                searchValue: search?.value,
                searchType: search?.type,
                filters: filters?.join(','),
            };
            
            if (!resetOffset && reports.length) {
                queryParams.offsetParam = reports[reports.length - 1].ts_lastaction;
                queryParams.offsetId = reports[reports.length - 1].id;
            }

            const resp = await reportsApi({ queryParams });
            if (!resp || 'error' in resp) throw new Error(resp?.error || 'Fetch failed');

            setHasReachedEnd(resp.hasReachedEnd);
            setReports(prev => resetOffset ? resp.reports : [...prev, ...resp.reports]);
        } catch (e: any) {
            setLoadError(e.message);
        } finally {
            setIsFetching(false);
        }
    };

    const rowVirtualizer = useVirtualizer({
        count: reports.length + 1,
        getScrollElement: () => (scrollRef.current as HTMLDivElement)?.getElementsByTagName('div')[0],
        estimateSize: () => 50,
        overscan: 15,
    });

    useEffect(() => {
        fetchNextPage(true);
    }, [search, filters, sorting]);

    const virtualItems = rowVirtualizer.getVirtualItems();

    return (
        <div className="w-full max-h-full min-h-96 overflow-auto border md:rounded-lg">
            <ScrollArea className="h-full" ref={scrollRef}>
                <table className='w-full text-sm select-none'>
                    <TableHeader className='sticky top-0 z-10 bg-zinc-200 dark:bg-muted shadow-sm'>
                        <tr>
                            <th className='py-3 px-4 text-left w-[200px]'>Status</th>
                            <th className='py-3 px-4 text-left'>Involved Parties</th>
                            <th className='py-3 px-4 text-left'>Reason</th>
                            <th className='py-3 px-4 text-right'>Time</th>
                        </tr>
                    </TableHeader>
                    <TableBody>
                        {virtualItems.map((virtualItem) => {
                            const isLastRow = virtualItem.index >= reports.length;
                            return isLastRow ? (
                                <TableRow key={virtualItem.key}>
                                    <TableCell colSpan={4} className="p-4 text-center">
                                        {isFetching ? <Loader2Icon className="animate-spin mx-auto" /> : "No more reports."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <ReportRow
                                    key={virtualItem.key}
                                    rowData={reports[virtualItem.index]}
                                    modalOpener={openReportModal}
                                />
                            );
                        })}
                    </TableBody>
                </table>
            </ScrollArea>
        </div>
    );
}