// Wait for document to load
document.addEventListener('DOMContentLoaded', () => {
  // 1. POPULATE DEPARTMENTS IN SIGNUP FORM
  const deptSelect = document.getElementById('register-department');
  if (deptSelect) {
    // Standard mock departments dropdown setup
    const departments = [
      'Computer Science & Engineering',
      'Electronics & Communication',
      'Mechanical Engineering',
      'Business Administration',
      'Sports & Athletics Division'
    ];
    deptSelect.innerHTML = '<option value="" selected disabled>Select Department</option>';
    departments.forEach(dept => {
      deptSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
    });
  }

  // 2. LOGIN FORM SUBMISSION
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
          setToken(data.token);
          setCurrentUser(data.user);
          showToast('Login successful!');

          // Redirect to appropriate dashboard
          setTimeout(() => {
            if (data.user.role === 'Admin' || data.user.role === 'Super Admin') {
              window.location.href = '/dashboards/admin.html';
            } else if (data.user.role === 'Faculty Coordinator') {
              window.location.href = '/dashboards/faculty.html';
            } else {
              window.location.href = '/dashboards/student.html';
            }
          }, 1000);
        } else {
          if (data.unverified) {
            showAlert('Verification Required', data.message, 'warning').then(() => {
              window.location.href = `/verify.html?email=${encodeURIComponent(email)}`;
            });
          } else {
            showAlert('Login Failed', data.message, 'error');
          }
        }
      } catch (err) {
        console.error(err);
        showAlert('Error', 'Something went wrong. Please check connection.', 'error');
      }
    });
  }

  // 3. REGISTRATION FORM SUBMISSION
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;
      const departmentName = document.getElementById('register-department').value;
      const interests = document.getElementById('register-interests').value;
      const skills = document.getElementById('register-skills').value;

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role, departmentName, interests, skills })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('OTP Sent', data.message, 'success').then(() => {
            window.location.href = `/verify.html?email=${encodeURIComponent(email)}`;
          });
        } else {
          showAlert('Registration Failed', data.message, 'error');
        }
      } catch (err) {
        console.error(err);
        showAlert('Error', 'Registration request failed.', 'error');
      }
    });
  }

  // 4. OTP VERIFICATION FORM
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  const verifyEmailInput = document.getElementById('verify-email');
  if (verifyEmailInput && emailParam) {
    verifyEmailInput.value = emailParam;
  }

  const verifyForm = document.getElementById('verify-form');
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('verify-email').value;
      const otp = document.getElementById('verify-otp').value;

      try {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('Verified!', data.message, 'success').then(() => {
            window.location.href = '/login.html';
          });
        } else {
          showAlert('Verification Failed', data.message, 'error');
        }
      } catch (err) {
        console.error(err);
        showAlert('Error', 'OTP verification failed.', 'error');
      }
    });
  }

  // 5. FORGOT PASSWORD FORM
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;

      try {
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('OTP Sent', data.message, 'success').then(() => {
            window.location.href = `/reset-password.html?email=${encodeURIComponent(email)}`;
          });
        } else {
          showAlert('Error', data.message, 'error');
        }
      } catch (err) {
        console.error(err);
        showAlert('Error', 'Forgot password request failed.', 'error');
      }
    });
  }

  // 6. RESET PASSWORD FORM
  const resetEmailInput = document.getElementById('reset-email');
  if (resetEmailInput && emailParam) {
    resetEmailInput.value = emailParam;
  }

  const resetForm = document.getElementById('reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value;
      const otp = document.getElementById('reset-otp').value;
      const newPassword = document.getElementById('reset-new-password').value;

      try {
        const res = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('Reset Success', data.message, 'success').then(() => {
            window.location.href = '/login.html';
          });
        } else {
          showAlert('Reset Failed', data.message, 'error');
        }
      } catch (err) {
        console.error(err);
        showAlert('Error', 'Password reset failed.', 'error');
      }
    });
  }
});
