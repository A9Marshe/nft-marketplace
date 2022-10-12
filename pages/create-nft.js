/* pages/create-nft.js */
import { useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";
import { storeWithProgress } from "../utils/We3Storage";

import { marketplaceAddress } from "../Addressconfig.js";

import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState();
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const router = useRouter();

  async function onChange(e) {
    /* upload image to IPFS */
    const file = e.target.files;
    try {
      console.log("uploading file ", file[0]);
      setFileName(file[0].name);
      const cid = await storeWithProgress(file);
      console.log("uploaded file @: ", cid);
      console.log(`now fetching from IPFS:
       https://w3s.link/ipfs/${cid}/${file[0].name}`);
      const url = `https://w3s.link/ipfs/${cid}/${file[0].name}`;
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }
  async function uploadToIPFS() {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    /* first, upload metadata to IPFS */
    const data = {
      name,
      description,
      image: fileUrl,
    };
    try {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      let jsonFile = [new File([blob], "hello.json")];
      const cid = await storeWithProgress(jsonFile);
      console.log("Got this json CID", cid);
      console.log(`now fetching json from IPFS:
       https://w3s.link/ipfs/${cid}/hello.json`);
      const url = ` https://w3s.link/ipfs/${cid}/hello.json`;
      /* after metadata is uploaded to IPFS, return the URL to use it in the transaction */
      return url;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function listNFTForSale() {
    console.log("setting up transaction");
    const url = await uploadToIPFS();
    console.log(`imaged uploaded @ ${url}`);
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    /* create the NFT */
    const price = ethers.utils.parseUnits(formInput.price, "ether");
    let contract = new ethers.Contract(
      marketplaceAddress,
      NFTMarketplace.abi,
      signer
    );
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();
    let transaction = await contract.createToken(url, price, {
      value: listingPrice,
    });
    console.log("transaction started!");
    await transaction.wait();
    console.log("transaction complete!");
    router.push("/");
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        />
        <input
          placeholder="Asset Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, price: e.target.value })
          }
        />
        <input type="file" name="Asset" className="my-4" onChange={onChange} />
        {fileUrl && <img className="rounded mt-4" width="350" src={fileUrl} />}
        <button
          onClick={listNFTForSale}
          className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
        >
          Create NFT
        </button>
      </div>
    </div>
  );
}
