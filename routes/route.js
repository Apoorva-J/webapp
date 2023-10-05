import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';

const router = express.Router();

router.route('/assignments').post(assignmentController.post);
router.route('/assignments/:id').delete(assignmentController.remove);
router.route('/assignments').get(assignmentController.getAssignments);
router.route('/assignments/:id').put(assignmentController.updatedAssignment);
router.route('/healthz').all(assignmentController.healthz);
router.route('/assignments/:id').get(assignmentController.getAssignmentUsingId);
router.use((req, res) => {
    res.status(404).send('');
});

export default router;