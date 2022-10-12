import { Web3Storage } from "web3.storage";
//web3.storage
function getAccessToken() {
  return process.env.WEB3_STORAGE_TOKEN;
}

function getFiles() {
  const fileInput = document.querySelector('input[type="file"]');
  console.log(fileInput.files);
  return fileInput.files;
}

function makeStorageClient() {
  return new Web3Storage({ token: getAccessToken() });
}
async function storeWithProgress(toUpload) {
  console.log("getting array from files");
  let files = Array.from(toUpload);
  // show the root cid as soon as it's ready
  const onRootCidReady = (cid) => {
    console.log("uploading files with cid:", cid);
  };

  // when each chunk is stored, update the percentage complete and display
  const totalSize = files.map((f) => f.size).reduce((a, b) => a + b, 0);
  let uploaded = 0;
  console.log(totalSize);
  const onStoredChunk = (size) => {
    uploaded += size;
    const pct = 100 * (uploaded / totalSize);
    console.log(`Uploading... ${pct.toFixed(2)}% complete`);
  };

  // makeStorageClient returns an authorized web3.storage client instance
  const client = makeStorageClient();

  // client.put will invoke our callbacks during the upload
  // and return the root cid when the upload completes
  return client.put(files, {
    onRootCidReady,
    onStoredChunk,
    //maxChunkSize: 1056789,
  });
}

async function retrieve(cid) {
  const client = makeStorageClient();
  const res = await client.get(cid);
  console.log(`Got a response! [${res.status}] ${res.statusText}`);
  if (!res.ok) {
    throw new Error(`failed to get ${cid}`);
  }

  // request succeeded! do something with the response object here...
}
export { storeWithProgress, retrieve };
