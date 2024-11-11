import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import {
  DatePicker,
} from '@mui/x-date-pickers';

import CalendarToday from '@mui/icons-material/CalendarToday';
import { format, isValid } from 'date-fns';

interface DateRange {
  startDate?: Date;
  endDate?: Date;
  preset?: 'all' | '1h' | '4h' | '24h' | '7d' | '30d' | 'custom';
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

const presets = [
  { label: 'All Time', value: 'all' },
  { label: 'Last Hour', value: '1h' },
  { label: 'Last 4 Hours', value: '4h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Custom Range', value: 'custom' },
] as const;

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tempDateRange, setTempDateRange] = useState<DateRange>(dateRange);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setTempDateRange(dateRange);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetChange = (preset: DateRange['preset']) => {
    const now = new Date();
    let newRange: DateRange = { preset };

    switch (preset) {
      case '1h':
        newRange = {
          startDate: new Date(now.getTime() - 60 * 60 * 1000),
          endDate: now,
          preset,
        };
        break;
      case '4h':
        newRange = {
          startDate: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          endDate: now,
          preset,
        };
        break;
      case '24h':
        newRange = {
          startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          endDate: now,
          preset,
        };
        break;
      case '7d':
        newRange = {
          startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          endDate: now,
          preset,
        };
        break;
      case '30d':
        newRange = {
          startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          endDate: now,
          preset,
        };
        break;
      case 'custom':
        newRange = {
          ...tempDateRange,
          preset,
        };
        break;
      default:
        newRange = { preset: 'all' };
    }

    setTempDateRange(newRange);
    if (preset !== 'custom') {
      onChange(newRange);
      handleClose();
    }
  };

  const handleDateChange = (type: 'startDate' | 'endDate', date: Date | null) => {
    if (date && isValid(date)) {
      const newRange = {
        ...tempDateRange,
        [type]: date,
        preset: 'custom' as const,
      };
      setTempDateRange(newRange);
    }
  };

  const handleApply = () => {
    onChange(tempDateRange);
    handleClose();
  };

  const getDisplayText = () => {
    if (dateRange.preset === 'custom' && dateRange.startDate && dateRange.endDate) {
      return `${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(
        dateRange.endDate,
        'MMM dd, yyyy'
      )}`;
    }
    return presets.find((p) => p.value === dateRange.preset)?.label || 'Select Date Range';
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        startIcon={<CalendarToday />}
        fullWidth
        sx={{
          justifyContent: 'flex-start',
          textAlign: 'left',
          '& .MuiButton-startIcon': {
            marginRight: 1,
          },
        }}
      >
        {getDisplayText()}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPopover-paper': {
            width: 320,
            p: 2,
          },
        }}
      >
        <Paper elevation={0}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Preset Ranges
            </Typography>
            <List disablePadding dense>
              {presets.map((preset) => (
                <ListItem key={preset.value} disablePadding>
                  <ListItemButton
                    selected={tempDateRange.preset === preset.value}
                    onClick={() => handlePresetChange(preset.value)}
                    dense
                  >
                    <ListItemText primary={preset.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            {tempDateRange.preset === 'custom' && (
              <>
                <Divider />
                <Typography variant="subtitle2" color="text.secondary">
                  Custom Range
                </Typography>
                <Stack spacing={2}>
                  <DatePicker
                    label="Start Date"
                    value={tempDateRange.startDate || null}
                    onChange={(date) => handleDateChange('startDate', date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                  <DatePicker
                    label="End Date"
                    value={tempDateRange.endDate || null}
                    onChange={(date) => handleDateChange('endDate', date)}
                    minDate={tempDateRange.startDate}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      size="small"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleApply}
                      disabled={!tempDateRange.startDate || !tempDateRange.endDate}
                    >
                      Apply Range
                    </Button>
                  </Box>
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      </Popover>
    </>
  );
};

export default DateRangePicker;