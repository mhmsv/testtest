//import 'node_modules/bulma/css/bulma.css'
import Head from 'next/head'
import web3 from "node_modules/web3"


import votingContractFunction from 'blockchain/voting.js'
import { useState, useEffect } from 'react'

import styles from "styles/homeBallot.module.css"
export const home = () => {

    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [state, setState] = useState(0);
    const [ballotName, setBallotName] = useState("")
    const [user, setUser] = useState("Wallet is not Connected")
    const [web3, setWeb3] = useState("");
    const [address, setAddress] = useState("")
    const [votingContract, setVotingContract] = useState("")
    const [newVoterAddress, setNewVoterAddress] = useState("");
    const [stateProgress, setStateProgress] = useState(0);
    const [proposalName, setProposalName] = useState("");
    const [proposalDescription, setProposalDescription] = useState("");
    const [vote, setVote] = useState("");
    const [commentTextField, setCommentTextField] = useState("")
    const [IdCommentTextField, setIdCommentTextField] = useState("")
    const [ReedingFeedbackIdTextField, setReedingFeedbackIdTextField] = useState("")
    const [UpdateProposalIdTeXtField, setUpdateProposalIdTeXtField] = useState("")
    const [UpdateProposalTextField, setUpdateProposalTextField] = useState("");


    ;  //default value -1 after redploying contrat 
    let ballotAdminstrator; // to handle count of proposals, 0 means 1 proposal array indexing to access parties[] array in solidity

    useEffect(() => {
        //before calling, check that voting contract is avaiable
        if (votingContract) getStateHandler()
        if (votingContract) getBallotNameHandler()
        if (votingContract && address) getuserHandler()
        cleanTables()


    }, [address, votingContract, state]) //whenever these changes, use effect will be called

    const getStateHandler = async () => {
        const state = await votingContract.methods.getState().call()
        setStateProgress(parseInt(state)) //for navbar progress
        switch (state) {
            case '0':
                state = "Ballot has been initiated"
                break;

            case '1':
                state = "Voters are being registered"
                break;

            case '2':
                state = "Proposals are being registered"
                break;

            case '3':
                state = "Proposal registeration has been end"
                break;

            case '4':
                state = "Voting Session is Open - Giving a feedback,"
                break;
            case '5':
                state = "Voting session is closed!"
                break;

            case '6':
                state = "Reading Feedbacks"

                break;
            case '7':
                state = "Updating Proposals"
                break;
            case '8':
                state = "Votes are Tallied"
        }

        setState(state);

    }
    const cleanTables = () => {
        document.getElementById("tableBody").innerHTML = ""
        document.getElementById("FeedbackBody").innerHTML = ""
        document.getElementById("tableBody").innerHTML = ""
        document.getElementById("winnerBody").innerHTML = ""
        document.getElementById("reportBody").innerHTML = ""
        document.getElementById("voterReport").innerHTML = ""

    }

    const getBallotNameHandler = async () => {

        const ballotName = await votingContract.methods.getBallotName().call()
        const winByMajorityPercentarge = await  votingContract.methods.winByMajorityPercentarge().call()
        setBallotName(ballotName);
        document.getElementById("majority").innerHTML = "Minimum consensus required to finish voting: >"+ winByMajorityPercentarge/100000000+"%"
    }

    const getuserHandler = async () => {

        try {
            //const accounts = await web3.eth.getAccounts()
            const isAdmin = await votingContract.methods.isAdmin(address).call()
            console.log("in omad " + address);

            if (isAdmin === true) {
                setUser("Admin")
            }
            //is admin == is regoitered , preventing deaclearing excess variable
            else {
                //console.log("call kard ba+" , address)

                isAdmin = await votingContract.methods.isRegisteredVoter(address).call()
                //console.log("call shod")
                if (isAdmin === true) {
                    setUser("Registered Voter")
                }

                else {
                    setUser("Undefined user")
                }
                setError("")


            }

        }
        catch (err) {
            console.log(err.message)
        }


    }

    //3 thing are essential web3 instance - account - contract instance
    const connectWallethandler = async () => {
        //document.getElementById("connectWalletButton").innerText="Connect wallet"

        //console.log("test :" , stateProgress , stateProgress == 7)
        // alert("walllet") check if metamask is avaialble
        if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
            try {
                //1request wallet to connect
                await window.ethereum.request({ method: "eth_requestAccounts" })
                //request web3 instance
                web3 = new Web3(window.ethereum)
                setWeb3(web3);
                console.log("metamask dare")
                //2get list of account
                const accounts = await web3.eth.getAccounts()
                setAddress(accounts[0])
                //console.log("resid inja")
                // 3ccreate contract local copy
                const vc = votingContractFunction(web3)
                setVotingContract(vc)
                if (votingContract) getStateHandler()
                if (votingContract && address) getuserHandler()
                setError("");
                setSuccessMsg(address + " wallet connected successfully! ")
                //document.getElementById("connectWalletButton").innerText="Wallet is Connected!"




            } catch (err) {
                setSuccessMsg("")
                //document.getElementById("connectWalletButton").innerText="Connect wallet"
                setError("Wallet is not connected! "+ err.message )
                setUser("");
                //console.log("omad to catch voter parid biron")

            }

        }
        else {
            console.log("please install a web3 wallet")
        }

    }

    const getProposalHandler = async () => {
        try {
            let tmp = "";
            let proposals = "";
            let proposalCount = await votingContract.methods.getHasRegisteredPartyCount().call()
            for (let i = 0; i < proposalCount; i++) {

                tmp = await votingContract.methods.parties(i).call()
                console.log("proposal id: ", tmp.partyId, " proposal name: ", tmp.partyName, "proposal description: ", tmp.description)
                proposals += "<tr>" + "<th>" + tmp.partyId + "</th><td>" + tmp.partyName + '</td><td>' + tmp.description + '</td><td> <a href="https://rinkeby.etherscan.io/address/' + tmp.partyCreatorAddress + '"' + '>' + tmp.partyCreatorAddress + '</a></td></tr>';
                console.log(" ke jam shode :", proposals)

                // table+= $(proposals.partyName)
                //     <tr>
                //     <th>id</th>

                //     <td>name</td>
                //     <td>description</td>
                //     <td><a href="https://en.wikipedia.org/wiki/Leicester_City_F.C." title="Leicester City F.C.">address</a> <strong>(C)</strong>
                //     </td>
                // </tr>

            }
            document.getElementById("tableBody").innerHTML = proposals
            //   document.getElementById("proposal").innerHTML= "<div>  <ul> <li>Name:fskjfdaddaskjfs ${proposals.partyId}</li></ul></div>"



        } catch (error) {
            setSuccessMsg("")
            setError(error.message)

        }

    }
    const getVotersReport = async () => {
        try {


            let hasVotedCount = await votingContract.methods.getHasVotedCount().call({
                from: address
            })
            let getEligibleVoterCound = await votingContract.methods.getEligibleVoterCound().call({
                from: address
            })


            let getHasRegisteredPartyCount = await votingContract.methods.getHasRegisteredPartyCount().call({
                from: address
            })


            let report = "<div>" + "<div> Number of users who have voted " + hasVotedCount + "</div><div>Number of total eligible voters " + getEligibleVoterCound + "</div><div> Number of registered proposals " + getHasRegisteredPartyCount +'</div></div>';
            //console.log("ino khond ", retrievedFeedbacks[i])


        
        document.getElementById("voterReport").innerHTML = report

            setError("")
            setSuccessMsg("Report retrieved successfully")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }
        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }

    }

    const getVotingReport = async () => {
        try {



            let tmp = "";
            let detail = "";
            let proposalCount = await votingContract.methods.getHasRegisteredPartyCount().call()
            for (let i = 0; i < proposalCount; i++) {

                let partyVotesCount = await votingContract.methods.getPartyVotesCount(i).call({
                    from: address
                })

                let getPartyVotesPercentage = await votingContract.methods.getPartyVotesPercentage(i).call({
                    from: address
                })
                tmp = await votingContract.methods.parties(i).call()
                //console.log("proposal id: ", tmp.partyId, " proposal name: ", tmp.partyName, "proposal description: ", tmp.description)
                detail += "<tr>" + "<th>" + tmp.partyId + "</th><td>" + tmp.partyName + '</td><td>' + partyVotesCount + '</td><td> ' + getPartyVotesPercentage + '%</td></tr>';
                console.log(" ke jam shode :", detail)

            }
            document.getElementById("reportBody").innerHTML = detail


            setError("")
            setSuccessMsg("Report retrieved successfully")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }
        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }
    }


    const beginVoterRegistrationHandler = async () => {
        try {
            await votingContract.methods.beginVoterRegistration().send({
                from: address
            })
            setError("")
            setSuccessMsg("State Successfully Changed To Voter Registeration")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }
        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }
    }

    const beginProposalegistrationHandler = async () => {
        try {
            await votingContract.methods.startingPartyRegistration().send({
                from: address
            })
            setError("")
            setSuccessMsg("State Successfully Changed To Party Registeration")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }
        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }
    }

    const endingProposalegistrationHandler = async () => {
        try {
            await votingContract.methods.endingPartyRegistration().send({
                from: address
            })
            setError("")
            setSuccessMsg("State Successfully Changed To End of party Registeration")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }
        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }
    }



    const startVotingSessionHandler = async () => {

        // handle to vote again or for the first time
        try {
            switch (stateProgress) {
                case 3:
                    console.log("first function of voting, normal voting session")
                    await votingContract.methods.startVotingSession().send({
                        from: address
                    })
                    break;


                case 7:
                    console.log("second function of voting,  voting again ")
                    await votingContract.methods.startVotingAgain().send({
                        from: address
                    })
                    break;

                default:
                    console.log("haminjori gozashtim, reject mishe ghatan in transaction")
                    await votingContract.methods.startVotingAgain().send({
                        from: address
                    })


            }
            setError("")
            setSuccessMsg("State Successfully Changed To begining of voting session")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }



        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }
    }


    const endVotingSessionHandler = async () => {
        try {
            await votingContract.methods.endVotingSession().send({
                from: address
            })
            setError("")
            setSuccessMsg("State Successfully Changed To end of voting session")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }
        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }
    }

    const startReadingFeedbacksHandler = async () => {
        try {
            await votingContract.methods.startReadingFeedbacks().send({
                from: address
            })
            setError("");
            setSuccessMsg("State Successfully changed to Reading Feedbacks")
            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()

        } catch (error) {
            setSuccessMsg("")
            setError(error.message)

        }
    }

    const startUpdatingProposalHandler = async () => {


        try {

            await votingContract.methods.startUpdatingProposal().send({
                from: address
            })

            const state_tmp = await votingContract.methods.getState().call()


            if (state_tmp == 7) {
                console.log("hanoz kasi naborde")

                setError("");
                setSuccessMsg("State Successfully changed to Updating Feedbacks")

            }

            if (state_tmp == 8) {

                console.log("yeki bord")

                setError("");
                setSuccessMsg("State  changed to Talling vote, there is a proposal that has voters more than a majority, therefore there is no need to update current proposals")

            }

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()

        }

        catch (error) {

            setSuccessMsg("")
            setError(error.message)
        }
    }

    const tallingVotes = async () => {

        try {
            await votingContract.methods.tallingVotes().send({
                from: address
            })
            const state_tmp = await votingContract.methods.getState().call()


            if (state_tmp == 8) {
                console.log("tallied")
                setError("");
                setSuccessMsg("State Successfully changed to Talling votes")
                if (votingContract) getStateHandler()
                if (votingContract && address) getuserHandler()
            }

            if (state_tmp == 7 | state_tmp == 4) {
                console.log("dobare vote")
                setError("");
                setSuccessMsg("There are  proposals with same count of votes, voting session should be done again, state automatically changed to begining of voting session")
                if (votingContract) getStateHandler()
                if (votingContract && address) getuserHandler()
            }

        } catch (error) {

            setSuccessMsg("")
            setError(error.message)
        }

    }


    // const startVotingAgainHandler = async () => {
    //     try {
    //         await votingContract.methods.startVotingAgain().send({
    //             from: address
    //         })
    //         setError("")
    //         setSuccessMsg("State Successfully Changed To begining of voting session")

    //         if (votingContract) getStateHandler()
    //         if (votingContract && address) getuserHandler()
    //     }
    //     catch (e) {
    //         setSuccessMsg("")

    //         setError(e.message)
    //     }


    // }




    const registerVoterHandler = async () => {
        try {
            if (address) {
                await votingContract.methods.registerVoter(newVoterAddress.valueOf()).send({
                    from: address
                }
                )
            }
            setError("")
            setSuccessMsg(newVoterAddress + ' Voter address Registered Successfully')

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }


        catch (e) {
            setSuccessMsg('')
            setError(e.message)
        }

    }

    const UpdateNewAddressTextField = event => {

        setNewVoterAddress(event.target.value)
        console.log("addresi ke neveshte : ", newVoterAddress)

    }

    const doVoteHandler = async () => {
        try {
            if (address) {
                await votingContract.methods.vote(vote).send({
                    from: address
                }
                )
                setError("")
                setSuccessMsg("address " + address + " voted "  + " successfully!")
            }

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }


        catch (error) {
            setSuccessMsg("")
            setError(error.message)

        }
    }

    const ChangeVoteHandler = async () => {
        try {
            if (address) {
                await votingContract.methods.changeVote(vote).send({
                    from: address
                }
                )
                setError("")
                setSuccessMsg(address + " changed its vote to proposal " + vote + " successfully!")
            }

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }


        catch (error) {
            setSuccessMsg("")
            setError(error.message)

        }

    }

    const RemoveVoteHandler = async () => {
        try {
            if (address) {
                await votingContract.methods.removeVote().send({
                    from: address
                }
                )
                setError("")
                setSuccessMsg(address + " removed its vote succsessfully!")
            }

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }


        catch (error) {
            setSuccessMsg("")
            setError(error.message)

        }

    }

    const UpdateVoteTextFiels = event => {
        setVote(event.target.value)
        //console.log("mikhad be in ray bede :", vote)
    }

    const doFeedbackHandler = async () => {

        try {
            if (address) {
                await votingContract.methods.makeComment(commentTextField, IdCommentTextField).send({
                    from: address
                }
                )
                setError("")
                setSuccessMsg(address + " gived its feedback to proposal " + IdCommentTextField + " successfully!")
            }

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }


        catch (error) {
            setSuccessMsg("")
            setError(error.message)

        }

    }
    const UpdateCommentTextField = event => {
        setCommentTextField(event.target.value)
        console.log("mikhad bege : ", commentTextField)
    }

    const UpdateIdCommentTextField = event => {
        setIdCommentTextField(event.target.value)
        //console.log("mikhad be id "+IdCommentTextField+" nazar bede")
    }


    const getProposalFeedbackHandler = async () => {
        try {
            console.log(address, " is trying to read feedbacls of ", ReedingFeedbackIdTextField, "typesh:", typeof parseInt(ReedingFeedbackIdTextField))

            let retrievedFeedbacks = await votingContract.methods.getFeddbacks(ReedingFeedbackIdTextField).call({
                from: address
            })
            console.log("inaro feedback gereftam:  ", retrievedFeedbacks)
            setError("")
            setSuccessMsg("Feedbacks of proposal " + ReedingFeedbackIdTextField + " retrieved successfully!")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()

            let feedbacks = ""
            for (let i = 0; i < retrievedFeedbacks.length; i++) {
                if (retrievedFeedbacks[i] != undefined)
                    feedbacks += "<tr>" + "<th>" + i + "</th><td>" + retrievedFeedbacks[i] + '</td></tr>';
                console.log("ino khond ", retrievedFeedbacks[i])


            }
            document.getElementById("FeedbackBody").innerHTML = feedbacks
        }
        catch (error) {
            setSuccessMsg("")
            setError("Can not retrieve feedbacks of this proposal, because: " + error.message)
        }
    }

    const UpdateReedingFeedbackIdTextField = event => {
        setReedingFeedbackIdTextField(event.target.value)
        console.log("id ro mikhad feedback begire " + ReedingFeedbackIdTextField)
    }

    const registerNewProposalHandler = async () => {

        try {
            if (address) {
                await votingContract.methods.registerParty(proposalName, proposalDescription, "").send({
                    from: address
                }
                )
                setError("")
                setSuccessMsg(proposalName + " Proposal Registered Successfully")
                //proposalCount = proposalCount + 1;
            }

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }


        catch (e) {
            setSuccessMsg('')
            setError(e.message)
        }

    }
    const UpdateProposalNameTextField = event => {

        try {
            setProposalName(event.target.value)
            //console.log("proposal name ei ke neveshte : ", proposalName)
        }
        catch (e) { console.log(e.message) }

    }

    const UpdateProposalDescriptionTextField = event => {
        try {
            setProposalDescription(event.target.value)
            //console.log("proposal descriptioni ke neveshte : ", proposalDescription)
        }

        catch (e) { console.log(e.message) }

    }

    const updateProposalHandler = async () => {
        try {
            await votingContract.methods.updateProposal(UpdateProposalIdTeXtField, UpdateProposalTextField).send({
                from: address
            })

            setError("")
            setSuccessMsg("Proposal" + UpdateProposalIdTeXtField + " description updated successfully!")
            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }
        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }


    }

    const UpdateUpdateProposalIDTextField = event => {
        try {
            setUpdateProposalIdTeXtField(event.target.value)
            //console.log("proposal id ke mikhad update beshe : ", UpdateProposalIdTeXtField)
        }

        catch (e) { console.log(e.message) }

    }

    const UpdateUpdateProposalTextField = event => {
        try {
            setUpdateProposalTextField(event.target.value)
            //console.log("proposal jadid mikhad beshe : ", UpdateProposalTextField)
        }

        catch (e) { console.log(e.message) }

    }

    const getWinnerReport = async () => {
        try {



            let getWiningPartyVotesCount = await votingContract.methods.getWiningPartyVotesCount().call({
                from: address
            })

            let getWiningPartyVotesPercentage = await votingContract.methods.getWiningPartyVotesPercentage().call({
                from: address
            })
            let getWiningPartyDescription = await votingContract.methods.getWiningPartyDescription().call({
                from: address
            })


            let getWiningPartyName = await votingContract.methods.getWiningPartyName().call({
                from: address
            })

            let getEligibleVoterCound = await votingContract.methods.getEligibleVoterCound().call({
                from: address
            })

            let getHasVotedCount = await votingContract.methods.getHasVotedCount().call({
                from: address
            })

            let winnerDetail = "<tr>" + "<th>" + getWiningPartyName + "</th><td>" + getWiningPartyDescription + '</td><td>' + getWiningPartyVotesCount + '</td><td> ' + getWiningPartyVotesPercentage + '% </td><td>' + getHasVotedCount + '</td><td>' + getEligibleVoterCound + '</td></tr>';
            document.getElementById("winnerBody").innerHTML = winnerDetail
            setError("")
            setSuccessMsg("Report retrieved successfully")

            if (votingContract) getStateHandler()
            if (votingContract && address) getuserHandler()
        }
        catch (e) {
            setSuccessMsg("")

            setError(e.message)
        }
    }





    // const getEligibleVotersCount =  async() => {
    //     let foo = await votingContract.methods.ballotName().call()
    //     console.log("fooooo : ", foo)  
    //     return foo 
    // }



    return (
        <div className={styles.main}>

            <Head>

                <title>SBU Voting DAPP</title>
                <meta name="description" content="a blockchain voting app" />
                {/* <Script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></Script> */}


                {/* <script src="https://kit.fontawesome.com/6990b993ca.js" crossorigin="anonymous"></script> */}
            </Head>


            {/* 
            <nav className="breadcrumb is-centered" aria-label="breadcrumbs" >
                <ul>
                    <li><a href="">Admin page
                    </a>
                    </li>
                    <li><a href="#">Admin Page</a></li>
                    <li><a href="/voter">Voter page</a></li>
                    <li><a href="#">Proposal Page</a></li>
                    <li className="is-active"><a href="#" aria-current="page">Breadcrumb</a></li>
                </ul>
            </nav> */}




            <nav className="navbar mt-4 mb-4 ">
                <div className='container'>
                    <div className='navbar-brand'>
                        <h1 className=''>Blockchain Voting Dapp</h1>
                    </div>

                    <div className='navbar-end'>
                        <button id='connectWalletButton'className='button is-primary' onClick={connectWallethandler}>Connect Wallet</button>
                    </div>
                </div>
            </nav>


            <section>

                <div className='container'>
                    <h1>Ballot Name: {ballotName} </h1>
                    <h2 id='majority'></h2>
                    <h2>Current User: {user}</h2>
                    <h2>Current State: {state} </h2>
                </div>

            </section>

            <section>
                <div className='container has-text-danger'>
                    <p>{error}</p>
                </div>
            </section>

            <section>
                <div className='container has-text-success'>
                    <p>{successMsg}</p>
                </div>
            </section>

            <div className='container mt-3'>
                <div className='field'>

                    <label className='label'>Register Voter</label>
                    <div className='control'>
                        <input onChange={UpdateNewAddressTextField} className='input' type='type' placeholder='Enter an Ethereum address to Register'></input>
                    </div>
                    <button onClick={registerVoterHandler} className='button is-primary mt-2'>Register Voter</button>
                </div>
            </div>
            <hline></hline>
            <div className='container mt-3'>
                <div className='field'>

                    <label className="label"> Proposal Name</label>
                    <div className="control">
                        <input onChange={UpdateProposalNameTextField} className="input" type="input" placeholder="Enter Your Proposal Name"></input>
                    </div>

                    <label className='label'>Register New Proposal</label>
                    <div className='control'>
                        <input onChange={UpdateProposalDescriptionTextField} className='input' type='type' placeholder='Enter your Proposal'></input>
                    </div>
                    <button onClick={registerNewProposalHandler} className='button is-primary mt-2'>Register Proposal</button>
                </div>
            </div>



            <div className='container mt-3'>
                <div className='field'>

                    <label className="label"> Voting Proposal ID</label>
                    <div className="control">
                        <input onChange={UpdateVoteTextFiels} className="input" type="input" placeholder="Enter Your Desired Proposal ID"></input>
                        <button onClick={doVoteHandler} className='button is-primary mt-4 mr-4 mb-4'>Vote</button >
                        <button onClick={RemoveVoteHandler} className='button is-primary mt-4 mr-4 mb-4'>Remove Vote</button >
                        <button onClick={ChangeVoteHandler} className='button is-primary mt-4 mr-4 mb-4'>Change Vote</button >

                    </div>

                    <label className='label'>Giving Feedback</label>
                    <div className='control'>
                        <textarea onChange={UpdateCommentTextField} className="textarea" type='type' placeholder='if you wish you could give a feedbak to proposals'>

                        </textarea>
                        <input onChange={UpdateIdCommentTextField} placeholder='ID' className='is-small input' type="text"></input>

                    </div>
                    <button onClick={doFeedbackHandler} className='button is-primary mt-2'>Give A feedback to Proposal</button >
                </div>
            </div>

            <div className='container mt-3'>
                <label className='label'>Updating Proposal</label>

                <textarea onChange={UpdateUpdateProposalTextField} className="textarea" type='type' placeholder='if you wish you could give a feedbak to proposals'>

                </textarea>
                <input onChange={UpdateUpdateProposalIDTextField} placeholder='Proposal ID' className='is-small input' type="text"></input>
                <button onClick={updateProposalHandler} className='button is-primary mt-2'>Update Proposal</button >

            </div>




            <nav className="navbar" role="navigation" aria-label="main navigation mt-5">
                <div className="navbar-brand is-hoverable">
                    <div className="navbar-item">
                    </div>
                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={beginVoterRegistrationHandler}>Start Voters Registeration</button>
                        </div>
                    </div>
                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={beginProposalegistrationHandler}>Start Proposal Registeraton</button>
                        </div>
                    </div>
                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={endingProposalegistrationHandler}>End Proposal Registeration</button>
                        </div>
                    </div>

                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={startVotingSessionHandler}>Start Voting Session</button>
                        </div>
                    </div>

                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={endVotingSessionHandler}>End Voting Session</button>
                        </div>
                    </div>

                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={startReadingFeedbacksHandler}>Start Reading Feedbacks</button>
                        </div>
                    </div>

                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={startUpdatingProposalHandler}>Start Updating Proposals</button>
                        </div>
                    </div>
                    {/* 
                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={startVotingAgainHandler}>Start Voting Again</button>
                        </div>
                    </div> */}


                    <div className="navbar-item">
                        <div className="buttons is-small">
                            <button className="button is-primary is-outlined" onClick={tallingVotes}>Talling Votes</button>
                        </div>
                    </div>
                </div>
            </nav>
            <progress className="progress is-primary" value={((stateProgress + 1) / 9 * 100)} max="100">15%</progress>




            <section className='container mt-4 mb-4'>
                <div className="columns ml-3">
                    <div className="column ml-3">
                        <button onClick={getProposalHandler} className="button is-primary is-light">Get Proposals</button>
                    </div>
                    <div className="column ml-3">
                        <button onClick={getProposalFeedbackHandler} className="button is-primary is-light">Feedback<input onChange={UpdateReedingFeedbackIdTextField} placeholder='ID' className='is-small input ml-3' type="text"></input>
                        </button>



                    </div>
                    {/* <div className="column ml-3">
                        <button onClick={getProposalFeedbackHandler} className="button is-primary is-light">Party Details<input onChange={UpdateReedingFeedbackIdTextField} placeholder='ID' className='is-small input ml-3' type="text"></input>
                        </button>
                    </div> */}

                    <div className="column ml-3">

                        <button onClick={getVotersReport} className="button is-primary is-light">Voters Report
                        </button>                         </div>
                    <div className="column ml-3">
                        <button onClick={getVotingReport} className="button is-primary is-light">Voting Report
                        </button>
                    </div>
                    <div className="column ml-3">                        <button onClick={getWinnerReport} className="button is-primary is-light">Winner Report</button>
                    </div>
                </div>

            </section>


            <section className='columns is-centered is-primary' >


                <table id='tablehead' className="table is-hoverable is-bordered ">
                    <thead>
                        <tr>
                            <th>Proposal ID</th>
                            <th>Proposal Name</th>
                            <th>Proposal Description</th>
                            <th>Proposal Creator Address</th>
                        </tr>
                    </thead>
                    <tbody id='tableBody'>
                    </tbody>            </table>
            </section>


            <section className='columns is-centered is-primary mt-5 mb-5 is-bordered' >


                <table id='feedbackHead' className="table is-hoverable is-bordered ">
                    <thead>
                        <tr>
                            <th>Number</th>
                            <th>Feedback </th>

                        </tr>
                    </thead>
                    <tbody id='FeedbackBody'>
                    </tbody>            </table>


            </section>


            <section className='columns is-centered is-primary'  >


                <table id='reportHead' className="table is-hoverable is-bordered ">
                    <thead>
                        <tr>
                            <th>Proposal ID</th>
                            <th>Proposal Name</th>
                            <th>Proposal's Vote</th>
                            <th>Proposal's Share</th>

                        </tr>
                    </thead>
                    <tbody id='reportBody'>
                    </tbody>            </table>
            </section>

            <section className='columns is-centered is-primary' >


                <table id='winnerHead' className="table is-hoverable is-bordered mt-5 mb-5">
                    <thead>
                        <tr>
                            <th>Proposal Name</th>
                            <th>Proposal Description</th>
                            <th>Proposal's Vote</th>
                            <th>Proposal's Share</th>
                            <th>Total participants of voting</th>
                            <th>Number of elgible individuals</th>


                        </tr>
                    </thead>
                    <tbody id='winnerBody'>
                    </tbody>            </table>
            </section>

            <section className='columns is-centered is-primary'>

            <article className="message is-primary">
  <div className="message-header">
    <p>Report</p>
  </div>
  <div id='voterReport' className="message-body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur. Aenean ac <em>eleifend lacus</em>, in mollis lectus. Donec sodales, arcu et sollicitudin porttitor, tortor urna tempor ligula, id porttitor mi magna a neque. Donec dui urna, vehicula et sem eget, facilisis sodales sem.
  </div>
</article>
                <div ></div>
            </section>



        </div>

    )
}

export default home;