const axios = require('axios');

const testAdminLogin = async () => {
  try {
    console.log('Testing admin login...');
    const response = await axios.post('http://localhost:5000/api/auth/admin-login', {
      email: 'musclegarage0@gmail.com',
      password: 'MuscleGarageAdmin123'
    });
    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
};

testAdminLogin();
