import { createAction } from '@reduxjs/toolkit';
import type { Student } from '../data';

export const GetStudentListAction = createAction('students/getStudentList');

export const GetStudentsListSuccess = createAction<Student[]>('students/getStudentListSuccess');

export const GetStudentsListError = createAction<string>('students/getStudentListError');