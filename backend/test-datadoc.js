const { GoogleAuth } = require('google-auth-library');

async function main() {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    const location = 'eu'; // we assume eu, depending on project
    const url = `https://dataplex.googleapis.com/v1/projects/${projectId}/locations/${location}/dataScans?dataScanId=test-datadoc-scan-1`;
    try {
        const res = await client.request({
            url,
            method: 'POST',
            data: {
                data: {
                    resource: `//bigquery.googleapis.com/projects/${projectId}/datasets/bank/tables/customer`
                },
                executionSpec: {
                    trigger: { onDemand: {} }
                },
                dataDocumentationSpec: {} // empty just to test type
            }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.log(JSON.stringify(err.response.data, null, 2));
        } else {
            console.log(err.message);
        }
    }
}
main();
