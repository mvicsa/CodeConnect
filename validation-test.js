// Validation Test Script
// Run this in browser console to test validation functions

// Test cases for registration validation
const testCases = {
  firstName: [
    { input: " John", expected: "First name cannot have leading or trailing spaces" },
    { input: "John ", expected: "First name cannot have leading or trailing spaces" },
    { input: "   ", expected: "First name is required" },
    { input: "A", expected: "First name must be at least 2 characters long" },
    { input: "John1", expected: "First name cannot contain numbers" },
    { input: "John#", expected: "First name can only contain letters, spaces, hyphens, and apostrophes" },
    { input: "###", expected: "First name cannot be only special characters" },
    { input: "12345", expected: "First name cannot contain numbers" },
    { input: "John", expected: null }, // Valid case
    { input: "Mary-Jane", expected: null }, // Valid case
    { input: "O'Connor", expected: null }, // Valid case
  ],
  
  lastName: [
    { input: " Smith", expected: "Last name cannot have leading or trailing spaces" },
    { input: "Smith ", expected: "Last name cannot have leading or trailing spaces" },
    { input: "   ", expected: "Last name is required" },
    { input: "A", expected: "Last name must be at least 2 characters long" },
    { input: "Smith2", expected: "Last name cannot contain numbers" },
    { input: "Smith#", expected: "Last name can only contain letters, spaces, hyphens, and apostrophes" },
    { input: "###", expected: "Last name cannot be only special characters" },
    { input: "12345", expected: "Last name cannot contain numbers" },
    { input: "Smith", expected: null }, // Valid case
  ],
  
  username: [
    { input: "user name", expected: "Username cannot contain spaces" },
    { input: " ", expected: "Username is required" },
    { input: "7", expected: "Username cannot be a single number" },
    { input: "123456", expected: "Username cannot be only numbers" },
    { input: "عبدالهادي", expected: "Username cannot contain Arabic characters" },
    { input: "user*name", expected: "Username can only contain letters, numbers, underscores, and hyphens" },
    { input: "@#$%", expected: "Username cannot be only special characters" },
    { input: "ab", expected: "Username must be at least 3 characters long" },
    { input: "john_doe", expected: null }, // Valid case
    { input: "user123", expected: null }, // Valid case
    { input: "test-user", expected: null }, // Valid case
  ],
  
  email: [
    { input: "mailto:mail@domain.com", expected: "Please enter a valid email address" },
    { input: "invalid-email", expected: "Please enter a valid email address" },
    { input: "test@test", expected: "Please enter a valid email address" },
    { input: "test@example.com", expected: null }, // Valid case
  ],
  
  password: [
    { input: "   ", expected: "Password cannot be only spaces" },
    { input: "123", expected: "Password must be at least 6 characters long" },
    { input: "password123", expected: null }, // Valid case
  ]
};

// Validation functions (copy from your components)
const validateName = (value, fieldName) => {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }
  
  if (value !== value.trim()) {
    return `${fieldName} cannot have leading or trailing spaces`;
  }
  
  if (value.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  
  if (value.length > 50) {
    return `${fieldName} cannot exceed 50 characters`;
  }
  
  if (/\d/.test(value)) {
    return `${fieldName} cannot contain numbers`;
  }
  
  if (!/^[a-zA-Z\s\-']+$/.test(value)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  
  if (/^[^a-zA-Z]+$/.test(value)) {
    return `${fieldName} cannot be only special characters`;
  }
  
  return null;
};

const validateLastName = (value) => {
  if (!value.trim()) {
    return 'Last name is required';
  }
  
  if (value !== value.trim()) {
    return 'Last name cannot have leading or trailing spaces';
  }
  
  if (value.trim().length < 2) {
    return 'Last name must be at least 2 characters long';
  }
  
  if (value.length > 150) {
    return 'Last name cannot exceed 150 characters';
  }
  
  if (/\d/.test(value)) {
    return 'Last name cannot contain numbers';
  }
  
  if (!/^[a-zA-Z\s\-']+$/.test(value)) {
    return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
  }
  
  if (/^[^a-zA-Z]+$/.test(value)) {
    return 'Last name cannot be only special characters';
  }
  
  return null;
};

const validateUsername = (value) => {
  if (!value.trim()) {
    return 'Username is required';
  }
  
  if (value !== value.trim()) {
    return 'Username cannot have leading or trailing spaces';
  }
  
  if (value.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }
  
  if (value.length > 30) {
    return 'Username cannot exceed 30 characters';
  }
  
  if (/\s/.test(value)) {
    return 'Username cannot contain spaces';
  }
  
  if (value.length === 1 && /^\d$/.test(value)) {
    return 'Username cannot be a single number';
  }
  
  if (/^\d+$/.test(value)) {
    return 'Username cannot be only numbers';
  }
  
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(value)) {
    return 'Username cannot contain Arabic characters';
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }
  
  if (/^[^a-zA-Z0-9]+$/.test(value)) {
    return 'Username cannot be only special characters';
  }
  
  return null;
};

const validateEmail = (value) => {
  if (!value.trim()) {
    return 'Email is required';
  }
  
  if (value.toLowerCase().startsWith('mailto:')) {
    return 'Please enter a valid email address';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

const validatePassword = (value) => {
  if (!value.trim()) {
    return 'Password is required';
  }
  
  if (value.trim().length === 0) {
    return 'Password cannot be only spaces';
  }
  
  if (value.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  
  if (value.length > 20) {
    return 'Password cannot exceed 20 characters';
  }
  
  return null;
};

// Run tests
function runTests() {
  console.log('🧪 Starting Validation Tests...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  Object.keys(testCases).forEach(field => {
    console.log(`\n📝 Testing ${field} validation:`);
    
    testCases[field].forEach((testCase, index) => {
      totalTests++;
      
      let result;
      switch(field) {
        case 'firstName':
          result = validateName(testCase.input, 'First name');
          break;
        case 'lastName':
          result = validateLastName(testCase.input);
          break;
        case 'username':
          result = validateUsername(testCase.input);
          break;
        case 'email':
          result = validateEmail(testCase.input);
          break;
        case 'password':
          result = validatePassword(testCase.input);
          break;
      }
      
      const passed = result === testCase.expected;
      if (passed) {
        passedTests++;
        console.log(`✅ Test ${index + 1}: "${testCase.input}" - PASSED`);
      } else {
        console.log(`❌ Test ${index + 1}: "${testCase.input}" - FAILED`);
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Got: ${result}`);
      }
    });
  });
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Validation is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the validation logic.');
  }
}

// Run the tests
runTests(); 