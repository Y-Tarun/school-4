import { createReducer } from '@reduxjs/toolkit';
import type { Student } from '../data';
import {
  GetStudentListAction,
  GetStudentsListError,
  GetStudentsListSuccess,
} from './actions';

export interface StudentsState {
  students: Student[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StudentsState = {
  students: [],
  isLoading: false,
  error: null,
};

export const studentsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(GetStudentListAction, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(GetStudentsListSuccess, (state, action) => {
      state.students = action.payload;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(GetStudentsListError, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
});