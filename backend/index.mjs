/**
 * =========================================================================
 * AWS Lambda Function: Student Feedback System
 * File: index.mjs (ES Module for Node.js 20.x)
 * =========================================================================
 * 
 * DIRECT DEPLOYMENT INSTRUCTIONS:
 * 1. Open the AWS Lambda Console -> your function (Node.js 20.x).
 * 2. In the "Code" tab, select "index.mjs" (the default file created by AWS).
 * 3. Replace all code in index.mjs with this entire file.
 * 4. Click the orange "Deploy" button.
 * 
 * Note: @aws-sdk/client-dynamodb and @aws-sdk/lib-dynamodb are pre-installed
 * in the AWS Lambda Node.js 20.x runtime. NO npm install or zip upload required!
 * =========================================================================
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

// Initialize DynamoDB Client & Document Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Environment variable for DynamoDB table (defaults to "StudentFeedback")
const TABLE_NAME = process.env.TABLE_NAME || "StudentFeedback";

// Standard CORS Headers for all responses
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
  "Content-Type": "application/json"
};

/**
 * Main Lambda Handler
 * Supports both API Gateway HTTP API (v2) and REST API (v1) formats.
 */
export const handler = async (event) => {
  console.log("Incoming event:", JSON.stringify(event, null, 2));

  // Determine HTTP Method
  const httpMethod =
    event.httpMethod ||
    (event.requestContext && event.requestContext.http && event.requestContext.http.method);

  // 1. Handle CORS Preflight (OPTIONS request)
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "CORS preflight check successful" })
    };
  }

  // 2. Reject unsupported HTTP methods
  if (httpMethod && httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Method ${httpMethod} not allowed. Please use POST.` })
    };
  }

  try {
    // 3. Parse JSON request body
    let body;
    if (typeof event.body === "string") {
      try {
        const decoded = event.isBase64Encoded
          ? Buffer.from(event.body, "base64").toString("utf-8")
          : event.body;
        body = JSON.parse(decoded);
      } catch (parseErr) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "Invalid JSON format in request body." })
        };
      }
    } else if (typeof event.body === "object" && event.body !== null) {
      body = event.body;
    } else {
      body = event; // Direct invocation test payload
    }

    const { studentName, usn, subject, teacherName, rating, feedback } = body || {};

    // 4. Validate all required fields
    const validationErrors = [];

    if (!studentName || typeof studentName !== "string" || studentName.trim().length < 2) {
      validationErrors.push("studentName must be at least 2 characters.");
    }

    if (!usn || typeof usn !== "string" || usn.trim().length < 2) {
      validationErrors.push("usn is required and must not be empty.");
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 2) {
      validationErrors.push("subject is required.");
    }

    if (!teacherName || typeof teacherName !== "string" || teacherName.trim().length < 2) {
      validationErrors.push("teacherName is required.");
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      validationErrors.push("rating must be an integer between 1 and 5.");
    }

    if (!feedback || typeof feedback !== "string" || feedback.trim().length < 10) {
      validationErrors.push("feedback must be at least 10 characters long.");
    }

    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Validation failed",
          details: validationErrors
        })
      };
    }

    // 5. Generate unique ID & submission timestamp
    const feedbackId = randomUUID();
    const timestamp = new Date().toISOString();

    const feedbackItem = {
      id: feedbackId,
      studentName: studentName.trim(),
      usn: usn.trim().toUpperCase(),
      subject: subject.trim(),
      teacherName: teacherName.trim(),
      rating: numericRating,
      feedback: feedback.trim(),
      timestamp: timestamp
    };

    // 6. Write to DynamoDB
    const putParams = {
      TableName: TABLE_NAME,
      Item: feedbackItem
    };

    console.log(`Saving feedback item to table '${TABLE_NAME}' with ID: ${feedbackId}`);
    await docClient.send(new PutCommand(putParams));
    console.log("Feedback saved successfully to DynamoDB.");

    // 7. Return 201 Created Response
    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: "Feedback submitted successfully!",
        id: feedbackId,
        timestamp: timestamp
      })
    };
  } catch (err) {
    console.error("Error storing feedback in DynamoDB:", err);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Failed to save feedback to DynamoDB.",
        message: err.message || "Internal server error"
      })
    };
  }
};
