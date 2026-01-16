import { setUrlSearchParam } from "@/lib/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithReset } from 'jotai/utils';

/**
 * Report Modal State Management
 */
export type ReportModalRefType = {
    reportId: string;
};

export const reportModalOpenAtom = atomWithReset(false);
export const reportModalRefAtom = atomWithReset<ReportModalRefType | undefined>(undefined);
export const reportModalUrlParam = 'reportId'; // Changed param name for clarity

// Helper to set the URL search param
export const setReportModalUrlParam = (ref: string | undefined) => {
    setUrlSearchParam(reportModalUrlParam, ref);
}

/**
 * Hook to open the report modal
 * Usage: openReport({ reportId: 'REP-1234' })
 */
export const useOpenReportModal = () => {
    const setModalRef = useSetAtom(reportModalRefAtom);
    const setModalOpen = useSetAtom(reportModalOpenAtom);
    
    return (data: ReportModalRefType) => {
        setReportModalUrlParam(data.reportId);
        setModalRef(data);
        setModalOpen(true);
    }
};

/**
 * Hook to close the report modal
 */
export const useCloseReportModal = () => {
    const setModalOpen = useSetAtom(reportModalOpenAtom);
    
    return () => {
        setReportModalUrlParam(undefined);
        setModalOpen(false);
    }
};

/**
 * General hook for the state of the report modal
 */
export const useReportModalStateValue = () => {
    const reportRef = useAtomValue(reportModalRefAtom);
    const [isModalOpen, setIsModalOpen] = useAtom(reportModalOpenAtom);
    
    return {
        isModalOpen,
        reportRef,
        closeModal: () => {
            setReportModalUrlParam(undefined);
            setIsModalOpen(false);
        },
    }
}