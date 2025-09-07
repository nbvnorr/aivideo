import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import videosSlice from './slices/videosSlice';
import seriesSlice from './slices/seriesSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    videos: videosSlice,
    series: seriesSlice,
  },
});

export default store;

