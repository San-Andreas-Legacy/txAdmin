import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// Import the new report-specific state hook
import { useFilteredSortedReports } from "../../state/reports.state";
import ReportCard from "./ReportCard";
import { Box, CircularProgress, styled } from "@mui/material";
import { useIsMenuVisibleValue } from "@nui/src/state/visibility.state";

const MAX_PER_BUCKET = 60;
const FAKE_LOAD_TIME = 250;

const DivWrapper = styled("div")({
  overflow: "auto",
});

const DivLoadTrigger = styled("div")({
  height: 50,
});

const BoxLoadingSpinner = styled(Box)({
  display: "flex",
  justifyContent: "center",
});

export const ReportsListGrid: React.FC = () => {
  // Use the new reports hook
  const filteredReports = useFilteredSortedReports();
  const [bucket, setBucket] = useState(1);
  const [fakeLoading, setFakeLoading] = useState(false);
  const containerRef = useRef(null);
  const isMenuVisible = useIsMenuVisibleValue();

  useEffect(() => {
    // Keep bucket valid based on report list size
    setBucket((prevBucketState) => {
      const highestPotentialBucket = Math.ceil(
        filteredReports.length / MAX_PER_BUCKET
      );
      if (highestPotentialBucket < prevBucketState)
        return Math.max(1, highestPotentialBucket);
      else return prevBucketState;
    });
  }, [filteredReports]);

  const slicedReports = useMemo(
    () => filteredReports.slice(0, MAX_PER_BUCKET * bucket),
    [filteredReports, bucket]
  );

  const handleObserver = useCallback(
    (entities: IntersectionObserverEntry[]) => {
      const lastEntry = entities[0];

      // Reset if menu is closed to save resources
      if (!isMenuVisible) return setBucket(1);

      if (
        lastEntry.isIntersecting &&
        filteredReports.length > slicedReports.length &&
        !fakeLoading
      ) {
        setFakeLoading(true);
        setTimeout(() => {
          setBucket((prevState) => prevState + 1);
          setFakeLoading(false);
        }, FAKE_LOAD_TIME);
      }
    },
    [filteredReports.length, slicedReports.length, fakeLoading, isMenuVisible]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "10px",
      threshold: 0.9,
    });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [handleObserver]);

  return (
    <DivWrapper>
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
      >
        {slicedReports.map((report) => (
          <ReportCard reportData={report} key={report.id} />
        ))}
      </Box>
      
      {/* Intersection Observer Trigger */}
      <DivLoadTrigger ref={containerRef} />
      
      {fakeLoading && (
        <BoxLoadingSpinner>
          <CircularProgress />
        </BoxLoadingSpinner>
      )}
    </DivWrapper>
  );
};
