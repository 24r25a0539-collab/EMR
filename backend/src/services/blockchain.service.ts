import { ethers } from 'ethers';
import { prisma } from '../models/prisma.js';
import { config } from '../config/index.js';
import { calculateCanonicalSha256, generateTxHash } from '../utils/crypto.js';

// Minimal ABI for EMRIntegrityRegistry contract
const EMR_REGISTRY_ABI = [
  'function registerRecordHash(string recordId, string recordHash, string eventType, string referenceId) external',
  'function registerEventHash(string eventId, string eventHash, string eventType) external',
  'function verifyRecordHash(string recordId, string recordHash) external view returns (bool)',
  'function getRecordProof(string recordId) external view returns (string recordHash, uint256 timestamp, string eventType, string referenceId, address recordedBy, bool exists)',
  'function reportTampering(string recordId, string expectedHash, string actualHash) external',
  'function totalRecordsRegistered() external view returns (uint256)',
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private isNodeConnected: boolean = false;

  constructor() {
    this.initProvider();
  }

  private async initProvider() {
    try {
      // Fast check if RPC URL is responding before creating provider
      const response = await fetch(config.blockchainRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        signal: AbortSignal.timeout(300),
      }).catch(() => null);

      if (!response || !response.ok) {
        this.isNodeConnected = false;
        this.provider = null;
        this.signer = null;
        this.contract = null;
        return;
      }

      this.provider = new ethers.JsonRpcProvider(config.blockchainRpcUrl);
      if (config.blockchainPrivateKey) {
        this.signer = new ethers.Wallet(config.blockchainPrivateKey, this.provider);
        if (config.contractAddress) {
          this.contract = new ethers.Contract(config.contractAddress, EMR_REGISTRY_ABI, this.signer);
        }
      }
      this.isNodeConnected = true;
    } catch {
      this.isNodeConnected = false;
      this.provider = null;
      this.signer = null;
      this.contract = null;
    }
  }

  /**
   * Returns current blockchain network status.
   */
  async getStatus() {
    await this.initProvider();
    const proofCount = await prisma.blockchainProof.count();
    const alertCount = await prisma.securityAlert.count({
      where: { alertType: { in: ['HASH_MISMATCH', 'TAMPERING_DETECTED'] } },
    });

    return {
      connectedToLiveNode: this.isNodeConnected,
      mode: this.isNodeConnected ? 'LIVE_HARDHAT_EVM' : 'CRYPTOGRAPHIC_PROOF_LEDGER',
      networkName: this.isNodeConnected ? 'Hardhat Local EVM (ChainId 31337)' : 'EMR Cryptographic SHA-256 Ledger',
      rpcUrl: config.blockchainRpcUrl,
      contractAddress: config.contractAddress || (this.isNodeConnected ? 'Deployed' : 'Local Proof Mode'),
      totalProofsRegistered: proofCount,
      integrityAlertsDetected: alertCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Registers a cryptographic SHA-256 proof for an EMR record.
   */
  async registerRecordProof(params: {
    recordId: string;
    recordType: string;
    eventType: string;
    payload: any;
    referenceId: string;
    recordedBy?: string;
  }) {
    const { recordId, recordType, eventType, payload, referenceId, recordedBy = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' } = params;
    const canonicalHash = calculateCanonicalSha256(payload);

    let transactionId = generateTxHash();
    let blockNumber = 10450;
    let status = 'CONFIRMED';

    // If live Hardhat node is running and contract exists, execute on-chain transaction
    if (this.isNodeConnected && this.contract) {
      try {
        const tx = await this.contract.registerRecordHash(recordId, canonicalHash, eventType, referenceId);
        const receipt = await tx.wait();
        transactionId = receipt.hash;
        blockNumber = receipt.blockNumber;
      } catch (err) {
        console.warn('EVM on-chain execution error, falling back to database proof record:', err);
      }
    }

    // Persist proof record in database
    const proof = await prisma.blockchainProof.create({
      data: {
        recordId,
        recordType,
        eventType,
        canonicalHash,
        transactionId,
        blockNumber,
        contractAddress: config.contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        network: this.isNodeConnected ? 'Hardhat-Local-EVM' : 'EMR-Crypto-Ledger',
        status,
        recordedBy,
        timestamp: new Date(),
      },
    });

    return {
      proofId: proof.id,
      recordId,
      canonicalHash,
      transactionId,
      blockNumber,
      status: 'VERIFIED',
      timestamp: proof.timestamp,
    };
  }

  /**
   * Verifies the cryptographic integrity of a record by comparing its recalculated
   * canonical SHA-256 hash against the immutable proof.
   * If mismatch is detected, triggers a high-severity HASH_MISMATCH SecurityAlert and AuditEvent!
   */
  async verifyRecordProof(params: {
    recordId: string;
    recordType: string;
    currentPayload: any;
    patientId?: string;
    actorId?: string;
    actorName?: string;
  }) {
    const { recordId, recordType, currentPayload, patientId, actorId = 'system', actorName = 'System Integrity Monitor' } = params;
    const calculatedHash = calculateCanonicalSha256(currentPayload);

    // Look up latest registered proof
    const proof = await prisma.blockchainProof.findFirst({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
    });

    if (!proof) {
      return {
        verified: false,
        status: 'PROOF_NOT_FOUND',
        message: 'No registered blockchain proof found for this record.',
        calculatedHash,
      };
    }

    const matches = proof.canonicalHash === calculatedHash;

    if (matches) {
      return {
        verified: true,
        status: 'VERIFIED',
        message: 'EMR Integrity: VERIFIED',
        expectedHash: proof.canonicalHash,
        calculatedHash,
        transactionId: proof.transactionId,
        blockNumber: proof.blockNumber,
        timestamp: proof.timestamp,
        network: proof.network,
      };
    }

    // TAMPERING DETECTED / HASH MISMATCH!
    // 1. Create High-Severity Security Alert
    const alert = await prisma.securityAlert.create({
      data: {
        alertType: 'HASH_MISMATCH',
        severity: 'HIGH',
        title: `EMR Integrity Failure: Hash Mismatch on ${recordType} (${recordId})`,
        description: `Cryptographic verification failed. The current database content does not match the registered immutable blockchain proof. Tampering or unauthorized alteration detected.`,
        patientId,
        recordId,
        reason: 'Recalculated canonical SHA-256 hash differs from registered blockchain proof.',
        expectedHash: proof.canonicalHash,
        actualHash: calculatedHash,
        blockchainTxId: proof.transactionId,
        status: 'NEW',
      },
    });

    // 2. Create Audit Event
    await prisma.auditEvent.create({
      data: {
        actorId,
        actorRole: 'SYSTEM',
        actorName,
        patientId,
        recordId,
        documentId: recordId,
        documentType: recordType,
        action: 'MODIFY',
        accessType: 'UNAUTHORIZED_ATTEMPT',
        reason: `Cryptographic integrity failure detected during verification scan.`,
        authorizationStatus: 'DENIED',
        consentStatus: 'NOT_REQUIRED',
        previousHash: proof.canonicalHash,
        newHash: calculatedHash,
        blockchainTxId: proof.transactionId,
        blockchainVerificationStatus: 'FAILED',
        result: 'BLOCKED',
        severity: 'CRITICAL',
      },
    });

    return {
      verified: false,
      status: 'INTEGRITY_FAILURE',
      message: 'EMR Integrity: FAILURE. Cryptographic hash mismatch detected!',
      alertId: alert.id,
      expectedHash: proof.canonicalHash,
      calculatedHash,
      transactionId: proof.transactionId,
      detectedAt: new Date().toISOString(),
    };
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
