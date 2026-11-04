const repo = require('../repositories/studentsRepository');

const getAllStudents = async () => {
  return await repo.getAllStudents();
};

const getStudentById = async (id) => {
  return await repo.getStudentById(id);
};

const createStudent = async (studentData) => {
  return await repo.createStudent(studentData);
};

const updateStudent = async (id, studentData) => {
  return await repo.updateStudent(id, studentData);
};

const deleteStudent = async (id) => {
  return await repo.deleteStudent(id);
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};