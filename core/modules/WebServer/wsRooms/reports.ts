import { ServerReport } from "@modules/Report/class";
import type { RoomType } from "../webSocket";
import { AuthedAdminType } from "../authLogic";

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
    commands: {
        newMessage: {
            permission: 'menu.reports',
            handler: (admin: AuthedAdminType, reportId: string, message: string) => {
                console.log('reports socket newMessage', reportId, message);
                if(typeof reportId !== 'string' || !reportId) return;

                console.log('new message for report', reportId, message, admin.name);

                const report = ServerReport.getReport(reportId);

                console.log('report found', report !== false);

                if (!report) return;

                report.report.newMessage(
                    message,
                    {
                        name: admin.name,
                        license: 'web-admin',
                    },
                    true
                );
            }

        }
    }
} satisfies RoomType;
