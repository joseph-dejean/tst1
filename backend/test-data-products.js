const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

async function test() {
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const projectId = 'aeyelytics'; // Replace if needed

    try {
        const res = await axios.get(`https://dataplex.googleapis.com/v1/projects/${projectId}/locations/-/dataProducts`, {
            headers: {
                Authorization: `Bearer ${token.token}`
            }
        });
        console.log("Data Products:", JSON.stringify(res.data, null, 2));

        if (res.data && res.data.dataProducts && res.data.dataProducts.length > 0) {
            const dp = res.data.dataProducts[0].name;
            const res2 = await axios.get(`https://dataplex.googleapis.com/v1/${dp}/dataAssets`, {
                headers: {
                    Authorization: `Bearer ${token.token}`
                }
            });
            console.log("\nData Assets for first product:", JSON.stringify(res2.data, null, 2));
        }
    } catch (e) {
        console.log("Error:", e.response ? e.response.data : e.message);
    }
}

test();
