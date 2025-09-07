import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Async thunks
export const fetchSeries = createAsyncThunk(
  'series/fetchSeries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/series`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createSeries = createAsyncThunk(
  'series/createSeries',
  async (seriesData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/series`, seriesData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateSeries = createAsyncThunk(
  'series/updateSeries',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/series/${id}`, data, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteSeries = createAsyncThunk(
  'series/deleteSeries',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/series/${id}`, {
        headers: getAuthHeaders(),
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const generateNextVideo = createAsyncThunk(
  'series/generateNextVideo',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/series/${id}/generate-next`, {}, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const seriesSlice = createSlice({
  name: 'series',
  initialState: {
    series: [],
    currentSeries: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSeries: (state, action) => {
      state.currentSeries = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Series
      .addCase(fetchSeries.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSeries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.series = action.payload;
      })
      .addCase(fetchSeries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload.message;
      })
      // Create Series
      .addCase(createSeries.fulfilled, (state, action) => {
        state.series.unshift(action.payload);
      })
      // Update Series
      .addCase(updateSeries.fulfilled, (state, action) => {
        const index = state.series.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.series[index] = action.payload;
        }
      })
      // Delete Series
      .addCase(deleteSeries.fulfilled, (state, action) => {
        state.series = state.series.filter(s => s.id !== action.payload);
      });
  },
});

export const { clearError, setCurrentSeries } = seriesSlice.actions;
export default seriesSlice.reducer;

