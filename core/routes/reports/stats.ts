const modulename = 'WebServer:ReportsStats';
import consoleFactory from '@lib/console';
import { ServerReport } from '@modules/Report/class';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { ReportsStatsResp } from '@shared/reportApiTypes';
const console = consoleFactory(modulename);


/**
 *  Returns the players stats for the Players page callouts
 */
export default async function ReportsStats(ctx: AuthedCtx) {
    const sendTypedResp = (data: ReportsStatsResp) => ctx.send(data);
    try {
        const stats = ServerReport.getStats();
        return sendTypedResp(stats);
    } catch (error) {
        const msg = `getStats failed with error: ${(error as Error).message}`;
        console.verbose.error(msg);
        return sendTypedResp({ error: msg });
    }
};
