import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Analytics: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Typography variant="body1">
        Analytics and quality metrics interface coming soon...
      </Typography>
    </Paper>
  );
};

export default Analytics;