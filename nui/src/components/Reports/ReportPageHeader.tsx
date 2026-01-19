import React, { useEffect, useState } from "react";
import { Box, InputAdornment, MenuItem, styled, Typography } from "@mui/material";
import { FilterAlt, Search, SwapVert } from "@mui/icons-material";
import { 
  ReportDataFilter, 
  ReportDataSort, 
  useReportsFilterBy, 
  useReportsSortBy, 
  useReportsState, 
  useReportsSearch,
  useFilteredSortedReports 
} from "../../state/reports.state";
import { useTranslate } from "react-polyglot";
import { TextField } from "../misc/TextField";
import { useDebounce } from "../../hooks/useDebouce";

const TypographyTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
}));

const TypographyCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 500,
}));

const InputAdornmentIcon = styled(InputAdornment)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const TextFieldInputs = styled(TextField)({
  minWidth: 150,
});

export const ReportPageHeader: React.FC = () => {
  const [filterType, setFilterType] = useReportsFilterBy();
  const [sortType, setSortType] = useReportsSortBy();
  const [reportSearch, setReportSearch] = useReportsSearch();
  const allReports = useReportsState();
  const filteredReports = useFilteredSortedReports();
  
  const [searchVal, setSearchVal] = useState(reportSearch);
  const t = useTranslate();
  const debouncedInput = useDebounce<string>(searchVal, 500);

  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterType(e.target.value as ReportDataFilter);
  };
  
  const onSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortType(e.target.value as ReportDataSort);
  };

  useEffect(() => {
    setReportSearch(debouncedInput);
  }, [debouncedInput, setReportSearch]);

  const reportCountLabel = `${filteredReports.length}/${allReports.length} ${t('nui_menu.page_report.admin.misc.reports')}`;

  return (
    <Box display="flex" justifyContent="space-between">
      <Box px={2}>
        <TypographyTitle variant="h5" color="primary">
          {t("nui_menu.page_report.admin.misc.tabtitle")}
        </TypographyTitle>
        <TypographyCount>
          {reportCountLabel}
        </TypographyCount>
      </Box>
      
      <Box display="flex" alignItems="center" justifyContent="center" gap={3}>
        <TextFieldInputs
          label={t("nui_menu.page_report.admin.misc.search")}
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornmentIcon position="start">
                <Search color="inherit" />
              </InputAdornmentIcon>
            ),
          }}
        />

        <TextFieldInputs
          label={t("nui_menu.page_report.admin.filter.label")}
          select
          value={filterType}
          onChange={onFilterChange}
          InputProps={{
            startAdornment: (
              <InputAdornmentIcon position="start">
                <FilterAlt color="inherit" />
              </InputAdornmentIcon>
            ),
          }}
        >
          {Object.values(ReportDataFilter).map((f) => (
            <MenuItem key={f} value={f}>
              {t(`nui_menu.page_report.admin.filter.${f.replace('-', '')}`)}
            </MenuItem>
          ))}
        </TextFieldInputs>

        <TextFieldInputs
          label={t("nui_menu.page_report.admin.sort.label")}
          select
          value={sortType}
          onChange={onSortChange}
          InputProps={{
            startAdornment: (
              <InputAdornmentIcon position="start">
                <SwapVert color="inherit" />
              </InputAdornmentIcon>
            ),
          }}
        >
          <MenuItem value={ReportDataSort.OpenedAt}>{t("nui_menu.page_report.admin.sort.openedat")}</MenuItem>
          <MenuItem value={ReportDataSort.LastAction}>{t("nui_menu.page_report.admin.sort.lastaction")}</MenuItem>
        </TextFieldInputs>
      </Box>
    </Box>
  );
};