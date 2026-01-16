const modulename = 'WebServer:ReportsTableSearch';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { ServerReport } from '@modules/Report/class';

const console = consoleFactory(modulename);

/**
 * Returns filtered reports for the Reports page table
 */
export default async function ReportSearch(ctx: AuthedCtx) {
    const { searchValue, searchType, filters, sortingKey, sortingDesc, offsetParam } = ctx.query;

    const results = ServerReport.searchReports(
        searchValue as string,
        searchType as string,
        filters as string,
        sortingKey as string,
        sortingDesc === 'true',
        offsetParam as string
    );

    return ctx.send(results);
}
