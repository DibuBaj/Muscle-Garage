require('dotenv').config();

console.log('Environment Variables:');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✓' : '✗');
console.log('PORT:', process.env.PORT);
console.log('EMAIL_ADMIN:', process.env.EMAIL_ADMIN);
console.log('ADMIN_PASS:', process.env.ADMIN_PASS);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓' : '✗');

const axios = require('axios');

// Wait a moment then test
setTimeout(() => {
  axios.get('http://localhost:5000/')
    .then(res => {
      console.log('\nServer is running!');
      console.log('Response:', res.data);
      
      // Try admin login
      return axios.post('http://localhost:5000/api/auth/admin-login', {
        email: process.env.EMAIL_ADMIN,
        password: process.env.ADMIN_PASS
      });
    })
    .then(res => {
      console.log('Login response:', res.data);
    })
    .catch(err => {
      console.log('Error:', err.message);
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Data:', err.response.data);
      }
    });
}, 2000);
