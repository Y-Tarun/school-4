import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { GetStudentListAction } from './redux/actions';
import {
  selectStudents,
  selectStudentsError,
  selectStudentsLoading,
} from './redux/selector';
import RoleGate from '../../app/RoleGate';
import httpClient from '../../utility/httpClient';

type SortKey = 'name' | 'class';
type SortDirection = 'asc' | 'desc';

const StudentsTable = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const students = useAppSelector(selectStudents);
  const isLoading = useAppSelector(selectStudentsLoading);
  const error = useAppSelector(selectStudentsError);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isSelectingStudents, setIsSelectingStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');

  useEffect(() => {
    dispatch(GetStudentListAction());
  }, [dispatch]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((first, second) => {
      const firstValue = sortKey === 'name' ? first.name : first.className;
      const secondValue = sortKey === 'name' ? second.name : second.className;
      const result = firstValue.localeCompare(secondValue);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [sortDirection, sortKey, students]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((currentSelection) => {
      const nextSelection = new Set(currentSelection);
      if (nextSelection.has(studentId)) {
        nextSelection.delete(studentId);
      } else {
        nextSelection.add(studentId);
      }
      return nextSelection;
    });
  };

  const toggleAllStudents = () => {
    setSelectedStudents((currentSelection) =>
      currentSelection.size === students.length
        ? new Set()
        : new Set(students.map((student) => student.id)),
    );
  };

  const generateIdCards = async () => {
    try {
      const pdf = await httpClient.download('/id-cards/student-batch', {
        studentIds: [...selectedStudents],
      });
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student-id-cards.pdf';
      link.click();
      URL.revokeObjectURL(url);
      setNotice(`Generated ID cards for ${selectedStudents.size} student(s).`);
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : 'Unable to generate ID cards.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
        <RoleGate permissions={['students:write']}>
          <Button variant="outlined" onClick={() => setNotice('Use the student create API to add a record.')}>
            Add Student
          </Button>
        </RoleGate>
        <Button
          variant="outlined"
          onClick={() => setIsSelectingStudents((currentValue) => !currentValue)}
        >
          {isSelectingStudents ? 'Hide Selection' : 'Select Students'}
        </Button>
        <RoleGate permissions={['id_cards:generate']}>
          {isSelectingStudents && selectedStudents.size > 0 && (
            <Button variant="contained" onClick={generateIdCards}>
              Generate ID Cards
            </Button>
          )}
        </RoleGate>
      </Box>

      <TableContainer component={Paper}>
        <Table aria-label="Students table">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortKey === 'name' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'name'}
                  direction={sortKey === 'name' ? sortDirection : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Student Name
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === 'class' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'class'}
                  direction={sortKey === 'class' ? sortDirection : 'asc'}
                  onClick={() => handleSort('class')}
                >
                  Class
                </TableSortLabel>
              </TableCell>
              {isSelectingStudents && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedStudents.size === students.length}
                    indeterminate={
                      selectedStudents.size > 0 && selectedStudents.size < students.length
                    }
                    onChange={toggleAllStudents}
                    slotProps={{ input: { 'aria-label': 'Select all students' } }}
                  />
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isSelectingStudents ? 3 : 2}>Loading students...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={isSelectingStudents ? 3 : 2} role="alert">
                  {error}
                </TableCell>
              </TableRow>
            ) : sortedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSelectingStudents ? 3 : 2}>No students found.</TableCell>
              </TableRow>
            ) : (
              sortedStudents.map((student) => (
                <TableRow
                  key={student.id}
                  hover={!isSelectingStudents}
                  onClick={() => {
                    if (!isSelectingStudents) {
                      navigate(`/students/${student.id}`);
                    }
                  }}
                  sx={{ cursor: isSelectingStudents ? 'default' : 'pointer' }}
                >
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.className}</TableCell>
                  {isSelectingStudents && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        slotProps={{ input: { 'aria-label': `Select ${student.name}` } }}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        message={notice}
        onClose={() => setNotice('')}
      />
    </Box>
  );
};

export default StudentsTable;
