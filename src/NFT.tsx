import { Transaction } from "@mysten/sui/transactions";
import { Button, Container } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";
import { useState } from "react";
import axios from "axios";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// --- Configuration ---
const projectPackageId = import.meta.env.VITE_PROJECT_NFT_PACKAGE_ID || '0xc9c6b044a878bea54e8c2908fef5e1494a559f638347d3d3841f83b820172168';
const mintFunction = `${projectPackageId}::move_nft::mint_nft`;

export function MintNFT({ onCreated }: { onCreated?: (id: string) => void }) {
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    receiver: string;
    imageFile: File | null;
    url: string;
  }>({
    name: "",
    description: "",
    receiver: "",
    imageFile: null,
    url: "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      setForm(f => ({ ...f, imageFile: target.files![0] }));
    } else {
      const { name, value } = target;
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  async function create() {
    setIsProcessing(true);
    try {
      let uploadUrl = form.url;

      // 1. If the user selected a file, upload it directly via Filebase S3 SDK:
      if (form.imageFile) {
        const file = form.imageFile;
        const publisherUrl = import.meta.env.VITE_PUBLISHER_URL || "https://publisher.walrus-testnet.walrus.space"; // Make sure this env var is set
        const aggUrl = import.meta.env.VITE_AGG_URL || "https://aggregator.walrus-testnet.walrus.space";
        const epochs = 5;

        const formData = file; // file is already a Blob/File

        let response;
        try {
          response = await axios.put(
            `${publisherUrl}/v1/blobs?epochs=${epochs}`,
            formData,
            {
              headers: {
                "Content-Type": file.type || "application/octet-stream",
              },
            }
          );
        } catch (uploadErr) {
          console.error("Error uploading to Walrus API:", uploadErr);
          alert("Failed to upload image to Walrus API. See console for details.");
          setIsProcessing(false);
          return;
        }
        console.log("Upload response:", response.data);
        let blodId;        
        if(!response.data || !response.data.newlyCreated || !response.data.newlyCreated.blobObject) {
          blodId = response.data.alreadyCertified.blobId;
          uploadUrl = `${aggUrl}/v1/blobs/${blodId}`;
        }else{
          blodId = response.data.newlyCreated.blobObject.blobId;
          uploadUrl = `${aggUrl}/v1/blobs/${blodId}`;
        }
      }

      // 2. Build and send the mint transaction with the final URL:
      const mnemonic = import.meta.env.VITE_PUBLIC_MNE || "";
      const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
      const client = new SuiClient({ url: getFullnodeUrl("testnet") });
      const tx = new Transaction();
      tx.setSender(keypair.getPublicKey().toSuiAddress());
      tx.setGasBudget(10000000);
      tx.moveCall({
        target: mintFunction,
        arguments: [
          tx.pure.string(form.name),
          tx.pure.string(form.description),
          tx.pure.string(uploadUrl),
          tx.pure.address(form.receiver),
        ],
        typeArguments: [],
      });

      const { bytes, signature } = await tx.sign({ client, signer: keypair });
      const res = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showEffects: true },
        requestType: "WaitForLocalExecution",
      });
      setTxDigest(res.digest);
      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      alert(`Mint error: ${e}`);
      setLoading(false);
    }
  }

  return (
    <Container>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '12px' }}>
        <tbody>
          <tr>
            <td style={{ textAlign: 'right', width: '30%' }}><label>Name:</label></td>
            <td><input name="name" value={form.name} onChange={handleChange} style={{ width: '100%' }} /></td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right' }}><label>Description:</label></td>
            <td><textarea name="description" value={form.description} onChange={handleChange} style={{ width: '100%' }} /></td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right', width: '30%' }}><label>Receiver:</label></td>
            <td><input name="receiver" value={form.receiver} onChange={handleChange} style={{ width: '100%' }} /></td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right' }}><label>Image File:</label></td>
            <td><input type="file" accept="image/*" onChange={handleChange} /></td>
          </tr>
          <tr>
            <td style={{ textAlign: 'right' }}><label>Or Image URL:</label></td>
            <td><input name="url" value={form.url} onChange={handleChange} style={{ width: '100%' }} /></td>
          </tr>
        </tbody>
      </table>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button size="3" onClick={create} disabled={loading}>
          {loading ? <ClipLoader size={20} /> : "Mint Project NFT"}
        </Button>
      </div>
      <div>
      {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg flex flex-col items-center">
              <p className="text-gray-700">Processing transaction…</p>
            </div>
          </div>
      )}
      {txDigest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#132d5b] p-6 rounded-2xl shadow-xl flex flex-col items-center">
            <p className="text-white font-semibold mb-2">🎉 NFT Badge Minted!</p>
            <a
              href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-sm text-blue-200 mb-4"
            >
              View on Sui Explorer
            </a>
            <Button
              onClick={() => setTxDigest(null)}
              className="bg-white text-[#132d5b] px-6"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      </div>
    </Container>
  );
}
