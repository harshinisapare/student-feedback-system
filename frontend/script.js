/**
 * =========================================================================
 * Student Feedback System - Frontend JavaScript
 * =========================================================================
 * 
 * Instructions:
 * 1. For local UI testing: You can test the form immediately.
 * 2. When deployed to AWS: Replace "YOUR_API_GATEWAY_URL" below with your
 *    actual API Gateway endpoint URL (e.g. https://xxxxxx.execute-api.us-east-1.amazonaws.com/feedback).
 * =========================================================================
 */

// >>>>> AWS API GATEWAY CONFIGURATION <<<<<
const API_URL = "https://94mkjknax2.execute-api.ap-southeast-1.amazonaws.com/feedback";

// DOM Elements
const form = document.getElementById("feedback-form");
const studentNameInput = document.getElementById("studentName");
const usnInput = document.getElementById("usn");
const subjectSelect = document.getElementById("subject");
const customSubjectGroup = document.getElementById("customSubjectGroup");
const customSubjectInput = document.getElementById("customSubject");
const teacherNameInput = document.getElementById("teacherName");
const ratingInput = document.getElementById("rating");
const ratingDesc = document.getElementById("ratingDesc");
const starButtons = document.querySelectorAll(".star-btn");
const feedbackTextarea = document.getElementById("feedback");
const charCounter = document.getElementById("charCounter");
const submitBtn = document.getElementById("submit-btn");
const submitText = document.getElementById("submit-text");
const submitSpinner = document.getElementById("submit-spinner");
const resetBtn = document.getElementById("reset-btn");

// Alert elements
const alertBox = document.getElementById("alert-box");
const alertIcon = document.getElementById("alert-icon");
const alertTitle = document.getElementById("alert-title");
const alertMessage = document.getElementById("alert-message");
const alertExtra = document.getElementById("alert-extra");
const alertCloseBtn = document.getElementById("alert-close-btn");

// Rating Descriptions
const ratingLabels = {
  1: "1 / 5 - Needs Improvement",
  2: "2 / 5 - Fair",
  3: "3 / 5 - Good",
  4: "4 / 5 - Very Good",
  5: "5 / 5 - Excellent"
};

// =========================================================================
// Star Rating Logic
// =========================================================================
starButtons.forEach((star) => {
  const value = parseInt(star.getAttribute("data-value"), 10);

  // Hover preview
  star.addEventListener("mouseenter", () => {
    highlightStars(value, "hover");
    ratingDesc.textContent = ratingLabels[value];
  });

  // Revert hover preview
  star.addEventListener("mouseleave", () => {
    removeHoverStars();
    const currentRating = parseInt(ratingInput.value, 10);
    if (currentRating > 0) {
      highlightStars(currentRating, "active");
      ratingDesc.textContent = ratingLabels[currentRating];
    } else {
      ratingDesc.textContent = "Select your score";
    }
  });

  // Click to set rating
  star.addEventListener("click", () => {
    ratingInput.value = value;
    highlightStars(value, "active");
    ratingDesc.textContent = ratingLabels[value];
    clearFieldError("rating");
  });
});

function highlightStars(count, className) {
  starButtons.forEach((star) => {
    const starVal = parseInt(star.getAttribute("data-value"), 10);
    if (starVal <= count) {
      star.classList.add(className);
    } else {
      star.classList.remove(className);
    }
  });
}

function removeHoverStars() {
  starButtons.forEach((star) => star.classList.remove("hover"));
}

function resetStars() {
  ratingInput.value = "0";
  starButtons.forEach((star) => {
    star.classList.remove("active", "hover");
  });
  ratingDesc.textContent = "Select your score";
}

// =========================================================================
// Dynamic "Other" Subject Selection
// =========================================================================
subjectSelect.addEventListener("change", () => {
  if (subjectSelect.value === "Other") {
    customSubjectGroup.style.display = "flex";
    customSubjectInput.setAttribute("required", "required");
    customSubjectInput.focus();
  } else {
    customSubjectGroup.style.display = "none";
    customSubjectInput.removeAttribute("required");
    customSubjectInput.value = "";
    clearFieldError("customSubject");
  }
  clearFieldError("subject");
});

// =========================================================================
// Real-time Character Counter
// =========================================================================
feedbackTextarea.addEventListener("input", () => {
  const len = feedbackTextarea.value.trim().length;
  charCounter.textContent = `${len} / 10 min chars`;
  if (len >= 10) {
    charCounter.style.color = "var(--success)";
    clearFieldError("feedback");
  } else {
    charCounter.style.color = "var(--text-muted)";
  }
});

// Auto-uppercase USN
usnInput.addEventListener("input", () => {
  usnInput.value = usnInput.value.toUpperCase();
  clearFieldError("usn");
});

// Clear field errors on typing
studentNameInput.addEventListener("input", () => clearFieldError("studentName"));
teacherNameInput.addEventListener("input", () => clearFieldError("teacherName"));
if (customSubjectInput) {
  customSubjectInput.addEventListener("input", () => clearFieldError("customSubject"));
}

// =========================================================================
// Form Validation Logic
// =========================================================================
function validateForm() {
  let isValid = true;

  // 1. Student Name
  const studentName = studentNameInput.value.trim();
  if (!studentName || studentName.length < 2) {
    setFieldError("studentName", "Please enter your full name (minimum 2 characters).");
    isValid = false;
  } else {
    clearFieldError("studentName");
  }

  // 2. USN
  const usn = usnInput.value.trim();
  if (!usn) {
    setFieldError("usn", "USN / Roll Number is required.");
    isValid = false;
  } else if (usn.length < 3) {
    setFieldError("usn", "Please enter a valid USN.");
    isValid = false;
  } else {
    clearFieldError("usn");
  }

  // 3. Subject
  const subject = subjectSelect.value;
  if (!subject) {
    setFieldError("subject", "Please select a subject from the list.");
    isValid = false;
  } else if (subject === "Other") {
    const customSub = customSubjectInput.value.trim();
    if (!customSub || customSub.length < 2) {
      setFieldError("customSubject", "Please enter the specific subject name.");
      isValid = false;
    } else {
      clearFieldError("customSubject");
    }
  } else {
    clearFieldError("subject");
  }

  // 4. Teacher Name
  const teacherName = teacherNameInput.value.trim();
  if (!teacherName || teacherName.length < 2) {
    setFieldError("teacherName", "Please enter the faculty/teacher name.");
    isValid = false;
  } else {
    clearFieldError("teacherName");
  }

  // 5. Rating (1 to 5)
  const rating = parseInt(ratingInput.value, 10);
  if (!rating || rating < 1 || rating > 5) {
    setFieldError("rating", "Please click on a star to provide a rating from 1 to 5.");
    isValid = false;
  } else {
    clearFieldError("rating");
  }

  // 6. Feedback
  const feedback = feedbackTextarea.value.trim();
  if (!feedback) {
    setFieldError("feedback", "Please provide feedback comments.");
    isValid = false;
  } else if (feedback.length < 10) {
    setFieldError("feedback", `Feedback is too short (${feedback.length}/10 characters minimum).`);
    isValid = false;
  } else {
    clearFieldError("feedback");
  }

  return isValid;
}

function setFieldError(fieldName, message) {
  const errorEl = document.getElementById(`${fieldName}Error`);
  const inputEl = document.getElementById(fieldName);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
  if (inputEl) {
    const group = inputEl.closest(".form-group");
    if (group) group.classList.add("has-error");
  }
}

function clearFieldError(fieldName) {
  const errorEl = document.getElementById(`${fieldName}Error`);
  const inputEl = document.getElementById(fieldName);
  if (errorEl) {
    errorEl.style.display = "none";
  }
  if (inputEl) {
    const group = inputEl.closest(".form-group");
    if (group) group.classList.remove("has-error");
  }
}

function clearAllErrors() {
  document.querySelectorAll(".error-text").forEach((el) => {
    el.style.display = "none";
  });
  document.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("has-error");
  });
}

// =========================================================================
// Alert Notifications
// =========================================================================
function showAlert(type, title, message, extra = null) {
  alertBox.className = `alert-box ${type}`;
  alertIcon.innerHTML =
    type === "success"
      ? "✅"
      : type === "warning"
      ? "⚠️"
      : "❌";
  alertTitle.textContent = title;
  alertMessage.textContent = message;

  if (extra) {
    alertExtra.textContent = extra;
    alertExtra.classList.remove("hidden");
  } else {
    alertExtra.classList.add("hidden");
  }

  alertBox.classList.remove("hidden");
  alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

alertCloseBtn.addEventListener("click", () => {
  alertBox.classList.add("hidden");
});

// =========================================================================
// Form Submission Handler
// =========================================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate form
  if (!validateForm()) {
    showAlert("error", "Validation Error", "Please fill in all required fields properly before submitting.");
    return;
  }

  // Construct payload
  const finalSubject =
    subjectSelect.value === "Other"
      ? customSubjectInput.value.trim()
      : subjectSelect.value;

  const payload = {
    studentName: studentNameInput.value.trim(),
    usn: usnInput.value.trim().toUpperCase(),
    subject: finalSubject,
    teacherName: teacherNameInput.value.trim(),
    rating: parseInt(ratingInput.value, 10),
    feedback: feedbackTextarea.value.trim()
  };

  // Check if API_URL has been configured
  if (API_URL === "YOUR_API_GATEWAY_URL" || !API_URL.startsWith("http")) {
    setLoading(true);
    // Simulate network delay for testing
    setTimeout(() => {
      setLoading(false);
      showAlert(
        "warning",
        "Form Validated (Demo Mode)",
        "API Gateway URL is currently set to placeholder 'YOUR_API_GATEWAY_URL'. Configure it in script.js after deploying your AWS backend.",
        `Payload ready for AWS:\n${JSON.stringify(payload, null, 2)}`
      );
    }, 600);
    return;
  }

  // Send request to AWS API Gateway
  setLoading(true);
  alertBox.classList.add("hidden");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      showAlert(
        "success",
        "Feedback Submitted Successfully!",
        "Thank you! Your feedback has been stored securely in AWS DynamoDB.",
        `Reference ID: ${result.id || "N/A"} | Timestamp: ${result.timestamp || new Date().toISOString()}`
      );
      // Reset form on success
      form.reset();
      resetStars();
      customSubjectGroup.style.display = "none";
      charCounter.textContent = "0 / 10 min chars";
      charCounter.style.color = "var(--text-muted)";
    } else {
      const errMsg = result.message || result.error || "Server rejected submission.";
      showAlert("error", "Submission Failed", errMsg, `HTTP Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Submission error:", error);
    showAlert(
      "error",
      "Network / CORS Error",
      "Could not reach AWS API Gateway. Make sure CORS is enabled in API Gateway and the URL is reachable.",
      error.message
    );
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    submitSpinner.classList.remove("hidden");
    submitText.textContent = "Submitting...";
  } else {
    submitBtn.disabled = false;
    submitSpinner.classList.add("hidden");
    submitText.textContent = "Submit Feedback";
  }
}

// =========================================================================
// Reset Button Handler
// =========================================================================
resetBtn.addEventListener("click", () => {
  clearAllErrors();
  resetStars();
  customSubjectGroup.style.display = "none";
  charCounter.textContent = "0 / 10 min chars";
  charCounter.style.color = "var(--text-muted)";
  alertBox.classList.add("hidden");
});
