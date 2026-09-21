import { expect } from "chai";
import { ethers } from "hardhat";
import * as crypto from "crypto";

describe("EMRIntegrityRegistry Smart Contract", function () {
  let registry: any;
  let owner: any;
  let doctor: any;
  let unauthorized: any;

  function sha256Hash(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
  }

  beforeEach(async function () {
    [owner, doctor, unauthorized] = await ethers.getSigners();
    const EMRIntegrityRegistry = await ethers.getContractFactory("EMRIntegrityRegistry");
    registry = await EMRIntegrityRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("should deploy with initial counts set to zero", async function () {
    expect(await registry.totalRecordsRegistered()).to.equal(0);
    expect(await registry.totalEventsRegistered()).to.equal(0);
    expect(await registry.owner()).to.equal(owner.address);
  });

  it("should register a medical record hash without storing PHI", async function () {
    const recordId = "RX-100245";
    const canonicalPayload = JSON.stringify({
      prescriptionId: "RX-100245",
      patientId: "HP-100245",
      doctorReg: "MCI-CARD-2018-8472",
      medicine: "Telmisartan 40mg",
      date: "2024-02-01",
    });
    const hash = sha256Hash(canonicalPayload);

    const tx = await registry.connect(doctor).registerRecordHash(
      recordId,
      hash,
      "RECORD_CREATED",
      "HP-100245"
    );

    await expect(tx).to.emit(registry, "RecordHashRegistered");

    expect(await registry.totalRecordsRegistered()).to.equal(1);

    const proof = await registry.getRecordProof(recordId);
    expect(proof.recordHash).to.equal(hash);
    expect(proof.eventType).to.equal("RECORD_CREATED");
    expect(proof.referenceId).to.equal("HP-100245");
    expect(proof.recordedBy).to.equal(doctor.address);
    expect(proof.exists).to.be.true;
  });

  it("should verify matching hash as true and mismatched hash as false (Tampering detection)", async function () {
    const recordId = "LR-2031";
    const validData = "Lipid Profile: Cholesterol 185 mg/dL";
    const tamperedData = "Lipid Profile: Cholesterol 120 mg/dL (Manipulated)";

    const validHash = sha256Hash(validData);
    const tamperedHash = sha256Hash(tamperedData);

    await registry.registerRecordHash(recordId, validHash, "RECORD_CREATED", "HP-100245");

    // Recalculating with untampered data
    const isOriginalValid = await registry.verifyRecordHash(recordId, validHash);
    expect(isOriginalValid).to.be.true;

    // Recalculating with tampered data
    const isTamperedValid = await registry.verifyRecordHash(recordId, tamperedHash);
    expect(isTamperedValid).to.be.false;
  });

  it("should emit TamperAlertTriggered event on tampering report", async function () {
    const recordId = "LR-2031";
    const expectedHash = sha256Hash("original");
    const actualHash = sha256Hash("tampered");

    const tx = await registry.connect(owner).reportTampering(recordId, expectedHash, actualHash);
    await expect(tx).to.emit(registry, "TamperAlertTriggered");
  });

  it("should register and retrieve sensitive event proofs (Access grant / Emergency)", async function () {
    const eventId = "EMG-7801";
    const eventPayload = "Emergency Bypass Session initiated for HP-100245";
    const eventHash = sha256Hash(eventPayload);

    await registry.registerEventHash(eventId, eventHash, "EMERGENCY_ACCESS");

    const eventProof = await registry.getEventProof(eventId);
    expect(eventProof.eventHash).to.equal(eventHash);
    expect(eventProof.eventType).to.equal("EMERGENCY_ACCESS");
    expect(eventProof.exists).to.be.true;
    expect(await registry.totalEventsRegistered()).to.equal(1);
  });
});
