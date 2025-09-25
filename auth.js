 document.addEventListener('DOMContentLoaded', function() {
    // Initialize Google Auth
    google.accounts.id.initialize({
        client_id: '49790761791-ifon1ncmkvil2u5umq1mvsie2hu6p16i.apps.googleusercontent.com',
        callback: handleCredentialResponse,
        ux_mode: 'popup',
        auto_select: false
    });

    // Render Google Button (using our custom button)
    document.getElementById('gSignIn').addEventListener('click', function() {
        google.accounts.id.prompt(notification => {
            if (notification.isNotDisplayed() || notification.isSkipped()) {
                // Fallback if Google One Tap isn't displayed
                google.accounts.id.renderButton(
                    document.getElementById('gSignIn'),
                    { 
                        theme: 'outline', 
                        size: 'large',
                        width: document.getElementById('gSignIn').offsetWidth
                    }
                );
            }
        });
    });

    // Email form submission
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
      const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        handleEmailSignUpAuth(name, email, password);
    });

     document.getElementById('signinForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        handleEmailSignInAuth(email, password);
    });

});


function handleCredentialResponse(response) {
    const responsePayload = parseJwt(response.credential);
    
    const user = {
        name: responsePayload.name,
        email: responsePayload.email,
        picture: responsePayload.picture,
        verified: responsePayload.email_verified,
        provider: 'google'
    };

    authenticateUser(user);
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

function authenticateUser(user) {
    const btn = document.querySelector('.google-btn');
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    btn.style.pointerEvents = 'none';

    // Simulate API call (replace with actual fetch)
    setTimeout( async () => {
        console.log('Authenticating user:', user);
          
        // Redirect to dashboard or handle response
        window.location.href = 'dashboard.html';
    }, 1500);
}

async function handleEmailSignUpAuth(name, email, password) {


    // Password Toggle
    const togglePassword = document.getElementById('togglePassword');

    togglePassword.addEventListener('click', () => {
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);
      togglePassword.classList.toggle('fa-eye-slash');
    });

      let isValid = true;

      // Name validation
      if (!document.getElementById('name').value.trim()) {
        document.getElementById('nameError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('nameError').style.display = 'none';
      }

      // Email validation
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('emailError').style.display = 'none';
      }

      // Password validation
      if (document.getElementById('password').value.length < 8) {
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('passwordError').style.display = 'none';
      }

      // Terms checkbox
      if (!document.getElementById('terms').checked) {
        document.getElementById('termsError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('termsError').style.display = 'none';
      }

      if (isValid) {

        console.log('Email authentication:', email);
        
        try {
          
                    const response = await fetch('http://localhost:3000/register/signup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name, email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        document.getElementById('message').textContent = 'Registration successful!';
                      
                        window.location.href="dashboard.html";
                    } else {
                        document.getElementById('message').textContent = data.message || 'Registration failed';
                    }
                } catch (error) {
                    console.error('Error:', error);
                    document.getElementById('message').textContent = 'An error occurred during registration';
                } finally {
                    // Reset loading state
                }
        btn.innerHTML = originalText;
        btn.disabled = false;
 }
}



async function handleEmailSignInAuth(email, password) {

    // Password Toggle (Same as signup.html)
    const togglePassword = document.getElementById('togglePassword');

    togglePassword.addEventListener('click', () => {
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);
      togglePassword.classList.toggle('fa-eye-slash');
    });

    // Form Submission
     try {
      
                    const response = await fetch('http://localhost:3000/register/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        document.getElementById('message').textContent = 'Login successful!';
                       
                        window.location.href="dashboard.html";
                    } else {
                        document.getElementById('message').textContent = 'Login failed';
                    }
                } catch (error) {
                    console.error('Error:', error);
                    document.getElementById('message').textContent = 'An error occurred during login';
                } 
    
}
