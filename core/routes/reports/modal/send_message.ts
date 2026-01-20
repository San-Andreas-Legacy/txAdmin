const modulename = 'WebServer:GetReportModal';
import consoleFactory from '@lib/console';
import { ServerReport } from '@modules/Report/class';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { GetReportModalResp, SendReportModalResp, ServerReportMessage } from '@shared/reportApiTypes';
const console = consoleFactory(modulename);

interface GameReportMessage extends ServerReportMessage {
    reportId: string;
}

/**
 *  Returns the report data for the nui modal
 */
export default async function SendMessageReportModal(ctx: AuthedCtx) {
    const sendTypedResp = (data: SendReportModalResp) => ctx.send(data);

    const { reportId, message, author_license, author_name } = ctx.query as any as GameReportMessage;

    try {
        const report = ServerReport.getReport(reportId as string);

        if (!report || !report.active) {
            throw new Error(`No${report && report.active === false ? ' active ' : ' '}report was found for id ${reportId}`);
        }

        const msgPayload = report.report.newMessage(message, {
            name: author_name,
            license: author_license,
        });

        return sendTypedResp({
            success: true,
            message: msgPayload,
        });
    } catch (error) {
        const msg = `GetReportModal failed with error: ${(error as Error).message}`;
        console.verbose.error(msg);
        return sendTypedResp({ error: msg });
    }
};
