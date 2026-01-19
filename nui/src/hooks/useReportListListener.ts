import { useEffect } from "react";
import { txAdminMenuPage, usePageValue } from "../state/page.state";
import { useNuiEvent } from "./useNuiEvent";
import { fetchNui } from "../utils/fetchNui";
import { useSetReportsState } from "../state/reports.state";

export enum ServerReportStatus {
    ALL = 'all',
    OPEN = 'open',
    INPROGRESS = 'in-progress',
    RESOLVED = 'resolved',
};

export interface ReportData {
    /**
     * Report ID
     **/
    id: string;
    /**
     * Report subject
     **/
    subject: string;
    /**
     * Report state
     */
    status: ServerReportStatus;
    /**
     * Player's license
     **/
    reporter_license: string;
    /**
     * Player's name
     **/
    reporter_name: string;
    /**
     * Wehn the report was opened
     **/
    ts_opened: number;
    /** 
     * Last action on the report 
     **/
    ts_lastaction: number;
}

export const useReportListListener = () => {
    const curPage = usePageValue();
    const setReportList = useSetReportsState();

    useNuiEvent<ReportData[]>("setReportList", (reportList) => {
        console.log('received setReportList', reportList);
        setReportList([...reportList]);
    });

    useEffect(() => {
        // Since the report list is never technically unmounted,
        // we target page changes as our interval entrance technique
        if (curPage !== txAdminMenuPage.Reports) return;

        // Getting detailed reportlist
        fetchNui("signalReportsPageOpen", {}, { mockResp: {} }).catch();

        // Getting detailed reportlist every 5 seconds
        const updaterInterval = window.setInterval(() => {
            fetchNui("signalReportsPageOpen", {}, { mockResp: {} }).catch();
        }, 5000);

        return () => {
            window.clearInterval(updaterInterval);
        };
    }, [curPage]);
};