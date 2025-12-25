import React, { useEffect, useState } from 'react'
import { Box, Tab, Tabs, Tooltip, Button } from '@mui/material'
import { ArrowBack, SmartToy } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CustomTabPanel from '../TabPanel/CustomTabPanel'
import PreviewAnnotation from '../Annotation/PreviewAnnotation'
import AnnotationFilter from '../Annotation/AnnotationFilter'
import Tag from '../Tags/Tag'
import DetailPageOverview from '../DetailPageOverview/DetailPageOverview'
import Lineage from '../Lineage'
import DataQuality from '../DataQuality/DataQuality'
import DataProfile from '../DataProfile/DataProfile'
import EntryList from '../EntryList/EntryList'
import ShimmerLoader from '../Shimmer/ShimmerLoader'
import type { AppDispatch } from '../../app/store'
import { getSampleData } from '../../features/sample-data/sampleDataSlice'
import { popFromHistory } from '../../features/entry/entrySlice'
import { fetchAllDataScans, selectAllScans, selectAllScansStatus } from '../../features/dataScan/dataScanSlice';
import { useAuth } from '../../auth/AuthProvider'
import { getName, getEntryType, generateBigQueryLink, hasValidAnnotationData, generateLookerStudioLink } from '../../utils/resourceUtils'
import ChatInterface from '../Chat/ChatInterface';

const ViewDetails = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());
  const [dqScanName, setDqScanName] = useState<string | null>(null);
  const [dpScanName, setDpScanName] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [sampleTableData, setSampleTableData] = useState<any>(null);
  const [filteredEntry, setFilteredEntry] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { user } = useAuth();
  const id_token = user?.token;

  const entry = useSelector((state: any) => state.entry.item);
  const entryStatus = useSelector((state: any) => state.entry.status);
  const entryHistory = useSelector((state: any) => state.entry.history);
  const sampleData = useSelector((state: any) => state.sampleData.data);
  const sampleDataStatus = useSelector((state: any) => state.sampleData.status);
  const allScans = useSelector(selectAllScans);
  const allScansStatus = useSelector(selectAllScansStatus);

  const queryParams = new URLSearchParams(location.search);
  const entryName = queryParams.get('name');

  const handleAnnotationCollapseAll = () => {
    setExpandedAnnotations(new Set());
  };

  const handleAnnotationExpandAll = () => {
    if (entry?.aspects) {
      const number = getEntryType(entry.name, '/');
      const annotationKeys = Object.keys(entry.aspects)
        .filter(key =>
          key !== `${number}.global.schema` &&
          key !== `${number}.global.overview` &&
          key !== `${number}.global.contacts` &&
          key !== `${number}.global.usage`
        )
        .filter(key => hasValidAnnotationData(entry.aspects![key])); // Only expand those with data
      setExpandedAnnotations(new Set(annotationKeys));
    }
  };
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log(event);
    setTabValue(newValue);
  };


  const tabProps = (index: number) => {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`,
    };
  }

  const goBack = () => {
    // Check if we have entry history to go back to
    if (entryHistory && entryHistory.length > 0) {
      // Pop the last entry from history and set it as current
      dispatch(popFromHistory());
    } else {
      // If no history, fall back to browser navigation
      dispatch({ type: 'resources/setItems', payload: [] });
      navigate(-1);
    }
  };


  //   let schema = <Schema entry={entry} css={{width:"100%"}} />;

  let annotationTab = <PreviewAnnotation
    entry={filteredEntry || entry}
    css={{ width: "100%", borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', marginRight: '8px' }}
    isTopComponent={true}
    expandedItems={expandedAnnotations}
    setExpandedItems={setExpandedAnnotations}

  />; let overviewTab = <DetailPageOverview entry={entry} css={{ width: "100%" }} sampleTableData={sampleTableData} />;

  //   useEffect(() => {
  //     if(getEntryType(entry.name, '/') == 'Tables') {
  //         // schema = <Schema entry={entry} css={{width:"100%"}} />;
  //         dispatch(getSampleData({fqn: entry.fullyQualifiedName, id_token: id_token}));
  //     }
  //   }, []);

  useEffect(() => {
    // Only fetch if we have a token and haven't fetched yet
    if (id_token) { // && allScansStatus === 'idle') {
      dispatch(fetchAllDataScans({ id_token: id_token, projectId: entry?.entrySource?.resource.split('/')[1] || '' }));
    }
  }, []);//[dispatch, id_token, allScansStatus]);

  useEffect(() => {
    if (
      entryStatus === 'succeeded' &&
      allScansStatus === 'succeeded' &&
      entry?.entrySource?.resource &&
      allScans
    ) {
      // console.log("All data scans from API:", allScans);

      const resourceName = entry.entrySource.resource;

      // Find the Data Quality scan
      const dqScan = allScans.find(
        (scan: any) =>
          scan.data.resource.includes(resourceName) && scan.type === 'DATA_QUALITY'
      );
      setDqScanName(dqScan ? dqScan.name : null);

      // Find the Data Profile scan
      const dpScan = allScans.find(
        (scan: any) =>
          scan.data.resource.includes(resourceName) && scan.type === 'DATA_PROFILE'
      );
      setDpScanName(dpScan ? dpScan.name : null);

      // console.log(`For resource [${resourceName}], found DQ scan: ${dqScan ? dqScan.name : 'None'}`);
      // console.log(`For resource [${resourceName}], found DP scan: ${dpScan ? dpScan.name : 'None'}`);

    }
  }, [entry, entryStatus, allScans, allScansStatus, entry?.entrySource?.resource]);


  useEffect(() => {
    if (sampleDataStatus === 'succeeded') {
      // schema = <Schema entry={entry} css={{width:"100%"}} />;
      if (entry.entrySource?.system.toLowerCase() === 'bigquery') {
        setSampleTableData(sampleData);
        console.log("Sample Data:", sampleData);
      }
    }
  }, [sampleData]);

  useEffect(() => {
    if (entryStatus === 'loading') {
      setLoading(true);
    }
    if (entryStatus === 'succeeded') {
      // schema = <Schema entry={entry} css={{width:"100%"}} />;
      setLoading(false);
      if (getEntryType(entry.name, '/') == 'Tables' && entry.entrySource?.system.toLowerCase() === 'bigquery') {
        dispatch(getSampleData({ fqn: entry.fullyQualifiedName, id_token: id_token }));
      }
      // console.log("loader:", loading);
    }
  }, [entryStatus]);

  // Handle case where entry is already loaded from persistence
  useEffect(() => {
    if (entry && entryStatus === 'succeeded' && !loading) {
      // Entry is already loaded, no need to show loading state
      setLoading(false);
    }
  }, [entry, entryStatus, loading]);

  // Reset tab value when entry changes to prevent tab index issues
  useEffect(() => {
    if (entry) {
      setTabValue(0);
    }
  }, [entry?.name]);
  // Lineage tab with full Lineage component
  const lineageTab = <Lineage entry={entry} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "0px 1rem", background: "#F8FAFD", minHeight: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "column", borderRadius: "20px", background: "#ffffff", minHeight: "95vh", marginBottom: "2rem" }}>
        {loading ? (<div style={{ margin: "0px 20px" }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "24px 0px 16px 0px",
            minHeight: "500px",
          }}>
            <ShimmerLoader count={6} type="card" />
          </div>
        </div>) : (<div style={{ padding: "0px 0rem" }}>
          {/* Sticky Header Container */}
          <div style={{
            position: 'sticky',
            top: '64px',
            backgroundColor: '#ffffff',
            zIndex: 1000,
            borderRadius: '20px 20px 0 0'
          }}>

            {/* Primary Title Bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "24px 0px 4px 0px"
            }}>
              {/* Left Side - Back Arrow, Title, and Tags */}
              <div style={{
                display: "flex",
                alignItems: "center"
              }}>
                <button
                  onClick={goBack}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0B57D0",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    marginRight: "1rem"
                  }}
                >
                  <ArrowBack style={{ fontSize: "24px" }} />
                </button>
                <Tooltip
                  title={
                    entry.entrySource.displayName.length > 0
                      ? entry.entrySource.displayName
                      : getName(entry.name || '', '/')
                  }
                >
                  <div style={{
                    fontSize: "24px",
                    fontWeight: 500,
                    color: "#1F1F1F",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "600px",
                    marginRight: "1rem"
                  }}>
                    {entry.entrySource.displayName.length > 0
                      < div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Open in BigQuery Button */}
                    {entry.entrySource?.system.toLowerCase() === 'bigquery' && (
                      <Tooltip title="Open in BigQuery Console">
                        <Button
                          variant="outlined"
                          startIcon={<Box component="img" src="https://www.gstatic.com/images/branding/product/1x/bigquery_48dp.png" sx={{ width: 20, height: 20 }} />}
                          onClick={() => window.open(generateBigQueryLink(entry.fullyQualifiedName), '_blank')}
                          sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#3c4043' }}
                        >
                          Open in BigQuery
                        </Button>
                      </Tooltip>
                    )}

                    {/* Explore with Looker Studio Button */}
                    {entry.entrySource?.system.toLowerCase() === 'bigquery' && (
                      <Tooltip title="Create report in Looker Studio">
                        <Button
                          variant="outlined"
                          startIcon={<Box component="img" src="https://www.gstatic.com/images/branding/product/1x/looker_studio_48dp.png" sx={{ width: 20, height: 20 }} />}
                          onClick={() => window.open(generateLookerStudioLink(entry.fullyQualifiedName), '_blank')}
                          sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: '#3c4043' }}
                        >
                          Explore
                        </Button>
                      </Tooltip>
                    )}
                  </div>
              </div>

              {/* Tabs Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', marginTop: '1rem' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="entry details tabs">
                  <Tab label="Overview" {...tabProps(0)} />
                  {getEntryType(entry.name, '/') === 'Tables' && <Tab label="Aspects" {...tabProps(1)} />}
                  {getEntryType(entry.name, '/') === 'Tables' && <Tab label="Lineage" {...tabProps(2)} />}
                  {getEntryType(entry.name, '/') === 'Tables' && <Tab label="Data Profile" {...tabProps(3)} />}
                  {getEntryType(entry.name, '/') === 'Tables' && <Tab label="Data Quality" {...tabProps(4)} />}

                  {getEntryType(entry.name, '/') === 'Datasets' && <Tab label="Entry List" {...tabProps(1)} />}
                  {getEntryType(entry.name, '/') === 'Datasets' && <Tab label="Aspects" {...tabProps(2)} />}

                  {getEntryType(entry.name, '/') !== 'Tables' && getEntryType(entry.name, '/') !== 'Datasets' && <Tab label="Aspects" {...tabProps(1)} />}
                </Tabs>
              </Box>
              {/* Data Profile Tab (Index 3 for Tables) */}
              {getEntryType(entry.name, '/') === 'Tables' && (
                <CustomTabPanel value={tabValue} index={3}>
                  <DataProfile scanName={dpScanName} />
                </CustomTabPanel>
              )}

              {/* Data Quality Tab (Index 4 for Tables) */}
              {getEntryType(entry.name, '/') === 'Tables' && (
                <CustomTabPanel value={tabValue} index={4}>
                  <DataQuality scanName={dqScanName} />
                </CustomTabPanel>
              )}

              {/* Entry List Tab (Index 1 for Datasets) */}
              {getEntryType(entry.name, '/') === 'Datasets' && (
                <CustomTabPanel value={tabValue} index={1}>
                  <EntryList entry={entry} />
                </CustomTabPanel>
              )}
            </Box>
          </div>)}
        </div>

      {/* Chat Button */}
        <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SmartToy />}
            onClick={() => setChatOpen(true)}
            sx={{ borderRadius: '28px', padding: '12px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            Chat with Table
          </Button>
        </Box>

        <ChatInterface
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          context={{
            type: 'table',
            name: entryName || 'Table',
            description: 'Data table analysis'
          }}
        />
      </div>
      );
};

      export default ViewDetails;