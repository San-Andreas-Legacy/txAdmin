const modulename = 'WebServer:ReportsTableSearch';
import { ReportsTablePlayerType, ReportsTableSearchResp } from '@shared/reportApiTypes';
import { DatabaseReportType } from '@modules/Database/databaseTypes';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { chain as createChain } from 'lodash-es';
import Fuse from 'fuse.js';
import { TimeCounter } from '@modules/Metrics/statsUtils';

const console = consoleFactory(modulename);

const DEFAULT_LIMIT = 100;
const ALLOWED_SORTINGS = ['tsOpened', 'tsLastAction'];
const SIMPLE_FILTERS = ['statusOpen', 'statusInProgress', 'statusResolved'];

/**
 * Returns filtered reports for the Reports page table
 */
export default async function ReportSearch(ctx: AuthedCtx) {
    if (typeof ctx.query === 'undefined') {
        return ctx.utils.error(400, 'Invalid Request');
    }

    const {
        searchValue,
        searchType,
        filters,
        sortingKey,
        sortingDesc,
        offsetParam,
    } = ctx.query;

    const sendTypedResp = (data: ReportsTableSearchResp) => ctx.send(data);
    const searchTime = new TimeCounter();
    const onlinePlayersLicenses = txCore.fxPlayerlist.getOnlinePlayersLicenses();
    const dbo = txCore.database.getDboRef();
    
    // Start chain from reports collection
    let chain = dbo.chain.get('reports').clone();

    // 1. Sorting
    const parsedSortingDesc = sortingDesc === 'true';
    if (typeof sortingKey !== 'string' || !ALLOWED_SORTINGS.includes(sortingKey)) {
        return sendTypedResp({ error: 'Invalid sorting key' });
    }
    
    chain = chain.sort((a, b) => {
        const valA = a[sortingKey as keyof DatabaseReportType] as number;
        const valB = b[sortingKey as keyof DatabaseReportType] as number;
        return parsedSortingDesc ? valB - valA : valA - valB;
    });

    // 2. Status Filtering
    if (typeof filters === 'string' && filters.length) {
        const validRequestedFilters = filters.split(',').filter((x) => SIMPLE_FILTERS.includes(x));

        if (validRequestedFilters.length) {
            chain = chain.filter((r: DatabaseReportType) => {
                if (validRequestedFilters.includes('statusOpen') && r.status === 'open') return true;
                if (validRequestedFilters.includes('statusInProgress') && r.status === 'in-progress') return true;
                if (validRequestedFilters.includes('statusResolved') && r.status === 'resolved') return true;
                return false;
            });
        }
    }

    // 3. Pagination Offset
    if (offsetParam !== undefined) {
        const parsedOffsetParam = parseInt(offsetParam as string);
        if (!isNaN(parsedOffsetParam)) {
            chain = chain.filter((r) => {
                const val = r[sortingKey as keyof DatabaseReportType] as number;
                return parsedSortingDesc ? val <= parsedOffsetParam : val >= parsedOffsetParam;
            });
        }
    }

    // 4. Fuzzy Search (Subject or Reporter Name)
    if (typeof searchType === 'string' && typeof searchValue === 'string' && searchValue.length) {
        const reports = chain.value();
        
        if (searchType === 'subject') {
            const fuse = new Fuse(reports, { keys: ['subject'], threshold: 0.3 });
            chain = createChain(fuse.search(searchValue).map(x => x.item));
        } else if (searchType === 'reporter') {
            const fuse = new Fuse(reports, { keys: ['reporter.name', 'reporter.license'], threshold: 0.3 });
            chain = createChain(fuse.search(searchValue).map(x => x.item));
        } else {
            return sendTypedResp({ error: 'Unknown searchType' });
        }
    }

    // 5. Limit and Data Transformation
    chain = chain.take(DEFAULT_LIMIT + 1);
    const reports = chain.value();
    const hasReachedEnd = reports.length <= DEFAULT_LIMIT;

    const processedReports: ReportsTablePlayerType[] = reports.slice(0, DEFAULT_LIMIT).map((r) => {
        return {
            id: r.id,
            subject: r.subject,
            reporter: {
                license: r.reporter.license,
                name: r.reporter.name,
                online: onlinePlayersLicenses.has(r.reporter.license),
            },
            status: r.status,
            tsOpened: r.tsOpened,
            tsLastAction: r.tsLastAction,
        };
    });

    // Update metrics and return
    txCore.metrics.txRuntime.playersTableSearchTime.count(searchTime.stop().milliseconds);
    
    return sendTypedResp({
        reports: processedReports,
        hasReachedEnd,
    });
}