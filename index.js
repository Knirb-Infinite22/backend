const { ethers } = require("ethers");
const brink = require("@brinkninja/sdk");
const artifact = require("./implementation.json");
const express = require('express')
var cron = require('node-cron');

const app = express()
const port = process.env.PORT || 3000

var corsAttr = new EnableCorsAttribute("*", "*", "*");
config.EnableCors(corsAttr);

const PRIVATE_KEY = "0ba6a014abf9f887bd1cb9c268df16e15cba6b91cc535be4970db489c5378168";
const implementation = new ethers.Contract(artifact.address, artifact.abi);
const signedMsgs = [];


app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/api/signedMsgs', (req, res) => {

    res.send(signedMsgs)
})

app.get('/api/signedMsgs/:message', (req, res) => {

    const message = signedMsgs.find(m => m.signedMessage.message === req.params.message);
    if (!message) return res.status(404).send('Signed message not found');
    else res.send(message);
})

app.get('/api/signerMsgs/:signer', (req, res) => {
    const signedMsgsBySigner = [];

    //const msg = signedMsgs.filter(m => m.signedMessage.signer === req.params.signer);
    signedMsgsBySigner.push(signedMsgs.filter(m => m.signedMessage.signer === req.params.signer));
    console.log(signedMsgsBySigner)

    if (signedMsgsBySigner.length == 0) return res.status(404).send('Signed messages not found for this signer', req.params.signer);
    else res.send(signedMsgsBySigner);
})

app.post('/api/signedMsg', (req, res) => {

    signedMsgs.push(req.body);
    res.send(req.body);
})

var task = cron.schedule('1 * * * * *', async () => {
    console.log("CRON");
    const signer = ethers.Wallet(PRIVATE_KEY);

    for (i = 0; i < signedMsgs.length; i++) {
        try {
            console.log("Trying new message");

            await submitOrder(signer, implementation.address, implementation.address, signedMsgs[i].data.data);

            signedMsgs.pop(signedMsgs[i])
        } catch (error) {
            console.error(error);
            // expected output: ReferenceError: nonExistentFunction is not defined
            // Note - error messages will vary depending on browser
        }
    }
});

task.start();

// Call to submit a new order object
async function submitOrder(signer, implementation, { signedMessage, data }) {
    const provider = ethers.provider;

    const account = brink.account(signer.address, { provider, signer });

    const test = await account.metaDelegateCall(signedMessage, [implementation.address, implementation.address, data.data]);
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})