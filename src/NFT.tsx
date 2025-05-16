import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Button, Container } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";
import { useState } from "react";

// --- Configuration ---
const projectPackageId = import.meta.env.VITE_PROJECT_NFT_PACKAGE_ID || '0x862549ecbb98d18411aa8c7159bf108928681dabac5e3d4d44d42ddd5f9a5c39';
const mintFunction = `${projectPackageId}::move_nft::mint_nft`;

export function MintNFT({ onCreated }: { onCreated?: (id: string) => void }) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [form, setForm] = useState({
    name: "",
    description: "",
    url: "",
    // imageFile: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target as HTMLInputElement;
    if ((e.target as HTMLInputElement).files) {
      setForm(f => ({ ...f, imageFile: (e.target as HTMLInputElement).files![0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  async function create() {
    setLoading(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: mintFunction,
        arguments: [
          tx.pure.string(form.name),
          tx.pure.string(form.description),
          tx.pure.string(form.url),
        ],
        typeArguments: [],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: ({ digest }) => {
            alert(`ProjectNFT minted! Tx: ${digest}`);
            onCreated?.(digest);
            setLoading(false);
          },
          onError: err => {
            console.error(err);
            alert(`Mint failed: ${err}`);
            setLoading(false);
          },
        }
      );
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
          {/* <tr>
            <td style={{ textAlign: 'right' }}><label>Image File:</label></td>
            <td><input type="file" accept="image/*" onChange={handleChange} /></td>
          </tr> */}
          <tr>
            <td style={{ textAlign: 'right' }}><label>Image URL:</label></td>
            <td><input name="url" value={form.url} onChange={handleChange} style={{ width: '100%' }} /></td>
          </tr>          
        </tbody>
      </table>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button size="3" onClick={create} disabled={loading}>
          {loading ? <ClipLoader size={20} /> : "Mint Project NFT"}
        </Button>
      </div>
    </Container>
  );
}
