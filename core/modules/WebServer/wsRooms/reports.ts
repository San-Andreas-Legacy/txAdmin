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
        
        const reportData = ServerReport.getReport(reportId);

        if (!reportData) return { error: `Report (${reportId}) not found` };

        const { report, active } = reportData;
        return {
            report: report.getData(),
            active,
        }
    },
} satisfies RoomType;
