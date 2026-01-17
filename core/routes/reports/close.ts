const modulename = 'WebServer:PlayersStats';
import consoleFactory from '@lib/console';
import { ServerReport } from '@modules/Report/class';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { ReportCloseResp } from '@shared/reportApiTypes';
const console = consoleFactory(modulename);


/**
 *  Returns the players stats for the Players page callouts
 */
export default async function ReportsClose(ctx: AuthedCtx) {
    const { reportId } = ctx.query;
    const { name: adminName } = ctx.admin.getAuthData();
    const sendTypedResp = (data: ReportCloseResp) => ctx.send(data);

    try {
        const resp = ServerReport.closeReport(reportId as string, {
            name: adminName,
            license: 'web-panel',
        });
        return sendTypedResp(resp);
    } catch (error) {
        const msg = `getStats failed with error: ${(error as Error).message}`;
        console.verbose.error(msg);
        return sendTypedResp({ error: msg });
    }
};
