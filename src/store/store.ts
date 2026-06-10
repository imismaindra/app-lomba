import { configureStore } from '@reduxjs/toolkit';
import ecoPointReducer from './ecoPointSlice';

export const store = configureStore({
  reducer: {
    ecoPoint: ecoPointReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
