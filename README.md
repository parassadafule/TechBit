# Techbit

A decentralized platform for tech knowledge sharing, leveraging ATProto for social feeds, IPFS for data storage, and AI for content ranking and summarization.

## Features

- **Decentralized Feeds**: Custom algorithms for ranking tech content based on novelty, impact, and expertise.
- **Knowledge Graph**: Distributed graph for connecting ideas and filling knowledge gaps.
- **AI-Powered Scoring**: ML models for semantic analysis and federated learning.
- **Blockchain Attestations**: On-chain endorsements for expertise and impact tracking.

## Architecture

- **Backend**: Node.js/TypeScript with ATProto integration, IPFS for data syncing.
- **ML Service**: Python with Flask/FastAPI for inference, RAG, and federated training.
- **Frontend**: React/TypeScript with decentralized data fetching.
- **Contracts**: Solidity smart contracts for attestations and impact tracking.
- **Infra**: Docker Compose for local dev, Terraform/K8s for deployment.

## Setup

1. **Prerequisites**:
   - Node.js 18+
   - Python 3.9+
   - Docker & Docker Compose
   - Yarn

2. **Clone and Install**:
   ```bash
   git clone <repo-url>
   cd techbit
   yarn install
   ```

3. **Environment**:
   - Copy `config/env.example` to `.env`
   - Fill in required variables (e.g., GitHub token, IPFS gateway)

4. **Run Locally**:
   ```bash
   docker-compose up --build
   ```

5. **Development**:
   - Backend: `cd backend && yarn start`
   - Frontend: `cd frontend && yarn dev`
   - ML: `cd ml-service && python src/main.py`

## API Docs

See `docs/api/` for OpenAPI specs.

## Contributing

See `docs/onboarding.md` for setup and contribution guidelines.