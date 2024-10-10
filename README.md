- Navigate to frontend directory
```bash
cd .\frontend\
npm start
```

- In another terminal navigate to backend directory
```bash
cd .\backend\
node server.js
```

In the server.js please make the following changes:
1.  `app.use(cors({ origin: 'http://localhost:56052'}));` change the port number on which your angular application is running.
2. ```bash
       const auth = new GoogleAuth({
        keyFile: 'C:/Users/YADAVJA/Downloads/hardy-album-437408-b2-6bb943707858.json',
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
     });
   ```
Change the route of the keyfile.
