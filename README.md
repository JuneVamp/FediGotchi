# Fediflock

Fediflock is a federated virtual pet system where pets can exist across different servers and interact with each other.

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/JuneVamp/FediGotchi
cd Fediflock
```

### 2. Install dependencies
Make sure you have Nodejs (https://nodejs.org/en/download) \

Then from the project root:

```bash
npm install
```

### 3. Start an ngrok server

Fediflock requires a publicly accessible server URL for communication between instances.

You are free to use any local tunnel or even put it on your own server. If you're using a local tunnel I've had best results with ngrok:
### 3.1 Using Ngrok
Make an ngrok account and install it (https://ngrok.com/) \

Run ngrok on port 3251:

```bash
ngrok http 3251
```

Copy the generated HTTPS URL.

Example:

```https://your-ngrok-url.ngrok-free.app```

### 4. Configure your server URL

Open ```src/serverConfig.ts```

Update the server URL to your server address:

```TS
export const SERVER_URL = "https://your-ngrok-url.ngrok-free.app";
```

### 5. Run Fediflock

From the project root:

```bash
npm run dev
```

The server will start on port 3251.

You can now access your Fediflock instance through your ngrok URL.
