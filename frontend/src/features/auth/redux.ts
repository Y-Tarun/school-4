import { createAction, createReducer, createListenerMiddleware } from '@reduxjs/toolkit';
import httpClient from '../../utility/httpClient';
import type { LoginResponse, AuthUser } from './types';

const ACCESS_TOKEN_KEY = 'tarun_school_access_token';
const REFRESH_TOKEN_KEY = 'tarun_school_refresh_token';

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const initializeAuth = createAction('auth/initialize');
export const login = createAction<{ email: string; password: string }>('auth/login');
export const logout = createAction('auth/logout');
const authInitialized = createAction<AuthUser | null>('auth/initialized');
const loginSucceeded = createAction<LoginResponse>('auth/loginSucceeded');
const authFailed = createAction<string>('auth/failed');
const logoutSucceeded = createAction('auth/logoutSucceeded');

export const authReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(initializeAuth, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(login, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(loginSucceeded, (state, action) => {
      state.user = action.payload.user;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = null;
    })
    .addCase(authInitialized, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.isInitialized = true;
    })
    .addCase(authFailed, (state, action) => {
      state.user = null;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = action.payload;
    })
    .addCase(logoutSucceeded, (state) => {
      state.user = null;
      state.isLoading = false;
    });
});

export const authEffects = createListenerMiddleware();

authEffects.startListening({
  actionCreator: initializeAuth,
  effect: async (_, listenerApi) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      listenerApi.dispatch(authInitialized(null));
      return;
    }

    httpClient.setAccessToken(accessToken);
    try {
        let response: { user: AuthUser };
        try {
          response = await httpClient.get<{ user: AuthUser }>('/auth/me');
        } catch {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (!refreshToken) {
            throw new Error('No refresh token is available.');
          }
          const refreshed = await httpClient.post<LoginResponse>('/auth/refresh', {
            refreshToken,
          });
          localStorage.setItem(ACCESS_TOKEN_KEY, refreshed.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshed.refreshToken);
          httpClient.setAccessToken(refreshed.accessToken);
          response = await httpClient.get<{ user: AuthUser }>('/auth/me');
        }
        listenerApi.dispatch(authInitialized(response.user));
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      httpClient.setAccessToken(null);
      listenerApi.dispatch(authInitialized(null));
    }
  },
});

authEffects.startListening({
  actionCreator: login,
  effect: async (action, listenerApi) => {
    try {
      const response = await httpClient.post<LoginResponse>('/auth/login', action.payload);
      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      httpClient.setAccessToken(response.accessToken);
      listenerApi.dispatch(loginSucceeded(response));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      listenerApi.dispatch(authFailed(message));
    }
  },
});

authEffects.startListening({
  actionCreator: logout,
  effect: async (_, listenerApi) => {
    try {
      await httpClient.post('/auth/logout');
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      httpClient.setAccessToken(null);
      listenerApi.dispatch(logoutSucceeded());
    }
  },
});

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
