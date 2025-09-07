import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Async thunks
export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos`, {
        headers: getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'videos/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/dashboard-stats`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createVideo = createAsyncThunk(
  'videos/createVideo',
  async (videoData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/videos`, videoData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateVideo = createAsyncThunk(
  'videos/updateVideo',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/videos/${id}`, data, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteVideo = createAsyncThunk(
  'videos/deleteVideo',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/videos/${id}`, {
        headers: getAuthHeaders(),
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const generateVideo = createAsyncThunk(
  'videos/generateVideo',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/videos/${id}/generate`, {}, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const videosSlice = createSlice({
  name: 'videos',
  initialState: {
    videos: [],
    dashboardStats: null,
    currentVideo: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentVideo: (state, action) => {
      state.currentVideo = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Videos
      .addCase(fetchVideos.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = action.payload;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload.message;
      })
      // Dashboard Stats
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      // Create Video
      .addCase(createVideo.fulfilled, (state, action) => {
        state.videos.unshift(action.payload);
      })
      // Update Video
      .addCase(updateVideo.fulfilled, (state, action) => {
        const index = state.videos.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.videos[index] = action.payload;
        }
      })
      // Delete Video
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.videos = state.videos.filter(v => v._id !== action.payload);
      })
      // Generate Video
      .addCase(generateVideo.fulfilled, (state, action) => {
        const index = state.videos.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.videos[index] = action.payload;
        }
      });
  },
});

export const { clearError, setCurrentVideo } = videosSlice.actions;
export default videosSlice.reducer;

