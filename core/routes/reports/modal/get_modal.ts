const modulename = 'WebServer:GetReportModal';
import consoleFactory from '@lib/console';
import { ServerReport } from '@modules/Report/class';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { GetReportModalResp } from '@shared/reportApiTypes';
const console = consoleFactory(modulename);


/**
 *  Returns the report data for the nui modal
 */
export default async function GetReportModal(ctx: AuthedCtx) {
    const sendTypedResp = (data: GetReportModalResp) => ctx.send(data);

    const { reportId } = ctx.query;

    try {
        const report = ServerReport.getReport(reportId as string);

        if (!report) {
            throw new Error(`No report was found for id ${reportId}`);
        }

        return sendTypedResp({
            success: true,
            report: report.report.getData(),
        });
    } catch (error) {
        const msg = `GetReportModal failed with error: ${(error as Error).message}`;
        console.verbose.error(msg);
        return sendTypedResp({ error: msg });
    }
};
