import React, { useCallback } from "react";
import { Box, styled, Tab, Tabs } from "@mui/material";
import { usePage } from "../../state/page.state";
import { useKey } from "../../hooks/useKey";
import { useTabDisabledValue } from "../../state/keys.state";
import { useIsMenuVisibleValue } from "../../state/visibility.state";
import { useServerCtxValue } from "../../state/server.state";

const StyledTab = styled(Tab)({
  letterSpacing: '0.05em',
  minWidth: 70,
  fontSize: '0.75rem',
  padding: '6px 8px',
});

export const PageTabs: React.FC = () => {
  const [page, setPage] = usePage();
  const tabDisabled = useTabDisabledValue();
  const visible = useIsMenuVisibleValue();
  const serverCtx = useServerCtxValue();

  const handleTabPress = useCallback(() => {
    if (tabDisabled || !visible) return;
    setPage((prevState) => (prevState + 1 > 2 ? 0 : prevState + 1));
  }, [tabDisabled, visible]);

  useKey(serverCtx.switchPageKey, handleTabPress);

  return (
    <Box width="100%">
      <Tabs
        value={page}
        centered
        indicatorColor="primary"
        textColor="primary"
        onChange={(_, newVal) => setPage(newVal)}
      >
        <StyledTab label="Main" wrapped disableFocusRipple />
        <StyledTab label="Players" wrapped disableFocusRipple />
        <StyledTab label="Reports" wrapped disableFocusRipple />
        <StyledTab label="txAdmin" wrapped disableFocusRipple />
      </Tabs>
    </Box>
  );
};
