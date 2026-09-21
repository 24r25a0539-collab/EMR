// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EMRIntegrityRegistry
 * @dev Immutable on-chain registry for cryptographic SHA-256 integrity proofs
 * of Electronic Medical Records (EMR). Never stores Protected Health Information (PHI)
 * or medical details. Only stores canonical record hashes, event hashes, timestamps,
 * event types, reference IDs, and registrar addresses.
 */
contract EMRIntegrityRegistry {
    // Contract owner / deployer
    address public owner;

    struct RecordProof {
        string recordHash;     // SHA-256 canonical hash of the record
        uint256 timestamp;      // Block timestamp of registration
        string eventType;      // RECORD_CREATED, RECORD_MODIFIED, etc.
        string referenceId;    // Reference ID (e.g. Health ID, Doctor Reg Number)
        address recordedBy;    // Ethereum address that registered the proof
        bool exists;           // Flag to verify existence
    }

    struct EventProof {
        string eventHash;      // SHA-256 hash of audit event
        uint256 timestamp;      // Block timestamp
        string eventType;      // ACCESS_GRANTED, EMERGENCY_ACCESS, etc.
        address recordedBy;    // Ethereum address
        bool exists;
    }

    // Mapping from recordId to its latest Proof
    mapping(string => RecordProof) private recordProofs;

    // Mapping from recordId to version history array of hashes
    mapping(string => string[]) private recordHashHistory;

    // Mapping from eventId to EventProof
    mapping(string => EventProof) private eventProofs;

    // Total counts for auditing
    uint256 public totalRecordsRegistered;
    uint256 public totalEventsRegistered;

    // Events
    event RecordHashRegistered(
        string indexed recordId,
        string recordHash,
        string eventType,
        string referenceId,
        address indexed recordedBy,
        uint256 timestamp
    );

    event EventHashRegistered(
        string indexed eventId,
        string eventHash,
        string eventType,
        address indexed recordedBy,
        uint256 timestamp
    );

    event TamperAlertTriggered(
        string indexed recordId,
        string expectedHash,
        string actualHash,
        address indexed reporter,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can invoke this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Registers or updates a cryptographic SHA-256 proof for a medical record.
     * @param recordId Unique database ID or business number (e.g., RX-100245, LR-2031)
     * @param recordHash Canonical SHA-256 hash of the medical record
     * @param eventType Type of event (RECORD_CREATED, RECORD_MODIFIED, etc.)
     * @param referenceId Supporting reference (e.g., Patient Health ID)
     */
    function registerRecordHash(
        string memory recordId,
        string memory recordHash,
        string memory eventType,
        string memory referenceId
    ) external {
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(bytes(recordHash).length > 0, "Record hash cannot be empty");

        recordProofs[recordId] = RecordProof({
            recordHash: recordHash,
            timestamp: block.timestamp,
            eventType: eventType,
            referenceId: referenceId,
            recordedBy: msg.sender,
            exists: true
        });

        recordHashHistory[recordId].push(recordHash);
        totalRecordsRegistered++;

        emit RecordHashRegistered(
            recordId,
            recordHash,
            eventType,
            referenceId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Registers a sensitive event hash (e.g. Access Grant, Emergency Session, Audit Batch).
     * @param eventId Unique event identifier
     * @param eventHash SHA-256 hash of canonical event data
     * @param eventType Event category (ACCESS_GRANTED, ACCESS_REVOKED, EMERGENCY_ACCESS)
     */
    function registerEventHash(
        string memory eventId,
        string memory eventHash,
        string memory eventType
    ) external {
        require(bytes(eventId).length > 0, "Event ID cannot be empty");
        require(bytes(eventHash).length > 0, "Event hash cannot be empty");

        eventProofs[eventId] = EventProof({
            eventHash: eventHash,
            timestamp: block.timestamp,
            eventType: eventType,
            recordedBy: msg.sender,
            exists: true
        });

        totalEventsRegistered++;

        emit EventHashRegistered(
            eventId,
            eventHash,
            eventType,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Verifies if a given recalculated hash matches the registered proof.
     * @param recordId Unique record identifier
     * @param recordHash Recalculated SHA-256 hash
     * @return isValid True if registered hash strictly equals provided hash
     */
    function verifyRecordHash(
        string memory recordId,
        string memory recordHash
    ) external view returns (bool isValid) {
        RecordProof memory proof = recordProofs[recordId];
        if (!proof.exists) {
            return false;
        }
        return keccak256(bytes(proof.recordHash)) == keccak256(bytes(recordHash));
    }

    /**
     * @notice Retrieves full cryptographic proof details for a record.
     * @param recordId Unique record identifier
     */
    function getRecordProof(string memory recordId)
        external
        view
        returns (
            string memory recordHash,
            uint256 timestamp,
            string memory eventType,
            string memory referenceId,
            address recordedBy,
            bool exists
        )
    {
        RecordProof memory proof = recordProofs[recordId];
        return (
            proof.recordHash,
            proof.timestamp,
            proof.eventType,
            proof.referenceId,
            proof.recordedBy,
            proof.exists
        );
    }

    /**
     * @notice Retrieves event proof details.
     * @param eventId Unique event identifier
     */
    function getEventProof(string memory eventId)
        external
        view
        returns (
            string memory eventHash,
            uint256 timestamp,
            string memory eventType,
            address recordedBy,
            bool exists
        )
    {
        EventProof memory proof = eventProofs[eventId];
        return (
            proof.eventHash,
            proof.timestamp,
            proof.eventType,
            proof.recordedBy,
            proof.exists
        );
    }

    /**
     * @notice Triggers an on-chain alert when an off-chain tampering attempt is detected.
     */
    function reportTampering(
        string memory recordId,
        string memory expectedHash,
        string memory actualHash
    ) external {
        emit TamperAlertTriggered(
            recordId,
            expectedHash,
            actualHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Returns total number of version hashes stored for a record.
     */
    function getRecordHashHistoryCount(string memory recordId)
        external
        view
        returns (uint256)
    {
        return recordHashHistory[recordId].length;
    }
}
