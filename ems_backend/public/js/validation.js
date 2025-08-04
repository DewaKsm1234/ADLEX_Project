// validation.js

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');

  // Get references to all input fields and their error message elements
  const inputs = {
      username: {
          element: document.getElementById('usernameInput'),
          errorElement: document.getElementById('usernameInput-error'),
          maxLength: 15, // Maximum  characters
          regex: /^[a-zA-Z0-9_]*$/, // Only alphanumeric and underscore, NO spaces
          invalidCharMsg: 'Only letters, numbers, and underscore allowed. No spaces.',
          requiredMsg: 'Username is required.',
          lengthMsg: 'Username must be 3-15 characters long.'
      },
      password: {
          element: document.getElementById('passwordInput'),
          errorElement: document.getElementById('passwordInput-error'),
          maxLength: 16, // Maximum 16 characters
          regex: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, // Allow common password characters
          invalidCharMsg: 'Only letters, numbers, and special characters allowed.',
          requiredMsg: 'Password is required.',
          lengthMsg: 'Password must be 8-16 characters long.',
          formatMsg: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.'
      },
      address: {
          element: document.getElementById('addressInput'),
          errorElement: document.getElementById('addressInput-error'),
          maxLength: 50, // Matches HTML maxlength
          regex: /^[a-zA-Z0-9\s.,#-]*$/, // Allows alphanumeric, space, dot, comma, hash, hyphen
          invalidCharMsg: 'Only alphanumeric, spaces, periods, commas, #, - allowed.',
          requiredMsg: 'Address is required.'
      },
      firstName: {
          element: document.getElementById('firstNameInput'),
          errorElement: document.getElementById('firstNameInput-error'),
          maxLength: 15, // Matches HTML maxlength
          regex: /^[a-zA-Z]*$/, // Only letters, NO spaces
          invalidCharMsg: 'Only letters allowed.',
          requiredMsg: 'First Name is required.'
      },
      lastName: {
          element: document.getElementById('lastNameInput'),
          errorElement: document.getElementById('lastNameInput-error'),
          maxLength: 15, // Matches HTML maxlength
          regex: /^[a-zA-Z]*$/, // Only letters, NO spaces
          invalidCharMsg: 'Only letters allowed.',
          requiredMsg: 'Last Name is required.'
      },
      email: {
          element: document.getElementById('emailInput'),
          errorElement: document.getElementById('emailInput-error'),
          maxLength: 50, // Matches HTML maxlength
          // For keypress/input: allow all valid email characters
          regex: /^[a-zA-Z0-9._%+-@]*$/,
          invalidCharMsg: 'Please enter a valid email format.',
          requiredMsg: 'Email ID is required.'
      },
      phoneNumber: {
          element: document.getElementById('phoneNumberInput'),
          errorElement: document.getElementById('phoneNumberInput-error'),
          maxLength: 10, // Matches HTML maxlength
          regex: /^\d*$/, // Only digits
          invalidCharMsg: 'Only numbers (0-9) allowed.',
          requiredMsg: 'Mobile Number is required.',
          lengthMsg: 'Please enter a 10-digit mobile number.'
      }
  };

  // Track if user has submitted the form
  let formSubmitted = false;

  // --- Helper Functions for Validation Messages ---
  function showValidationMessage(inputData, message) {
      if (inputData.errorElement) {
          inputData.errorElement.textContent = message;
          inputData.errorElement.style.color = 'red';
          inputData.errorElement.style.display = 'block';
      }
      if (inputData.element) {
          inputData.element.style.border = '1px solid red'; // Visual cue without a class
      }
  }

  function clearValidationMessage(inputData) {
      if (inputData.errorElement) {
          inputData.errorElement.textContent = '';
          inputData.errorElement.style.display = 'none';
      }
      if (inputData.element) {
          inputData.element.style.border = ''; // Reset border
      }
  }

  // --- Validation Logic for Each Field Type ---

  // Generic keypress handler to prevent invalid characters and enforce length
  function handleGenericKeypress(e, inputData) {
      const char = String.fromCharCode(e.which);
      const currentValue = e.target.value;

      // Allow common control keys (Backspace, Delete, Arrow keys, Tab)
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || 
          e.key === 'ArrowRight' || e.key === 'Tab') {
          return; // Allow these keys
      }

      // Prevent space key for name fields and username
      if ((inputData === inputs.firstName || inputData === inputs.lastName || inputData === inputs.username) && e.key === ' ') {
          e.preventDefault();
          showValidationMessage(inputData, 'No spaces allowed');
          return;
      }

      // 1. Enforce max length on keypress
      if (currentValue.length >= inputData.maxLength) {
          e.preventDefault();
          showValidationMessage(inputData, `Maximum ${inputData.maxLength} characters allowed.`);
          return;
      }

      // 2. Prevent invalid characters using the regex for this field
      // Test the current value PLUS the new character
      if (!inputData.regex.test(currentValue + char)) {
          e.preventDefault();
          showValidationMessage(inputData, inputData.invalidCharMsg);
      } else {
          // Clear message if the character is valid and length is not exceeded
          clearValidationMessage(inputData);
      }
  }

  // Generic blur handler for final checks (e.g., length, full regex)
  function handleGenericBlur(inputData) {
      const value = inputData.element.value.trim();

      // Only show required error if form has been submitted AND field is empty
      if (inputData.element.hasAttribute('required') && value.length === 0 && formSubmitted) {
          showValidationMessage(inputData, inputData.requiredMsg);
          return false;
      }

      // Clear required error if value is entered
      if (value.length > 0) {
          clearValidationMessage(inputData);
      }

      // 2. Check general regex for characters (if not caught by keypress or if pasted)
      // Only show invalid char message if the field is not empty
      if (value.length > 0 && inputData.regex && !inputData.regex.test(value)) {
          showValidationMessage(inputData, inputData.invalidCharMsg);
          return false;
      }

      // 3. Specific length checks
      if (inputData === inputs.phoneNumber && value.length > 0 && value.length !== inputData.maxLength) {
          showValidationMessage(inputData, inputData.lengthMsg);
          return false;
      }

    //   // Username length check (3-20 characters)
    //   if (inputData === inputs.username && value.length > 0 && (value.length < 3 || value.length > 15)) {
    //       showValidationMessage(inputData, inputData.lengthMsg);
    //       return false;
    //   }

    //   // Password length check (8-16 characters)
    //   if (inputData === inputs.password && value.length > 0 && (value.length < 8 || value.length > 16)) {
    //       showValidationMessage(inputData, inputData.lengthMsg);
    //       return false;
    //   }

      // Password format validation (at least 1 uppercase, 1 lowercase, 1 number, 1 special character)
      if (inputData === inputs.password && value.length > 0) {
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
          
          if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
              showValidationMessage(inputData, inputData.formatMsg);
              return false;
          }
      }

      // On blur or submit, check full email format:
      if (inputData === inputs.email && value.length > 0 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          showValidationMessage(inputData, inputData.invalidCharMsg);
          return false;
      }

      clearValidationMessage(inputData); // Clear any other messages if valid
      return true; // Field is valid
  }

  // --- Attach Event Listeners to Each Input ---
  for (const key in inputs) {
      const inputData = inputs[key];
      if (inputData.element) {
          // Keypress for character restriction and immediate max length feedback
          inputData.element.addEventListener('keypress', (e) => handleGenericKeypress(e, inputData));

          // Input event for clearing character-specific error as user types valid input
          inputData.element.addEventListener('input', () => {
              // If the input becomes valid again during typing (e.g., deleted an invalid char)
              // or if it was showing a max length error and user deleted chars
              if (inputData.regex.test(inputData.element.value) && inputData.element.value.length < inputData.maxLength) {
                  clearValidationMessage(inputData);
              }
              
              // Special handling for password field - clear format error as user types
              if (inputData === inputs.password && inputData.element.value.length > 0) {
                  const value = inputData.element.value;
                  const hasUpperCase = /[A-Z]/.test(value);
                  const hasLowerCase = /[a-z]/.test(value);
                  const hasNumbers = /\d/.test(value);
                  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
                  
                  if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar) {
                      clearValidationMessage(inputData);
                  }
              }
          });

          // Blur event for final validation check when focus leaves
          inputData.element.addEventListener('blur', () => handleGenericBlur(inputData));
      }
  }


  // --- Form Submission Validation ---
  if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
          let isFormValid = true;
          formSubmitted = true; // Mark that form has been submitted

          // Run blur validation for all fields on submit
          for (const key in inputs) {
              const inputData = inputs[key];
              if (inputData.element) {
                  // if handleGenericBlur returns false, it means validation failed for that field
                  if (!handleGenericBlur(inputData)) {
                      isFormValid = false; // Mark form as invalid
                  }
              }
          }

          if (!isFormValid) {
              e.preventDefault(); // Stop form submission
              // No alert here, as the inline messages are now the primary feedback
              // alert('Please correct the highlighted errors before submitting.');
              // Optionally, scroll to the first invalid field or highlight it more
          }
          // If isFormValid is true, the form will submit normally
      });
  }


  // --- Existing Functionalities (from your previous code) ---

  // Device and Supervisor dropdowns
  const deviceDropdown = document.getElementById('deviceDropdown');
  const supervisorDropdown = document.getElementById('supervisorDropdown');
  const elevatorNumberInput = document.getElementById('elevatorNumber');
  const serialNumberInput = document.getElementById('serialNumber');
  const macAddressInput = document.getElementById('macAddress');
  const locationInput = document.getElementById('location');
  const deviceDetailsRow1 = document.getElementById('deviceDetailsRow1');
  const deviceDetailsRow2 = document.getElementById('deviceDetailsRow2');

  if (deviceDropdown) {
      deviceDropdown.addEventListener('change', () => {
          if (deviceDropdown.value) {
              deviceDetailsRow1.style.display = 'flex';
              deviceDetailsRow2.style.display = 'flex';
              // You would populate these fields from data based on deviceDropdown.value
              // For now, let's just put dummy data to show they become active
              if (elevatorNumberInput) elevatorNumberInput.value = 'ELEV-123';
              if (serialNumberInput) serialNumberInput.value = 'SN-XYZ-789';
              if (macAddressInput) macAddressInput.value = '00:1A:2B:3C:4D:5E';
              if (locationInput) locationInput.value = 'Building A, Floor 5';
          } else {
              deviceDetailsRow1.style.display = 'none';
              deviceDetailsRow2.style.display = 'none';
              if (elevatorNumberInput) elevatorNumberInput.value = '';
              if (serialNumberInput) serialNumberInput.value = '';
              if (macAddressInput) macAddressInput.value = '';
              if (locationInput) locationInput.value = '';
          }
      });
  }

  // Cancel Button functionality
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
          registerForm.reset(); // Resets all form fields
          formSubmitted = false; // Reset form submission flag
          
          if (deviceDetailsRow1) deviceDetailsRow1.style.display = 'none';
          if (deviceDetailsRow2) deviceDetailsRow2.style.display = 'none';

          // Clear all validation messages and styles on reset
          for (const key in inputs) {
              const inputData = inputs[key];
              clearValidationMessage(inputData);
          }
          
          // Reset dropdowns explicitly if they don't reset with form.reset()
          if (deviceDropdown) deviceDropdown.value = '';
          if (supervisorDropdown) supervisorDropdown.value = '';
      });
  }
});