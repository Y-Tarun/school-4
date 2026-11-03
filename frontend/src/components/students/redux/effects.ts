import { createListenerMiddleware } from '@reduxjs/toolkit';
import httpClient from '../../../utility/httpClient';
import type { Student } from '../data';
import {
  GetStudentListAction,
  GetStudentsListError,
  GetStudentsListSuccess,
} from './actions';

export const studentsEffects = createListenerMiddleware();

studentsEffects.startListening({
  actionCreator: GetStudentListAction,
  effect: async (_, listenerApi) => {
    try {
      const studentList = await httpClient.get<Student[]>('/students');
      listenerApi.dispatch(GetStudentsListSuccess(studentList));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load students.';
      listenerApi.dispatch(GetStudentsListError(message));
    }
  },
});