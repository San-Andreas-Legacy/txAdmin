import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { 
    ClipboardListIcon, 
    MessageSquareWarningIcon, 
    ClockIcon, 
    CheckCircle2Icon, 
    MessageCircleWarningIcon
} from 'lucide-react';
import PageCalloutRow, { PageCalloutProps } from '@/components/PageCalloutRow';
import { useBackendApi } from '@/hooks/fetch';

import ReportsSearchBox from './ReportsSearchBox';
import ReportsTable from './ReportsTable';

// Memoized components
const ReportsTableMemo = memo(ReportsTable);
const ReportsSearchBoxMemo = memo(ReportsSearchBox);
const PageCalloutRowMemo = memo(PageCalloutRow);

import { LocalStorageKey } from '@/lib/localStorage';
import { 
    availableSearchTypes, 
    availableFilters 
} from './ReportsSearchBox'; // Ensure these are exported from your search box file
import { ReportsTableFiltersType, ReportTableSearchType } from '@shared/reportApiTypes';

/**
 * Get/Set localStorage for Reports
 */
const getStoredReportSearchType = () => {
    const stored = localStorage.getItem(LocalStorageKey.ReportsPageSearchType);
    if (!stored) return false;
    if (!availableSearchTypes.some(f => f.value === stored)) return false;
    return stored;
}

const setStoredReportSearchType = (searchType: string | false) => {
    if (searchType) {
        localStorage.setItem(LocalStorageKey.ReportsPageSearchType, searchType);
    } else {
        localStorage.removeItem(LocalStorageKey.ReportsPageSearchType);
    }
}

/**
 * Sync Reports Search/Filters with URL
 */
const updateReportUrlParams = (search: any, filters: ReportsTableFiltersType) => {
    const newUrl = new URL(window.location.toString());
    
    if (search?.value && search?.type) {
        newUrl.searchParams.set("searchType", search.type);
        newUrl.searchParams.set("searchQuery", search.value);
    } else {
        newUrl.searchParams.delete("searchType");
        newUrl.searchParams.delete("searchQuery");
    }

    if (filters.length) {
        newUrl.searchParams.set("filters", filters.join(','));
    } else {
        newUrl.searchParams.delete("filters");
    }
    
    window.history.replaceState({}, "", newUrl);
}

/**
 * Initialize State from URL and LocalStorage
 */
const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    
    // Validate Search Types
    const validTypes = availableSearchTypes.map(f => f.value) as string[];
    const urlSearchType = params.get('searchType');
    const urlSearchQuery = params.get('searchQuery');

    // Validate Filters
    const validFilters = availableFilters.map(f => f.value) as string[];
    const urlFilters = params.get('filters')?.split(',').filter(f => validFilters.includes(f));

    // Handle "Remember Me" logic for report search preference
    let defaultSearchType = availableSearchTypes[0].value as string;
    let rememberSearchType = false;

    try {
        const stored = getStoredReportSearchType();
        if (stored) {
            defaultSearchType = stored;
            rememberSearchType = true;
        }
    } catch (error) {
        console.error('Failed to get stored report search type:', error);
    }

    return {
        search: urlSearchQuery && urlSearchType && validTypes.includes(urlSearchType) ? {
            type: urlSearchType,
            value: urlSearchQuery,
        } : {
            type: defaultSearchType,
            value: '',
        },
        filters: urlFilters ?? [],
        rememberSearchType,
    };
}

interface ReportCalloutData {
    total: number;
    resolved: number;
    unanswered: number;
    inprogress: number;
}

export default function ReportsPage() {
    const [calloutData, setCalloutData] = useState<ReportCalloutData | undefined>(undefined);
    const [searchBoxReturn, setSearchBoxReturn] = useState<any | undefined>(undefined);
    const statsApi = useBackendApi<ReportCalloutData | undefined>({
        method: 'GET',
        path: '/reports/stats',
        abortOnUnmount: true,
    });

    //Callout data
    useEffect(() => {
        statsApi({
            success(data) {
                setCalloutData(data);
            },
        });
    }, []);

    const doSearch = useCallback((
        search: ReportTableSearchType,
        filters: ReportsTableFiltersType,
        rememberSearchType: boolean,
    ) => {
        setSearchBoxReturn({ search, filters });
        updateReportUrlParams(search, filters);
        try {
            setStoredReportSearchType(rememberSearchType ? search.type : false);
        } catch (error) {
            console.error('Failed to set stored search type:', error);
        }
    }, []);
    const initialState = useMemo(getInitialState, []);


    const calloutRowData = useMemo(() => {
        const hasCalloutData = calloutData && !('error' in calloutData);
        return [
            {
                label: 'Total Reports',
                value: hasCalloutData ? calloutData.total : false,
                icon: <ClipboardListIcon />,
            },
            {
                label: 'Resolved',
                value: hasCalloutData ? calloutData.resolved : false,
                icon: <CheckCircle2Icon />,
            },
            {
                label: 'In Progress',
                value: hasCalloutData ? calloutData.inprogress : false,
                icon: <ClockIcon />,
            },
            {
                label: 'Unanswered',
                value: hasCalloutData ? calloutData.unanswered : false,
                icon: <MessageCircleWarningIcon />,
            },
        ] satisfies PageCalloutProps[];
    }, [calloutData]);

    return (<div
        className='flex flex-col min-w-96 w-full h-contentvh'
    >
        {/* <div
            //DEBUG component state
            className='w-full bg-black p-2'
            style={{ color: createRandomHslColor() }}
        >{JSON.stringify(searchBoxReturn)}</div> */}

        <PageCalloutRowMemo callouts={calloutRowData} />

        <ReportsSearchBoxMemo
            doSearch={doSearch}
            initialState={initialState}
        />

        {searchBoxReturn ? (
            <ReportsTableMemo
                search={searchBoxReturn.search}
                filters={searchBoxReturn.filters}
            />
        ) : null}
    </div>);
}
