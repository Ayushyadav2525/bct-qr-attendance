const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AttendanceVerification Smart Contract", function () {
  let attendanceContract;
  let owner, teacher, student1, student2, unauthorized;

  const sessionId = "SES-TEST-2026-001";
  const classId = "CLS-CS4A";
  const subjectId = "SUB-BC401";
  const verificationCode = "VER-CS2024001-TEST";

  // Deterministic 32-byte hashes for pseudonymous students
  const studentHash1 = ethers.keccak256(ethers.toUtf8Bytes("STU-001:CS2024-001:salt"));
  const studentHash2 = ethers.keccak256(ethers.toUtf8Bytes("STU-002:CS2024-002:salt"));

  beforeEach(async function () {
    [owner, teacher, student1, student2, unauthorized] = await ethers.getSigners();

    const AttendanceVerification = await ethers.getContractFactory("AttendanceVerification");
    attendanceContract = await AttendanceVerification.deploy();
    await attendanceContract.waitForDeployment();
  });

  describe("1. Deployment & Ownership", function () {
    it("Should deploy contract and set correct owner", async function () {
      expect(await attendanceContract.owner()).to.equal(owner.address);
    });
  });

  describe("2. Session Creation (createSession)", function () {
    it("Should successfully create an attendance session and emit SessionCreated event", async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const expirationTime = block.timestamp + 3600; // 1 hour in future

      await expect(
        attendanceContract.createSession(
          sessionId,
          classId,
          subjectId,
          teacher.address,
          expirationTime
        )
      )
        .to.emit(attendanceContract, "SessionCreated")
        .withArgs(sessionId, classId, subjectId, teacher.address, expirationTime);

      const session = await attendanceContract.sessions(sessionId);
      expect(session.sessionId).to.equal(sessionId);
      expect(session.teacher).to.equal(teacher.address);
      expect(session.exists).to.be.true;
      expect(session.isActive).to.be.true;
    });

    it("Should reject session creation with past expiration time", async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const pastTime = block.timestamp - 100;

      await expect(
        attendanceContract.createSession(
          "SES-PAST",
          classId,
          subjectId,
          teacher.address,
          pastTime
        )
      ).to.be.revertedWith("Expiration time must be in the future");
    });

    it("Should reject duplicate session creation with same sessionId", async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const expirationTime = block.timestamp + 3600;

      await attendanceContract.createSession(sessionId, classId, subjectId, teacher.address, expirationTime);

      await expect(
        attendanceContract.createSession(sessionId, classId, subjectId, teacher.address, expirationTime)
      ).to.be.revertedWith("Session ID already exists");
    });
  });

  describe("3. Attendance Submission (markAttendance)", function () {
    beforeEach(async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const expirationTime = block.timestamp + 3600;

      await attendanceContract.createSession(
        sessionId,
        classId,
        subjectId,
        teacher.address,
        expirationTime
      );
    });

    it("Should successfully mark attendance and emit AttendanceMarked event", async function () {
      await expect(
        attendanceContract.connect(teacher).markAttendance(sessionId, studentHash1, verificationCode)
      )
        .to.emit(attendanceContract, "AttendanceMarked")
        .withArgs(sessionId, studentHash1, teacher.address, (val) => val > 0);

      const [attended, timestamp, markedBy] = await attendanceContract.verifyAttendance(sessionId, studentHash1);
      expect(attended).to.be.true;
      expect(markedBy).to.equal(teacher.address);
      expect(await attendanceContract.hasAttended(sessionId, studentHash1)).to.be.true;
    });

    it("Should reject duplicate attendance for the same student and session", async function () {
      await attendanceContract.markAttendance(sessionId, studentHash1, verificationCode);

      await expect(
        attendanceContract.markAttendance(sessionId, studentHash1, verificationCode)
      ).to.be.revertedWith("Duplicate attendance rejected: student already attended");
    });

    it("Should reject attendance submission for non-existent session", async function () {
      await expect(
        attendanceContract.markAttendance("SES-NONEXISTENT", studentHash1, verificationCode)
      ).to.be.revertedWith("Session does not exist");
    });

    it("Should reject attendance submission with empty bytes32 hash", async function () {
      await expect(
        attendanceContract.markAttendance(sessionId, ethers.ZeroHash, verificationCode)
      ).to.be.revertedWith("Invalid student hash");
    });
  });

  describe("4. Attendance Verification & Audit (verifyAttendance, hasAttended, getAttendanceRecord)", function () {
    beforeEach(async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const expirationTime = block.timestamp + 3600;

      await attendanceContract.createSession(sessionId, classId, subjectId, teacher.address, expirationTime);
      await attendanceContract.markAttendance(sessionId, studentHash1, verificationCode);
    });

    it("Should return true and record details for attended student", async function () {
      const [attended, timestamp, markedBy] = await attendanceContract.verifyAttendance(sessionId, studentHash1);
      expect(attended).to.be.true;
      expect(timestamp).to.be.greaterThan(0);
      expect(markedBy).to.equal(owner.address);

      const record = await attendanceContract.getAttendanceRecord(sessionId, studentHash1);
      expect(record.verificationCode).to.equal(verificationCode);
    });

    it("Should return false for student who has not attended", async function () {
      const [attended] = await attendanceContract.verifyAttendance(sessionId, studentHash2);
      expect(attended).to.be.false;
      expect(await attendanceContract.hasAttended(sessionId, studentHash2)).to.be.false;
    });

    it("Should revert getAttendanceRecord if student has not attended", async function () {
      await expect(
        attendanceContract.getAttendanceRecord(sessionId, studentHash2)
      ).to.be.revertedWith("No attendance record found on-chain");
    });
  });

  describe("5. Access Control & Session Closure", function () {
    beforeEach(async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const expirationTime = block.timestamp + 3600;

      await attendanceContract.createSession(sessionId, classId, subjectId, teacher.address, expirationTime);
    });

    it("Should reject unauthorized user from closing the session", async function () {
      await expect(
        attendanceContract.connect(unauthorized).closeSession(sessionId)
      ).to.be.revertedWith("Unauthorized: Only assigned instructor or owner can perform this operation");
    });

    it("Should allow assigned teacher or owner to close the session", async function () {
      await attendanceContract.connect(teacher).closeSession(sessionId);

      const session = await attendanceContract.sessions(sessionId);
      expect(session.isActive).to.be.false;

      // New scans should now be rejected
      await expect(
        attendanceContract.markAttendance(sessionId, studentHash1, verificationCode)
      ).to.be.revertedWith("Session is closed");
    });
  });
});
