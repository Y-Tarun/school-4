import type { RootState } from '../../../redux/store';

export const selectStudents = (state: RootState) => state.students.students;
export const selectStudentsLoading = (state: RootState) => state.students.isLoading;
export const selectStudentsError = (state: RootState) => state.students.error;