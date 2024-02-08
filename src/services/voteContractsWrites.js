import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { decode } from "js-base64";
import { comdex } from '../config/network'
import { lockingContractAddress } from "./keplr";
import { KeplrWallet } from "./helper";

const customFees = {
    upload: {
        amount: [{ amount: "2000000", denom: "ucmdx" }],
        gas: "2000000",
    },
    init: {
        amount: [{ amount: "500000", denom: "ucmdx" }],
        gas: "500000",
    },
    exec: {
        amount: [{ amount: "500000", denom: "ucmdx" }],
        gas: "200000",
    },
    send: {
        amount: [{ amount: "80000", denom: "ucmdx" }],
        gas: "80000",
    },
}


export const transactionForVotePairProposal = async (address, productId, proposalId, extendedPairId, ratio, callback) => {

    const httpUrl = comdex?.rpc;
    let walletAddress = address;
    const handleMsg = {
        "vote_proposal":
        {
            "app_id": productId,
            "proposal_id": proposalId,
            "extended_pair": extendedPairId,
            "ratio": ratio,

        }
    };

    const [offlineSigner] = await KeplrWallet(comdex?.chainId);

    await SigningCosmWasmClient.connectWithSigner(
        httpUrl,
        offlineSigner)
        .then((client) => {
            client.signAndBroadcast(
                walletAddress,
                [{
                    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                    value: {
                        sender: walletAddress,
                        contract: lockingContractAddress,
                        msg: new TextEncoder().encode(JSON.stringify(handleMsg)),
                        funds: []
                    }
                }],
                customFees.exec,
            ).then((response) => {
                if (!response?.code) {
                    callback(null, response)
                }
                else {
                    console.log(response);
                    callback(response)

                }

            }).catch((err) => {
                console.log(err);
                callback(err)
            })
        }).catch((error) => {
            console.log(error);
            callback(error)
        });

}