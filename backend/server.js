const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:56052'}));

app.get('/generate-token', async (req, res) => {
    const auth = new GoogleAuth({
        keyFile: 'C:/Users/YADAVJA/Downloads/hardy-album-437408-b2-6bb943707858.json',
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    res.json({ token: accessToken });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
