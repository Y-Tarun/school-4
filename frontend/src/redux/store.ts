import { configureStore } from '@reduxjs/toolkit';
import { studentsEffects } from '../components/students/redux/effects';
import { studentsReducer } from '../components/students/redux/reducer';
import { authEffects, authReducer } from '../features/auth/redux';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(authEffects.middleware)
      .prepend(studentsEffects.middleware),
});

// Infer the `RootState`, `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;