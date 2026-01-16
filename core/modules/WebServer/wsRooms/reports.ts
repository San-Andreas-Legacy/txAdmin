import { ServerReport } from "@modules/Report/class";
import type { RoomType } from "../webSocket";

/**
 * The Reports Room
 * Now acting as the primary data source for report details.
 */
export default {
    permission: 'menu.reports',
    eventName: 'report',
    cumulativeBuffer: false,
    outBuffer: null,
    initialData: (query?: any) => {
        const reportId = query?.reportId;
        if (!reportId) return { error: 'No report ID provided' };
        
        const report = ServerReport.getReport(reportId);

        if (!report) return { error: 'Report not found' };
        return report.getData();
    },
} satisfies RoomType;
