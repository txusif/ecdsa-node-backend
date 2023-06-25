const express = require('express');
const cors = require('cors');
const { secp256k1 } = require('ethereum-cryptography/secp256k1');
const { hexToBytes, toHex } = require('ethereum-cryptography/utils');
const { keccak256 } = require('ethereum-cryptography/keccak');

const app = express();
const port = process.env.PORT || 3042;

app.use(cors());
app.use(express.json());

const balances = {
	// private key: 07b45b5b4e324bab537617d7e788e73bdffdae5f9cb5f5b7414105cf5badbb4c
	// public key: 03478be8e98c2349c4aa13f8873f0a922b838335265ddf989764273ca720126cce
	'1873466fc94065b9f33aa5bcd7fbaf6577239eda': 100,

	// private key: fd65ea0e8ec1322a5b2dcec24f60f3cbe75021e4647e88102b229cbcde110431
	// public key: 037628fa94c72bf79283ffab1317f56cd506c091d0fe7ccef18f7ca0f6a3341571
	'5657458397246847f13cdd3e7fcd4c6ace49ff2b': 50,

	// private key: 7a4ca0a4e2750fa1643855261a336a615f3f1a440fa621a2de44c46545ab7863
	// public key: 02d451410723692057316bb4ca477f7eb97a5ed54ba2b7dbec700aa55812e6dcf2
	'c97ade9ec75fb015121e9383ce16c54be6c73dd1': 75
};

app.get('/balance/:address', (req, res) => {
	const { address } = req.params;
	const balance = balances[address] || 0;
	res.send({ balance });
});

app.post('/send', (req, res) => {
	const { signature, senderPublicKey, intentMessageHash, amount, recipient } = req.body;
	let sig = JSON.parse(signature);

	console.log(`Signature: ${signature}`);
	console.log(`Sender's Public key: ${senderPublicKey}`);
	console.log(`Transaction Amount: ${amount}`);
	console.log(`Recipient Address: ${recipient}`);
	console.log(`Message Hash: ${intentMessageHash}`);

	sig.r = BigInt(sig.r);
	sig.s = BigInt(sig.s);
	if (!secp256k1.verify(sig, intentMessageHash, senderPublicKey)) {
		res.status(400).send({ message: `Invalid Transaction` });
	}

	const publicKeyBytes = hexToBytes(senderPublicKey);
	const sender = toHex(keccak256(publicKeyBytes.slice(1)).slice(-20));
	console.log(`Sender's Address: ${sender}`);

	setInitialBalance(sender);
	setInitialBalance(recipient);

	if (balances[sender] < amount) {
		res.status(400).send({ message: 'Not enough funds!' });
	} else {
		balances[sender] -= amount;
		balances[recipient] += amount;
		res.send({ balance: balances[sender] });
	}
});

app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
	if (!balances[address]) {
		balances[address] = 0;
	}
}