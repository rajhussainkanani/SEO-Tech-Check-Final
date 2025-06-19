import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  LinearProgress,
  Grid,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  ArrowBack,
  ContentCopy,
  Info,
  Speed,
  Image,
  Link,
  Security,
  Code,
  PhoneAndroid,
  TextFields,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SEOResults = ({ results, url, onNewAnalysis }) => {
  const [expandedSection, setExpandedSection] = useState('metadata');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
  };

  const getSeverityColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderScoreChip = (score, label) => (
    <Chip
      label={`${label}: ${score}/100`}
      color={getSeverityColor(score)}
      sx={{ fontWeight: 500 }}
    />
  );

  const renderIssueChip = (count, type) => {
    const color = count === 0 ? 'success' : count < 3 ? 'warning' : 'error';
    const icon = count === 0 ? <CheckCircle /> : count < 3 ? <Warning /> : <Error />;
    return (
      <Chip
        icon={icon}
        label={`${count} ${type}`}
        color={color}
        variant="outlined"
        size="small"
      />
    );
  };

  const sections = [
    {
      id: 'metadata',
      title: 'Metadata Analysis',
      icon: <TextFields />,
      content: (
        <>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Title Tag
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="body1">{results.metadata.title.content}</Typography>
              <Box mt={1}>
                <Chip
                  size="small"
                  label={`Length: ${results.metadata.title.length} characters`}
                  color={
                    results.metadata.title.length >= 30 &&
                    results.metadata.title.length <= 60
                      ? 'success'
                      : 'warning'
                  }
                  sx={{ mr: 1 }}
                />
              </Box>
            </Paper>
            {results.metadata.title.issues.map((issue, index) => (
              <Typography
                key={index}
                color="error"
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
              >
                <Warning fontSize="small" />
                {issue}
              </Typography>
            ))}
          </Box>

          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Meta Description
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="body1">
                {results.metadata.description.content}
              </Typography>
              <Box mt={1}>
                <Chip
                  size="small"
                  label={`Length: ${results.metadata.description.length} characters`}
                  color={
                    results.metadata.description.length >= 120 &&
                    results.metadata.description.length <= 160
                      ? 'success'
                      : 'warning'
                  }
                  sx={{ mr: 1 }}
                />
              </Box>
            </Paper>
            {results.metadata.description.issues.map((issue, index) => (
              <Typography
                key={index}
                color="error"
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
              >
                <Warning fontSize="small" />
                {issue}
              </Typography>
            ))}
          </Box>

          {results.metadata.keywords.length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Meta Keywords
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {results.metadata.keywords.map((keyword, index) => (
                  <Chip key={index} label={keyword} size="small" />
                ))}
              </Box>
            </Box>
          )}
        </>
      ),
    },
    {
      id: 'headings',
      title: 'Content Structure',
      icon: <TextFields />,
      content: (
        <>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Heading Hierarchy
            </Typography>
            {Object.entries(results.headings)
              .filter(([key]) => key !== 'issues')
              .map(([level, headings]) => (
                <Box key={level} mb={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    {level.toUpperCase()} ({headings.length})
                  </Typography>
                  {headings.map((heading, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center' }}
                    >
                      <Typography variant="body2">{heading.text}</Typography>
                      <Chip
                        size="small"
                        label={`${heading.length} chars`}
                        sx={{ ml: 'auto' }}
                      />
                    </Paper>
                  ))}
                </Box>
              ))}
            {results.headings.issues.map((issue, index) => (
              <Typography
                key={index}
                color="error"
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
              >
                <Warning fontSize="small" />
                {issue}
              </Typography>
            ))}
          </Box>
        </>
      ),
    },
    {
      id: 'links',
      title: 'Link Analysis',
      icon: <Link />,
      content: (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Internal Links
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {results.links.internal.length}
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {results.links.internal.map((link, index) => (
                    <Typography key={index} variant="body2" gutterBottom>
                      {link.text || link.url}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  External Links
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {results.links.external.length}
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {results.links.external.map((link, index) => (
                    <Typography key={index} variant="body2" gutterBottom>
                      {link.text || link.url}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
          {results.links.broken.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'error.light' }}>
              <Typography variant="h6" color="error.contrastText" gutterBottom>
                Broken Links Found
              </Typography>
              {results.links.broken.map((link, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  color="error.contrastText"
                  gutterBottom
                >
                  {link.text || link.href} - {link.reason}
                </Typography>
              ))}
            </Paper>
          )}
        </>
      ),
    },
    {
      id: 'images',
      title: 'Image Analysis',
      icon: <Image />,
      content: (
        <>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Image Optimization
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{results.images.total}</Typography>
                  <Typography variant="body2">Total Images</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{results.images.withAlt}</Typography>
                  <Typography variant="body2">With Alt Text</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{results.images.withoutAlt.length}</Typography>
                  <Typography variant="body2">Missing Alt Text</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          {results.images.withoutAlt.length > 0 && (
            <Box>
              <Typography variant="h6" color="error" gutterBottom>
                Images Missing Alt Text
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {results.images.withoutAlt.map((image, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 1, mb: 1 }}>
                    <Typography variant="body2" component="code">
                      {image.src}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </>
      ),
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: <Speed />,
      content: (
        <>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Resource Loading
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{results.performance.totalScripts}</Typography>
                  <Typography variant="body2">Total Scripts</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">
                    {results.performance.deferredScripts}
                  </Typography>
                  <Typography variant="body2">Deferred Scripts</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{results.performance.totalStyles}</Typography>
                  <Typography variant="body2">Stylesheets</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          {results.performance.issues.length > 0 && (
            <Box>
              <Typography variant="h6" color="error" gutterBottom>
                Performance Issues
              </Typography>
              {results.performance.issues.map((issue, index) => (
                <Typography
                  key={index}
                  color="error"
                  variant="body2"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
                >
                  <Warning fontSize="small" />
                  {issue}
                </Typography>
              ))}
            </Box>
          )}
        </>
      ),
    },
    {
      id: 'technical',
      title: 'Technical SEO',
      icon: <Code />,
      content: (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Technical Elements
                </Typography>
                <Box>
                  {[
                    { label: 'Viewport Meta Tag', value: results.technical.viewport },
                    { label: 'Character Set', value: results.technical.charset },
                    { label: 'Language', value: results.technical.language },
                    {
                      label: 'DOCTYPE Declaration',
                      value: results.technical.doctype ? 'Present' : 'Missing',
                    },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">{item.label}</Typography>
                      <Chip
                        size="small"
                        label={item.value || 'Missing'}
                        color={item.value ? 'success' : 'error'}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Security
                </Typography>
                <Box>
                  {[
                    {
                      label: 'HTTPS',
                      value: results.security.https ? 'Enabled' : 'Disabled',
                    },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">{item.label}</Typography>
                      <Chip
                        size="small"
                        label={item.value}
                        color={item.value === 'Enabled' ? 'success' : 'error'}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
          {results.technical.issues.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" color="error" gutterBottom>
                Technical Issues
              </Typography>
              {results.technical.issues.map((issue, index) => (
                <Typography
                  key={index}
                  color="error"
                  variant="body2"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
                >
                  <Warning fontSize="small" />
                  {issue}
                </Typography>
              ))}
            </Box>
          )}
        </>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={onNewAnalysis}
            variant="outlined"
            size="small"
          >
            New Analysis
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {url}
            </Typography>
            <Tooltip title="Copy URL">
              <IconButton size="small" onClick={handleCopyUrl}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {renderScoreChip(results.score, 'Overall Score')}
      </Box>

      {/* Results Sections */}
      {sections.map((section) => (
        <Accordion
          key={section.id}
          expanded={expandedSection === section.id}
          onChange={handleChange(section.id)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {section.icon}
              <Typography variant="h6">{section.title}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>{section.content}</AccordionDetails>
        </Accordion>
      ))}

      {/* Recommendations */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Recommendations
        </Typography>
        <Grid container spacing={2}>
          {results.recommendations.map((rec, index) => (
            <Grid item xs={12} key={index}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderLeft: 6,
                  borderLeftColor: (theme) =>
                    theme.palette[
                      rec.priority.toLowerCase() === 'high'
                        ? 'error'
                        : rec.priority.toLowerCase() === 'medium'
                        ? 'warning'
                        : 'success'
                    ].main,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                >
                  <Info color="primary" />
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {rec.issue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rec.solution}
                    </Typography>
                    <Chip
                      size="small"
                      label={rec.category}
                      sx={{ mt: 1 }}
                      color={
                        rec.priority.toLowerCase() === 'high'
                          ? 'error'
                          : rec.priority.toLowerCase() === 'medium'
                          ? 'warning'
                          : 'success'
                      }
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default SEOResults;
