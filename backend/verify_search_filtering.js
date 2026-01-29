const axios = require('axios');

async function testSearch(email, description) {
    try {
        console.log(`\n--- Testing Search for: ${description} (${email}) ---`);
        const response = await axios.post('http://localhost:8080/api/v1/search', {
            query: 'marketing', // generic query
            pageSize: 5
        }, {
            headers: {
                'x-user-email': email,
                'Authorization': 'Bearer test-token' // Mock token
            }
        });

        console.log(`Status: ${response.status}`);
        console.log(`Results Found: ${response.data.results.length}`);
        console.log(`Total Size (Unfiltered): ${response.data.totalSize}`);

        if (response.data.results.length > 0) {
            console.log('Sample Result:', response.data.results[0].fullyQualifiedName);
        }

    } catch (error) {
        if (error.response) {
            console.log(`Error Status: ${error.response.status}`);
            console.log(`Error Data:`, error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

async function runVerification() {
    // 1. Test with a random email (Should likely retrieve 0 results if they have no access)
    await testSearch('random-no-access-user@example.com', 'Unauthorized User');

    // 2. Test with a potentially valid user (e.g., from env or hardcoded known user)
    // We try to grab one from env if possible, or just use a common test one
    const validUser = process.env.VITE_ADMIN_EMAIL || 'josep.sancho.bertomeu@gmail.com';
    // Assuming this user has access
    await testSearch(validUser, 'Authorized User');
}

runVerification();
