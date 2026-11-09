// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AttendanceVerification
 * @dev Decentralized, tamper-evident attendance ledger for educational institutions.
 * Preserves student privacy by only storing cryptographic pseudonyms (bytes32) on-chain.
 */
contract AttendanceVerification {
    address public owner;

    struct Session {
        string sessionId;
        string classId;
        string subjectId;
        address teacher;
        uint256 expirationTime;
        bool exists;
        bool isActive;
    }

    struct AttendanceProof {
        bytes32 studentHash; // Pseudonymous keccak256 hash of student identity
        uint256 timestamp;
        address markedBy;
        string verificationCode;
        bool isRecorded;
    }

    // Mapping from sessionId => Session details
    mapping(string => Session) public sessions;

    // Mapping from sessionId => (studentHash => AttendanceProof)
    mapping(string => mapping(bytes32 => AttendanceProof)) private attendanceRecords;

    // Mapping from sessionId => list of student hashes who checked in
    mapping(string => bytes32[]) private sessionAttendees;

    // Events
    event SessionCreated(
        string sessionId,
        string classId,
        string subjectId,
        address indexed teacher,
        uint256 expirationTime
    );

    event AttendanceMarked(
        string sessionId,
        bytes32 indexed studentHash,
        address indexed markedBy,
        uint256 timestamp
    );

    event SessionClosed(string sessionId, uint256 timestamp);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Only contract owner can perform this action");
        _;
    }

    modifier onlySessionTeacherOrOwner(string memory _sessionId) {
        require(sessions[_sessionId].exists, "Session does not exist");
        require(
            msg.sender == owner || msg.sender == sessions[_sessionId].teacher,
            "Unauthorized: Only assigned instructor or owner can perform this operation"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Creates an attendance session on-chain.
     */
    function createSession(
        string calldata _sessionId,
        string calldata _classId,
        string calldata _subjectId,
        address _teacher,
        uint256 _expirationTime
    ) external {
        require(!sessions[_sessionId].exists, "Session ID already exists");
        require(_expirationTime > block.timestamp, "Expiration time must be in the future");
        require(_teacher != address(0), "Invalid teacher address");

        sessions[_sessionId] = Session({
            sessionId: _sessionId,
            classId: _classId,
            subjectId: _subjectId,
            teacher: _teacher,
            expirationTime: _expirationTime,
            exists: true,
            isActive: true
        });

        emit SessionCreated(_sessionId, _classId, _subjectId, _teacher, _expirationTime);
    }

    /**
     * @notice Registers attendance proof for a student in a session.
     * Prevents duplicate check-ins and enforces active session status.
     */
    function markAttendance(
        string calldata _sessionId,
        bytes32 _studentHash,
        string calldata _verificationCode
    ) external {
        Session storage currentSession = sessions[_sessionId];
        require(currentSession.exists, "Session does not exist");
        require(currentSession.isActive, "Session is closed");
        require(block.timestamp <= currentSession.expirationTime, "Attendance session has expired");
        require(_studentHash != bytes32(0), "Invalid student hash");
        require(!attendanceRecords[_sessionId][_studentHash].isRecorded, "Duplicate attendance rejected: student already attended");

        attendanceRecords[_sessionId][_studentHash] = AttendanceProof({
            studentHash: _studentHash,
            timestamp: block.timestamp,
            markedBy: msg.sender,
            verificationCode: _verificationCode,
            isRecorded: true
        });

        sessionAttendees[_sessionId].push(_studentHash);

        emit AttendanceMarked(_sessionId, _studentHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Verifies if a student has attended a session.
     */
    function verifyAttendance(
        string calldata _sessionId,
        bytes32 _studentHash
    ) external view returns (bool attended, uint256 timestamp, address markedBy) {
        AttendanceProof storage proof = attendanceRecords[_sessionId][_studentHash];
        return (proof.isRecorded, proof.timestamp, proof.markedBy);
    }

    /**
     * @notice Quick boolean check if a student has attended.
     */
    function hasAttended(
        string calldata _sessionId,
        bytes32 _studentHash
    ) external view returns (bool) {
        return attendanceRecords[_sessionId][_studentHash].isRecorded;
    }

    /**
     * @notice Retrieves detailed attendance record proof.
     */
    function getAttendanceRecord(
        string calldata _sessionId,
        bytes32 _studentHash
    ) external view returns (uint256 timestamp, address markedBy, string memory verificationCode) {
        AttendanceProof storage proof = attendanceRecords[_sessionId][_studentHash];
        require(proof.isRecorded, "No attendance record found on-chain");
        return (proof.timestamp, proof.markedBy, proof.verificationCode);
    }

    /**
     * @notice Allows closing an active session early.
     */
    function closeSession(string calldata _sessionId) external onlySessionTeacherOrOwner(_sessionId) {
        require(sessions[_sessionId].isActive, "Session already inactive");
        sessions[_sessionId].isActive = false;
        emit SessionClosed(_sessionId, block.timestamp);
    }

    /**
     * @notice Returns total number of verified attendees for a session.
     */
    function getAttendeeCount(string calldata _sessionId) external view returns (uint256) {
        require(sessions[_sessionId].exists, "Session does not exist");
        return sessionAttendees[_sessionId].length;
    }
}
