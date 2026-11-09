# 🚀 DEPLOYMENT GUIDE: BLOCKCHAIN QR ATTENDANCE SYSTEM

This guide details all methods to run and deploy the **Blockchain QR Attendance Management System** across local development, Docker containers, public blockchain testnets, and cloud hosting platforms.

---

## 🟢 1. Current Live Status (Running Right Now)

All layers of the application are currently running and communicating with each other:

| Component | Status | URL / Port | Details |
|---|---|---|---|
| **Frontend** | 🟢 Live | [http://localhost:5173/](http://localhost:5173/) / [https://b7ad71d67eeb36.lhr.life](https://b7ad71d67eeb36.lhr.life) | React 18 + Vite Dev Server |
| **Backend API** | 🟢 Live | [http://127.0.0.1:5000/api](http://127.0.0.1:5000/api) / [https://b7ad71d67eeb36.lhr.life/api](https://b7ad71d67eeb36.lhr.life/api) | Python Flask + SQLite ORM + JWT |
| **Blockchain Node** | 🟢 Live | [http://127.0.0.1:8545](http://127.0.0.1:8545) | Hardhat Local EVM (Chain ID: 31337) |
| **Smart Contract** | 🟢 Deployed | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Solidity 0.8.20 Verification Contract |

### 🔑 Demo Login Accounts

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Administrator** | `admin@demo.edu` | `password123` | Full Campus Directory, Analytics, Classes, Subjects, System Settings |
| **Faculty / Teacher** | `teacher@demo.edu` | `password123` | Attendance Session Generator, Dynamic QR Code Broadcast, Live Monitor |
| **Student** | `student@demo.edu` | `password123` | Attendance Dashboard, Webcam QR Scanner, Zero-Knowledge Hash Card |

---

## ⚡ 2. One-Click Local Launcher (Windows)

To start or stop all 3 services at any time with a single click:

- **Start All**: Double-click `start-all.bat` (launches Node, deploys contract, seeds database, starts Flask API, and opens browser).
- **Stop All**: Double-click `stop-all.bat` (cleanly kills processes on ports 8545, 5000, and 5173).

---

## 🐳 3. Docker Compose Deployment (Production Containerized)

The repository includes pre-configured Dockerfiles and a `docker-compose.yml` for complete containerized deployment.

### Run with Docker Compose:
```bash
docker compose up --build -d
```

### Services Managed by Docker:
- **`bct-blockchain-node`**: Hardhat local node container on `:8545`
- **`bct-backend-api`**: Python Flask + Gunicorn container on `:5000`
- **`bct-frontend-app`**: Nginx production reverse-proxy serving React build on `:80` and `:5173`

To tear down:
```bash
docker compose down
```

---

## 🌐 4. Cloud Deployment (Free Tier: Vercel + Render)

### Step 4.1: Deploy Frontend to Vercel or Netlify
The project includes ready-to-use [`vercel.json`](file:///vercel.json) and [`netlify.toml`](file:///netlify.toml) files.

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
3. Import your repository and select the root directory (or root `BCT project` directory).
4. Configure Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Environment Variables:
   - Set `VITE_API_BASE_URL` = `https://<your-backend-app>.onrender.com/api`
6. Click **Deploy**.

---

### Step 4.2: Deploy Backend to Render.com
The project includes a ready [`render.yaml`](file:///render.yaml) and [`backend/Procfile`](file:///backend/Procfile).

1. Sign in to [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Root Directory**: `backend` (or `BCT project/backend`)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT run:app`
5. Environment Variables:
   - `SECRET_KEY`: `<any-strong-secret>`
   - `JWT_SECRET_KEY`: `<any-strong-jwt-secret>`
   - `BLOCKCHAIN_RPC_URL`: `https://rpc.sepolia.org` (or Infura/Alchemy endpoint)
   - `CONTRACT_ADDRESS`: `<your-deployed-contract-address>`
   - `HARDHAT_PRIVATE_KEY`: `<your-deployer-wallet-private-key>`
6. Click **Deploy Web Service**.

---

## ⛓️ 5. Deploy Smart Contract to Public Testnet (Sepolia or Polygon Amoy)

[`blockchain/hardhat.config.cjs`](file:///blockchain/hardhat.config.cjs) is pre-configured with networks for **Sepolia** and **Polygon Amoy**.

### Deploy to Sepolia:
1. Get testnet ETH from a faucet (e.g. [sepoliafaucet.com](https://sepoliafaucet.com)).
2. Set your environment variables in `.env`:
   ```env
   DEPLOYER_PRIVATE_KEY=0x<your_metamask_private_key>
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your-alchemy-key>
   ```
3. Run the deployment command:
   ```bash
   cd blockchain
   npx hardhat run scripts/deploy.cjs --network sepolia
   ```
4. Copy the outputted contract address to your backend `.env` / `CONTRACT_ADDRESS`.

---

## 🧪 6. Automated Verification Tests

You can run automated tests to verify the deployment anytime:

```bash
# 1. Hardhat Solidity Contract Tests (13/13 passing)
cd blockchain && npx hardhat test

# 2. RBAC & Attendance Security Tests (14/14 passing)
python -m unittest backend/tests/test_rbac_and_attendance.py

# 3. Web3 Blockchain Integration Test
python backend/tests/test_blockchain_integration.py

# 4. Full-Stack End-to-End Workflow Simulation (11 phases)
python backend/tests/test_full_workflow.py
```

