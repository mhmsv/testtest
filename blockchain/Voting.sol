// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

contract Voting {
    //############################################ Struct ############################################//

    //to demonstrate workflow status of the voting program with these 6 states

    enum State {
        BallotInitiated,
        VotersRegistration,
        StartingPartyRegistration,
        EndingPartyRegistration,
        StaringVotingSession,
        EndingVotingSession,
        StartReadingFeedbacks,
        UpdatingProposals,
        TallingVotes
    }



    struct Voter {
        bool hasVoted;
        bool isRegistered;
        address voterAddress;
        uint256 countofVotes;
        uint256 VotedpartyId;
    }



    struct Party {
        string partyName;
        string description;
        string broadMembers;
        uint256 partyId;
        address partyCreatorAddress;
    }



    //############################################ Public Variables ############################################//

    //creator of ballot address
    address ballotAdminstrator;

    //ballot's name : what is its purpose and descriptions
    string ballotName;
    string ballotDescription;

    //mapping of address to voters
    mapping(address => Voter) private addressToVoter;


    //maping of proposolal/party ID to feedbacks
    mapping(uint256 => string[]) private idToFeedbacks;


    //mapping partis to its votes
    mapping(uint256 => uint256) private partiesToNumberOfVotes;


    //array of parties
    //party ro bayad private koni dar enteha ya ye fekri be fekre how many vote bokonni !!!!!!!!!!!!!!!
    Party[] public parties;
    address[] private votersArray;

    address[] private voterBlackList = [
        0x1BCa849862725D35A5443720d3427e427A58519B,
        0xBB47cD00B937B30997baeB01b9F734B55559C55E,
        0xdD870fA1b7C4700F2BD7f44238821C26f7392148,
        0x583031D1113aD414F02576BD6afaBfb302140225,
        0x583031D1113aD414F02576BD6afaBfb302140225,
        0xBB47cD00B937B30997baeB01b9F734B55559C55E
    ];
    address[] private registerPartyBlackList = [
        0xBB47cD00B937B30997baeB01b9F734B55559C55E,
        0x2FC0770c743E9c9d1Bd38972386dC69Be9F8428b,
        0x583031D1113aD414F02576BD6afaBfb302140225,
        0x583031D1113aD414F02576BD6afaBfb302140225,
        0xBB47cD00B937B30997baeB01b9F734B55559C55E,
        0x2FC0770c743E9c9d1Bd38972386dC69Be9F8428b
    ];


    //State flag
    State public state;

    //eligible votersCount
    uint256 private eligibleVotersCount;

    //number of users who voted
    uint256 private hasVotedCount;

    //number of registered parties
    uint256 private hasRegisteredPartyCount;

    //winning party id / PRIVATE
    uint256 private winningPartyId;
    uint256 public winningPartyId_pub;

    //winning majority
    uint256 public winByMajorityPercentarge;


    //############################################ Constructor ############################################//


    constructor(
        string memory _ballotName,
        string memory _ballotDescription,
        uint256 _winByMajorityPercentarge
    ) {
        ballotName = _ballotName;
        ballotDescription = _ballotDescription;
        winByMajorityPercentarge = _winByMajorityPercentarge * 100000000; //to handle floating point comparison
        state = State.BallotInitiated;
        ballotAdminstrator = msg.sender;
        eligibleVotersCount = 0;
        hasVotedCount = 0;
        hasRegisteredPartyCount = 0;
    }


    //############################################ Modifiers ############################################//


    //only admin of ballot have access
    modifier onlyAdministrator() {
        require(
            msg.sender == ballotAdminstrator,
            "the caller of this function must be the administrator"
        );
        _;
    }

    //the caller of this function should be a registered voter

    modifier onlyRegisteredVoter() {
        require(
            addressToVoter[msg.sender].isRegistered,
            "the caller of this function must be a registered voter"
        );
        _;
    }

    //State modifiers
    modifier onlyDuringInitialState() {
        require(
            state == State.BallotInitiated,
            "State should be at initial state to run this function"
        );
        _;
    }

    modifier canVote() {
        _;
    }

    modifier onlyDuringVotersRegistration() {
        require(
            state == State.VotersRegistration,
            "State should be at Voters Registration to run this function"
        );
        _;
    }

    modifier onlyDuringPartyRegistration() {
        require(
            state == State.StartingPartyRegistration,
            "State should be at Starting of party Registration to run this function"
        );
        _;
    }

    modifier onlyDuringEndingPartyRegistration() {
        require(
            state == State.EndingPartyRegistration,
            "State should be at Ending Of party Regostration to run this function"
        );
        _;
    }

    modifier onlyDuringStaringVotingSession() {
        require(
            state == State.StaringVotingSession,
            "State should be at starting of voting session to run this function"
        );
        _;
    }

    modifier onlyDuringEndingVotingSession() {
        require(
            state == State.EndingVotingSession,
            "State status should be at end of voting session to run this function"
        );
        _;
    }

    modifier onlyAfterTallingVotes() {
        require(
            state == State.TallingVotes,
            "Ballot must be talled to execute this function to run this function"
        );
        _;
    }

    modifier condition(bool _condition) {
        require(_condition);
        _;
    }

    modifier partyDoesExist(uint256 _partyId) {
        // -1 ro vardar age rid
        require(
            _partyId <= parties.length - 1,
            "Party with this id does not exist"
        );
        _;
    }

    modifier isPartyOwner(uint256 _partyId) {
        require(
            msg.sender == parties[_partyId].partyCreatorAddress,
            "Only creator of a party can read this proposal feedbacks"
        );
        _;
    }

    modifier onlyDuringFeedbackReading() {
        require(
            state == State.StartReadingFeedbacks,
            "State status should be at Reading Feedbacks"
        );

        _;
    }

    modifier onlyDuringUpdatingProposal() {
        require(
            state == State.UpdatingProposals,
            "State status should be at Updating Proposal"
        );

        _;
    }

    modifier eligiblAndHasVotedVotesCountShouldBeEqual() {
        require(
            eligibleVotersCount >= hasVotedCount,
            "Number of users who has voted, should be lower than amount of eligible voters, voting failed!"
        );
        _;
    }


    modifier thereShouldBeAnyPartyWithVotesMoreThanMajority() {
        uint256 maxVote = gerPartywithMostVotes_voteCount();
        require(
            (maxVote / eligibleVotersCount) * 100 < winByMajorityPercentarge,
            "There is one party with votes more than required majority, there for votes should be tallied and updating proposals can not take place any more, Click on talling votes"
        );
        _;
    }

    modifier notvoterBlackList(address _address) {
        for (uint256 i = 0; i < voterBlackList.length; i++) {
            require(
                voterBlackList[i] != _address,
                "Unfortunately, entered address can not be register as a new voter, it is in blacklist"
            );
        }
        _;
    }

    modifier notPartyRegisterBlackList(address _address) {
        for (uint256 i = 0; i < registerPartyBlackList.length; i++) {
            require(
                registerPartyBlackList[i] != _address,
                "Unfortunately, entered address can not register a proposalr, it is in proposal blacklist"
            );
        }
        _;
    }

    //############################################ Events ############################################//

    event stateChangedEvent(State previousState, State currentState);

    event voterRegistrationStartEvent();

    event startPartyRegistrationEvent();

    event endingPartyRegistrationEvent();

    event voitingSessionStartedEvent();

    event voitngSessionEndedEvent();

    event voteTaliedEvent(uint256 winnerPartyId);

    event newVoterRegisteredEvent(address newVoterAddress);

    event newPartyRegisteredEvent(uint256 partyId);

    event voteEvent(address voterAddress, uint256 votedPartyId);

    event changeVoteEvent(address voterAddress, uint256 votedPartyId);

    event removeVoteEvent(address voterAddress);

    event FeedbackReadingstartEvent();

    event UpdatingProposalsEvent();

    event someOneWonBymajorityandCannotupdateanymoreEvent();

    

    //############################################ Functions ############################################//

    //register new voter ,next step implement it in a way that admin could add multiple address
    function registerVoter(address _newVoterAddress)
        public
        onlyAdministrator
        onlyDuringVotersRegistration
        notvoterBlackList(_newVoterAddress)
    {
        require(
            !addressToVoter[_newVoterAddress].isRegistered,
            "This address has already been registered as a new voter"
        );

        addressToVoter[_newVoterAddress].isRegistered = true;
        addressToVoter[_newVoterAddress].hasVoted = false;
        addressToVoter[_newVoterAddress].countofVotes = 0;
        addressToVoter[_newVoterAddress].VotedpartyId = 0;

        eligibleVotersCount = eligibleVotersCount + 1;
        votersArray.push(_newVoterAddress);
        emit newVoterRegisteredEvent(_newVoterAddress);
    }

    function registerParty(
        string memory _partyName,
        string memory _description,
        string memory _broadMembers
    )
        public
        onlyDuringPartyRegistration
        onlyRegisteredVoter
        notPartyRegisterBlackList(msg.sender)
    {
        Party memory tmpPrty;
        tmpPrty.partyCreatorAddress = msg.sender;
        tmpPrty.partyName = _partyName;
        tmpPrty.description = _description;
        tmpPrty.broadMembers = _broadMembers;
        //tmpPrty.howManyvote = 0;
        tmpPrty.partyId = parties.length;
        parties.push(tmpPrty);

        hasRegisteredPartyCount++; // indicator to patyid  hasRegisteredPartyCount-1 = index

        emit newPartyRegisteredEvent(parties.length - 1);
    }

    //############################################ voting stuff ############################################//

    function vote(uint256 _partyId)
        public
        onlyRegisteredVoter
        onlyDuringStaringVotingSession
        partyDoesExist(_partyId)
    {
        require(
            addressToVoter[msg.sender].hasVoted == false,
            "caller of this function has already voted"
        );

        addressToVoter[msg.sender].hasVoted = true;
        addressToVoter[msg.sender].countofVotes++;
        addressToVoter[msg.sender].VotedpartyId = _partyId;

        hasVotedCount++;
        partiesToNumberOfVotes[_partyId]++;
        //parties[_partyId].howManyvote++;
        emit voteEvent(msg.sender, _partyId);
    }

    function changeVote(uint256 _partyId)
        public
        onlyRegisteredVoter
        onlyDuringStaringVotingSession
        partyDoesExist(_partyId)
    {
        require(
            addressToVoter[msg.sender].hasVoted == true,
            "caller of this function has not voted yet"
        );

        //remove previous vote
        partiesToNumberOfVotes[addressToVoter[msg.sender].VotedpartyId]--;
        //parties[_partyId].howManyvote++;
        //change vote to new party
        addressToVoter[msg.sender].VotedpartyId = _partyId;
        //add to votes of new party
        partiesToNumberOfVotes[_partyId]++;
        //parties[_partyId].howManyvote++;
        emit changeVoteEvent(msg.sender, _partyId);
        emit voteEvent(msg.sender, _partyId);
    }

    function removeVote()
        public
        onlyRegisteredVoter
        onlyDuringStaringVotingSession
    {
        require(
            addressToVoter[msg.sender].hasVoted == true,
            "caller of this function has not voted yet"
        );
        //remove previous vote
        partiesToNumberOfVotes[addressToVoter[msg.sender].VotedpartyId]--;
        addressToVoter[msg.sender].hasVoted = false;
        addressToVoter[msg.sender].countofVotes--;
        addressToVoter[msg.sender].VotedpartyId = 0;

        hasVotedCount--;
        emit removeVoteEvent(msg.sender);
    }

    //############################################ feedback stuff ############################################//

    function makeComment(string memory _comment, uint256 _partyId)
        public
        onlyRegisteredVoter
        onlyDuringStaringVotingSession
        partyDoesExist(_partyId)
    {
        idToFeedbacks[_partyId].push(_comment);
    }

    function getFeddbacks(uint256 _partyId)
        public
        view
        onlyDuringFeedbackReading
        isPartyOwner(_partyId)
        partyDoesExist(_partyId)
        returns (string[] memory)
    {
        return idToFeedbacks[_partyId];
    }

    function updateProposal(uint256 _partyId, string memory _description)
        public
        onlyDuringUpdatingProposal
        isPartyOwner(_partyId)
        partyDoesExist(_partyId)
    {
        parties[_partyId].description = _description;
    }

    //############################################ State changer ############################################//

    function beginVoterRegistration()
        public
        onlyAdministrator
        onlyDuringInitialState
    {
        state = State.VotersRegistration;

        emit stateChangedEvent(State.BallotInitiated, State.VotersRegistration);
        emit voterRegistrationStartEvent();
    }

    function startingPartyRegistration()
        public
        onlyAdministrator
        onlyDuringVotersRegistration
    {
        state = State.StartingPartyRegistration;

        emit stateChangedEvent(
            State.VotersRegistration,
            State.StartingPartyRegistration
        );
        emit startPartyRegistrationEvent();
    }

    function endingPartyRegistration()
        public
        onlyAdministrator
        onlyDuringPartyRegistration
    {
        state = State.EndingPartyRegistration;

        emit stateChangedEvent(
            State.StartingPartyRegistration,
            State.EndingPartyRegistration
        );
        emit endingPartyRegistrationEvent();
    }

    function startVotingSession()
        public
        onlyAdministrator
        onlyDuringEndingPartyRegistration
    {
        state = State.StaringVotingSession;

        emit stateChangedEvent(
            State.EndingPartyRegistration,
            State.StaringVotingSession
        );
        emit voitingSessionStartedEvent();
    }

    function endVotingSession()
        public
        onlyAdministrator
        onlyDuringStaringVotingSession
    {
        state = State.EndingVotingSession;

        emit stateChangedEvent(
            State.StaringVotingSession,
            State.EndingVotingSession
        );
        emit voitngSessionEndedEvent();
    }

    function startReadingFeedbacks()
        public
        onlyAdministrator
        onlyDuringEndingVotingSession
    {
        state = State.StartReadingFeedbacks;
        emit stateChangedEvent(
            State.EndingVotingSession,
            State.StartReadingFeedbacks
        );
        emit FeedbackReadingstartEvent();
    }

    function startUpdatingProposal()
        public
        onlyAdministrator
        onlyDuringFeedbackReading
    {
        uint256 maxVotePercentage = percent(
            gerPartywithMostVotes_voteCount(),
            eligibleVotersCount,
            10
        );

        if (maxVotePercentage > winByMajorityPercentarge) {
            // can not update proposals anymore, there is a party that has minimum of vote to win by majority
            // therefore state will change to talling votes, rather than updating proposals

            //copu=y of functin talling votes
            winningPartyId = 0;
            for (uint256 i = 0; i < parties.length; i++) {
                if (
                    partiesToNumberOfVotes[winningPartyId] <
                    partiesToNumberOfVotes[i]
                ) {
                    winningPartyId = i;
                }
            }

            winningPartyId_pub = winningPartyId;
            /////////////////////////

            state = State.TallingVotes;

            emit voteTaliedEvent(winningPartyId_pub);
            emit stateChangedEvent(
                State.StartReadingFeedbacks,
                State.TallingVotes
            );
            emit someOneWonBymajorityandCannotupdateanymoreEvent();

            //normal functionality
        } else {
            state = State.UpdatingProposals;
            emit stateChangedEvent(
                State.StartReadingFeedbacks,
                State.UpdatingProposals
            );
            emit UpdatingProposalsEvent();
        }
    }


    //############################################ start voting again ############################################//

    function startVotingAgain()
        public
        onlyAdministrator
        onlyDuringUpdatingProposal
    {
        // remove votes of candidates
        for (uint256 i = 0; i < parties.length; i++) {
            partiesToNumberOfVotes[i] = 0;
        }

        // remove votes of voters
        address tmp_adress;
        for (uint256 i = 0; i < votersArray.length; i++) {
            tmp_adress = votersArray[i];
            addressToVoter[tmp_adress].hasVoted = false;
            addressToVoter[tmp_adress].countofVotes = 0;
            addressToVoter[tmp_adress].VotedpartyId = 0;
        }
        // no one has voted
        hasVotedCount = 0;
        state = State.StaringVotingSession;
        emit stateChangedEvent(
            State.UpdatingProposals,
            State.StaringVotingSession
        );
        emit voitingSessionStartedEvent();
    }

    // revealing ruslt
    function tallingVotes()
        public
        onlyAdministrator
        onlyDuringEndingVotingSession
        eligiblAndHasVotedVotesCountShouldBeEqual
    {
        winningPartyId = 0;
        uint256 tmp = 0; //tie breaker
        for (uint256 i = 0; i < hasRegisteredPartyCount; i++) {
            if (
                partiesToNumberOfVotes[winningPartyId] <
                partiesToNumberOfVotes[i]
            ) {
                winningPartyId = i;
                continue;
            }

            if (
                partiesToNumberOfVotes[winningPartyId] ==
                partiesToNumberOfVotes[i]
            ) {
                if (winningPartyId != i) {
                    // anothet party with same number of voters found
                    tmp = i;
                }
            }
        }

        //tie break
        if (
            partiesToNumberOfVotes[tmp] ==
            partiesToNumberOfVotes[winningPartyId] &&
            (tmp != winningPartyId)
        ) {
            state = State.UpdatingProposals; // just to handle require modifier which encounter as we call talling vote in this phase, since votes of 2 party is equal we have to do voting session again
            startVotingAgain();
            // bayad dobare ray giri beshe vaghti raye do nafar barabar shod do ta aval dashtim

            //some measures bayad bere be ray giri dobare
            emit stateChangedEvent(
                State.EndingVotingSession,
                State.StaringVotingSession
            );
        } else {
            winningPartyId_pub = winningPartyId;

            state = State.TallingVotes;

            emit stateChangedEvent(
                State.EndingVotingSession,
                State.TallingVotes
            );
            emit voteTaliedEvent(winningPartyId_pub);
        }
    }
    //since solidity does not support float, wh have to implement something to calculate percentage of shares
    function percent(
        uint256 numerator,
        uint256 denominator,
        uint256 precision
    ) private pure returns (uint256 quotient) {
        // caution, check safe-to-multiply here
        uint256 _numerator = numerator * 10**(precision + 1);
        // with rounding of last digit
        uint256 _quotient = ((_numerator / denominator) + 5) / 10;
        return (_quotient);
    }

    //check majority will win or not, if there is party with votes more than majority, voting should be closed
    function gerPartywithMostVotes_voteCount() private returns (uint256) {
        winningPartyId = 0;
        for (uint256 i = 0; i < parties.length; i++) {
            if (
                partiesToNumberOfVotes[winningPartyId] <
                partiesToNumberOfVotes[i]
            ) {
                winningPartyId = i;
            }
        }

        return partiesToNumberOfVotes[winningPartyId];
    }


    //############################################ Getters ############################################//

    function getState() public view returns (State) {
        return state;
    }

    function isAdmin(address _address) public view returns (bool) {
        if (ballotAdminstrator == _address) return true;
        else return false;
    }

    function isRegisteredVoter(address _address) public view returns (bool) {
        return addressToVoter[_address].isRegistered;
    }

    function getEligibleVoterCound()
        public
        view
        onlyAfterTallingVotes
        returns (uint256)
    {
        return eligibleVotersCount;
    }

    function getHasVotedCount()
        public
        view
        onlyAfterTallingVotes
        returns (uint256)
    {
        return hasVotedCount;
    }

    function getHasRegisteredPartyCount() public view returns (uint256) {
        return hasRegisteredPartyCount;
    }

    //retreiving winner

    function getWiningPartyName()
        public
        view
        onlyAfterTallingVotes
        eligiblAndHasVotedVotesCountShouldBeEqual
        returns (string memory)
    {
        return parties[winningPartyId_pub].partyName;
    }

    function getWiningPartyDescription()
        public
        view
        onlyAfterTallingVotes
        eligiblAndHasVotedVotesCountShouldBeEqual
        returns (string memory)
    {
        return parties[winningPartyId_pub].description;
    }

    function getWiningPartyBroadMember()
        public
        view
        onlyAfterTallingVotes
        eligiblAndHasVotedVotesCountShouldBeEqual
        returns (string memory)
    {
        return parties[winningPartyId_pub].broadMembers;
    }

    function getWiningPartyVotesCount()
        public
        view
        onlyAfterTallingVotes
        eligiblAndHasVotedVotesCountShouldBeEqual
        returns (uint256)
    {
        return partiesToNumberOfVotes[winningPartyId_pub];
    }

    function getWiningPartyVotesPercentage()
        public
        view
        onlyAfterTallingVotes
        eligiblAndHasVotedVotesCountShouldBeEqual
        returns (uint256)
    {
        return
            percent(
                partiesToNumberOfVotes[winningPartyId_pub],
                hasVotedCount,
                10
            ) / 100000000;
    }

    // retrieving any party :
    // modifier mikhastam bezaram ama mani nadasht hame ja mitone yaro begire
    // ama ma farz mikonim fagaht dar lahze rayiri betone [vared nakardam]
    function getPartyName(uint256 _partyId)
        public
        view
        partyDoesExist(_partyId)
        returns (string memory)
    {
        return parties[_partyId].partyName;
    }

    
    function getParty(uint256 _partyId)
        public
        view
        partyDoesExist(_partyId)
        returns (Party memory)
    {
        return parties[_partyId];
    }


    function getPartyDescription(uint256 _partyId)
        public
        view
        partyDoesExist(_partyId)
        returns (string memory)
    {
        return parties[_partyId].description;
    }


    function getPartyBroadMember(uint256 _partyId)
        public
        view
        partyDoesExist(_partyId)
        returns (string memory)
    {
        return parties[_partyId].broadMembers;
    }


    function getPartyVotesCount(uint256 _partyId)
        public
        view
        onlyAfterTallingVotes
        partyDoesExist(_partyId)
        returns (uint256)
    {
        return partiesToNumberOfVotes[_partyId];
    }


    function getPartyVotesPercentage(uint256 _partyId)
        public
        view
        onlyAfterTallingVotes
        partyDoesExist(_partyId)
        returns (uint256)
    {
        return
            percent(partiesToNumberOfVotes[_partyId], hasVotedCount, 10) /
            100000000;
    }


    function getBallotName() public view returns (string memory) {
        return ballotName;
    }
}
