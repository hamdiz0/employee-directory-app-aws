const express = require('express');
const router = express.Router();

const employeesController = require('../controllers/employees');

//GET
router.get('/', employeesController.getAll);
router.get('/images', employeesController.getImages);

//POST
router.post('/create', employeesController.createTable);
router.post('/employee-photo', employeesController.getEmployeePhoto);
router.post('/get-upload-url', employeesController.getUploadUrl);

//PUT
router.put('/add', employeesController.addEmployee);
router.put('/update', employeesController.updateEmployee);
router.delete('/delete/:id', employeesController.deleteEmployee);

module.exports = router;
