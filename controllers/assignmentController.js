import {
  addAssignment,
  removeAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  healthCheck,
} from "../services/assignment.js";
import db from "../config/dbSetup.js";
import { authUser } from "../config/validator.js";
import logger from "../logger.js";
import StatsD from "node-statsd";
import AWS from "aws-sdk";

const sns = new AWS.SNS();
const snsTopicArn = process.env.SNS_TOPIC_ARN;

const statsd = new StatsD({ host: "localhost", port: 8125 });

const health = await healthCheck();

// Create assignment
export const post = async (request, response) => {
  try {
    if (health !== true) {
      logger.error("Health check failed. Unable to create assignment.");
      return response
        .status(503)
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .send("");
    }

    const authenticated = await authUser(request, response);

    if (authenticated === null) {
      logger.warn("Authentication failed. Unable to create assignment.");
      return response.status(401).send("");
    }

    // Increment custom metric for post API calls
    statsd.increment("api.post.calls");

    const bodyKeys = Object.keys(request.body);
    const requiredKeys = ["name", "points", "num_of_attempts", "deadline"];
    const optionalKeys = ["assignment_created", "assignment_updated"];

    // Check if all required keys are present
    const missingKeys = requiredKeys.filter((key) => !bodyKeys.includes(key));

    if (missingKeys.length > 0) {
      logger.warn(
        "Missing required keys in the payload:",
        missingKeys.join(", ")
      );
      return response
        .status(400)
        .send("Missing required keys: " + missingKeys.join(", "));
    }

    // Check if there are any additional keys in the payload
    const extraKeys = bodyKeys.filter(
      (key) => !requiredKeys.includes(key) && !optionalKeys.includes(key)
    );

    if (extraKeys.length > 0) {
      logger.warn("Invalid keys in the payload:", extraKeys.join(", "));
      return response
        .status(400)
        .send("Invalid keys in the payload: " + extraKeys.join(", "));
    }

    if (typeof request.body.name !== "string") {
      return response.status(400).json({
        message: "Name must be an string.",
      });
    }

    // Check if 'points' is an integer
    if (!Number.isInteger(request.body.points)) {
      return response.status(400).json({
        message: "Points must be an integer.",
      });
    }

    // Check if 'num_of_attempts' is an integer
    if (!Number.isInteger(request.body.num_of_attempts)) {
      return response.status(400).json({
        message: "Number_of_attempts must be an integer.",
      });
    }

    // Check if 'deadline' is a valid date
    const deadlineDate = new Date(request.body.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return response.status(400).json({
        message: "Deadline must be an valid date.",
      });
    }

    try {
      const newDetails = {
        ...request.body,
        user_id: authenticated,
        assignment_created: new Date().toISOString(),
        assignment_updated: new Date().toISOString(),
      };
      await addAssignment(newDetails);
      logger.info("Assignment has been successfully created.");
      return response.status(201).send("");
    } catch (error) {
      logger.error("Error creating assignment:", error);
      return response.status(400).send("");
    }
  } catch {
    logger.error("Syntax error in the request");
    return response.status(400).json({ error: "Syntax error" }).send();
  }
};

// Get all assignments
export const getAssignments = async (request, response) => {
  if (health !== true) {
    logger.error("Health check failed. Unable to retrieve all assignments.");
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);

  if (authenticated === null) {
    logger.warn("Authentication failed. Unable to retrieve all assignments.");
    return response.status(401).send("");
  }

  // Increment custom metric for post API calls
  statsd.increment("api.getAssignments.calls");

  try {
    const assignments = await getAllAssignments();

    if (request.body && Object.keys(request.body).length > 0) {
      logger.warn("Invalid request body. Unable to retrieve all assignments.");
      return response.status(400).send();
    } else {
      logger.info("All assignments have been successfully retrieved.");
      return response.status(200).send(assignments);
    }
  } catch (error) {
    logger.error("Error retrieving all assignments:", error);
    return response.status(400).send("");
  }
};

// Get assignment by Id
export const getAssignmentUsingId = async (request, response) => {
  if (health !== true) {
    logger.error("Health check failed. Unable to retrieve assignment by ID.");
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);
  if (authenticated === null) {
    logger.warn("Authentication failed. Unable to retrieve assignment by ID.");
    return response.status(401).send("");
  }

  // Increment custom metric for post API calls
  statsd.increment("api.getAssignmentUsingId.calls");

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });

  if (!assignment) {
    logger.warn(
      `Assignment with ID ${request.params.id} not found. Unable to retrieve assignment by ID.`
    );
    return response.status(404).send("");
  }

  try {
    const id = request.params.id;
    const assignments = await getAssignmentById(id);

    if (request.body && Object.keys(request.body).length > 0) {
      logger.warn("Invalid request body. Unable to retrieve assignment by ID.");
      return response.status(400).send();
    } else {
      logger.info(`Assignment with ID ${id} has been successfully retrieved.`);
      return response.status(200).send(assignments);
    }
  } catch (error) {
    logger.error("Error retrieving assignment by ID:", error);
    return response.status(400).send("");
  }
};

// Update assignment
export const updatedAssignment = async (request, response) => {
  if (health !== true) {
    logger.error("Health check failed. Unable to update assignment.");
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);
  if (authenticated === null) {
    logger.warn("Authentication failed. Unable to update assignment.");
    return response.status(401).send("");
  }

  // Increment custom metric for post API calls
  statsd.increment("api.updatedAssignment.calls");

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });

  if (!assignment) {
    logger.warn(
      `Assignment with ID ${request.params.id} not found. Unable to update assignment.`
    );
    return response.status(404).send("");
  }

  if (assignment.user_id !== authenticated) {
    logger.warn(
      `Permission denied. User ${authenticated} does not have access to update assignment with ID ${request.params.id}.`
    );
    return response.status(403).send("");
  }

  const bodyKeys = Object.keys(request.body);

  const requiredKeys = ["name", "points", "num_of_attempts", "deadline"];

  const optionalKeys = ["assignment_created", "assignment_updated"];

  // Check if all required keys are present
  const missingKeys = requiredKeys.filter((key) => !bodyKeys.includes(key));

  if (missingKeys.length > 0) {
    logger.warn(
      "Missing required keys in the payload:",
      missingKeys.join(", ")
    );
    return response
      .status(400)
      .send("Missing required keys: " + missingKeys.join(", "));
  }

  // Check if there are any additional keys in the payload
  const extraKeys = bodyKeys.filter(
    (key) => !requiredKeys.includes(key) && !optionalKeys.includes(key)
  );

  if (extraKeys.length > 0) {
    logger.warn("Invalid keys in the payload:", extraKeys.join(", "));
    return response
      .status(400)
      .send("Invalid keys in the payload: " + extraKeys.join(", "));
  }

  if (typeof request.body.name !== "string") {
    return response.status(400).json({
      message: "Name must be an string.",
    });
  }

  // Check if 'points' is an integer
  if (!Number.isInteger(request.body.points)) {
    return response.status(400).json({
      message: "Points must be an integer.",
    });
  }

  // Check if 'num_of_attempts' is an integer
  if (!Number.isInteger(request.body.num_of_attempts)) {
    return response.status(400).json({
      message: "Number_of_attempts must be an integer.",
    });
  }

  // Check if 'deadline' is a valid date
  const deadlineDate = new Date(request.body.deadline);
  if (isNaN(deadlineDate.getTime())) {
    return response.status(400).json({
      message: "Deadline must be an valid date.",
    });
  }

  try {
    const id = request.params.id;
    const newDetails = {
      ...request.body,
      assignment_updated: new Date().toISOString(),
    };
    await updateAssignment(newDetails, id);
    logger.info(`Assignment with ID ${id} has been successfully updated.`);
    return response.status(204).send("");
  } catch (error) {
    logger.error("Error updating assignment:", error);
    console.log("db error");
    return response.status(400).send("");
  }
};

// Remove assignment
export const remove = async (request, response) => {
  if (health !== true) {
    logger.error("Health check failed. Unable to remove assignment.");
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);

  if (authenticated === null) {
    logger.warn("Authentication failed. Unable to remove assignment.");
    return response.status(401).send("");
  }

  // Increment custom metric for post API calls
  statsd.increment("api.remove.calls");

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });

  if (!assignment) {
    logger.warn(
      `Assignment with ID ${request.params.id} not found. Unable to remove assignment.`
    );
    return response.status(404).send("");
  }

  if (assignment.user_id !== authenticated) {
    logger.warn(
      `Permission denied. User ${authenticated} does not have access to remove assignment with ID ${request.params.id}.`
    );
    return response.status(403).send("");
  }

  if (request.body && Object.keys(request.body).length > 0) {
    logger.warn("Invalid request body. Unable to remove assignment.");
    return response.status(400).send("");
  }

  try {
    const id = request.params.id;
    await removeAssignment(id);
    logger.info(`Assignment with ID ${id} has been successfully removed.`);
    return response.status(204).send("");
  } catch (error) {
    logger.error("Error removing assignment:", error);
    console.log("db error");
    return response.status(400).send("");
  }
};

//Post Submissions
export const postSubmission = async (req, res) => {
  try {
    if (health !== true) {
      logger.error("Health check failed. Unable to create assignment.");
      return response
        .status(503)
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .send("");
    }
    const authenticated = await authUser(request, response);

    if (authenticated === null) {
      logger.warn("Authentication failed. Unable to create assignment.");
      return response.status(401).send("");
    }
    //Increment custom metric for post API calls
    statsd.increment("api.postSubmission.calls");
    // statsdClient.increment("api_call_post_submission");
    logger.info(`Received ${req.method} request to add submission`);
    let assignmentId = req.params.id;
    const userId = req.user.id;
    const user = await db.user.findByPk(userId);

    if (
      Object.entries(req.body).length === 0 ||
      Object.keys(req.body).length === 0 ||
      JSON.stringify(req.body) === "{}"
    ) {
      logger.warn("Bad request: Request body is empty.");
      return res.status(400).send({ message: "Bad Request" });
    }

    let assignment = await db.assignment.findOne({
      where: { id: assignmentId },
    });
    // console.log("assi", assignment);
    if (!assignment) {
      logger.info(`No assignment found with id: ${id}`);
      return res.status(404).send({ message: "Assignment not found" });
    }

    const { submission_url } = req.body;

    //console.log(points);

    if (submission_url == undefined) {
      logger.warn("Submission URL is not provided.");
      return res
        .status(400)
        .send({ message: "Submission URL is not provided." });
    }

    if (!user) {
      logger.warn("User not found.");
      return res.status(404).send("User not found");
    }

    const currentDateTime = new Date();
    const assignmentDeadline = new Date(assignment.deadline);

    if (currentDateTime > assignmentDeadline) {
      logger.warn("Submission deadline has passed.");
      return res
        .status(400)
        .send({ message: "Submission deadline has passed." });
    }

    const maxAttempts = assignment.num_of_attempts;

    const submissionExists = await Submissions.count({
      where: {
        assignmentId,
        userId,
      },
    });

    if (submissionExists) {
      let submission = await db.submission.findOne({
        where: {
          assignmentId,
          userId,
        },
      });

      const existingSubmissionsCount = submission.attempts;

      if (existingSubmissionsCount >= maxAttempts) {
        logger.warn("Exceeded the maximum number of submission attempts.");
        return res.status(403).send({
          message: "Exceeded the maximum number of submission attempts.",
        });
      }

      // let submission_info = {
      //     submission_url: req.body.submission_url
      // };

      //const submission_url = req.body.submission_url;

      const updatedFields = {};
      if (submission_url !== undefined)
        updatedFields.submission_url = submission_url;

      updatedFields.submission_updated =
        db.sequelize.literal("CURRENT_TIMESTAMP");
      updatedFields.attempts = submission.attempts + 1;

      let result = await submission.update(updatedFields, {
        where: {
          assignmentId,
          userId,
        },
      });

      if (result[0] === 0) {
        logger.info(`Submission not found or not updated`);
        return res.status(404).send({ message: "Submission not found" });
      }

      let submissionNew = await db.submission.findOne({
        where: {
          assignmentId,
          userId,
        },
      });

      const snsParams = {
        TopicArn: snsTopicArn,
        Message: JSON.stringify({
          submission_url: submission.submission_url,
          user_email: user.email,
        }),
      };

      sns.publish(snsParams, (err, data) => {
        if (err) {
          console.error("Error publishing to SNS:", err);
        } else {
          console.log("Successfully published to SNS:", data);
        }
      });

      logger.info(`Submission updated successfully`);
      res.status(201).send(submissionNew);

      // const submission = await Submissions.create(submission_info);
      // logger.info(`Submission created successfully: ${submission.id}`);
      // res.status(201).send(submission);
    } else {
      let submissionInfo = {
        submission_url: submission_url,
        attempts: 1,
        userId: userId,
        assignmentId: assignmentId,
      };

      const submission = await Submissions.create(submissionInfo);

      const snsParams = {
        TopicArn: snsTopicArn,
        Message: JSON.stringify({
          submission_url: submission_url,
          user_email: user.email,
        }),
      };

      sns.publish(snsParams, (err, data) => {
        if (err) {
          console.error("Error publishing to SNS:", err);
        } else {
          console.log("Successfully published to SNS:", data);
        }
      });

      logger.info(`Submission created successfully: ${submission.id}`);
      res.status(201).send(submission);
    }
  } catch (error) {
    console.error(error);
    logger.error(
      `Error occurred while processing the ${req.method} request: ${error}`
    );
    res.status(500).send("Internal Server Error");
  }
};

// Health check for assignment
export const healthz = async (request, response) => {
  if (
    request.method !== "GET" ||
    request.headers["content-length"] > 0 ||
    Object.keys(request.query).length > 0
  ) {
    return response.status(400).send("");
  }

  try {
    // Increment custom metric for post API calls
    statsd.increment("api.healthz.calls");
    const health = await healthCheck();
    const status = health ? 200 : 503;

    // Log health check status
    if (health) {
      logger.info("Health check succeeded");
    } else {
      logger.error("Health check failed");
    }

    return response
      .status(status)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  } catch (error) {
    logger.error("Error during health check:", error);

    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }
};
