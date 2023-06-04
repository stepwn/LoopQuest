// Retrieve NFTs from localStorage
const nfts = JSON.parse(localStorage.getItem('nfts'));

// Use the retrieved NFTs as needed
console.log('Retrieved NFTs:', nfts);

const nftsContainer = document.getElementById('nfts-container');

nfts.forEach((nft) => {
  fetch('../shared/integratedNFTs.json')
    .then(response => response.json())
    .then(data => {
      const nftItem = data[nft];
      console.log(nftItem);
      if (nftItem.type == "skin") {
        const nftElement = document.createElement('img');
        nftElement.style.cursor = 'pointer';
        nftElement.style.width = '64px';
        nftElement.style.height = '64px';

        const spriteSheetPath = `img/2/${nftItem.sprite}`;

        // Create a new canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        let base64Data;
        // Create an image element to load the sprite sheet
        const image = new Image();
        image.onload = () => {
          // Draw the top left 64x64 pixel frame on the canvas
          ctx.drawImage(image, 0, 0, 64, 64, 0, 0, 64, 64);

          // Get the base64 representation of the canvas
          base64Data = canvas.toDataURL();

          // Set the base64 encoded image as the src of the img element
          nftElement.src = base64Data;
        };

        // Load the sprite sheet image
        image.src = spriteSheetPath;

        // Add an event listener to handle the click event
        nftElement.addEventListener('click', () => {
          document.getElementById('nameCharacter').style.display = 'block';
          document.getElementById('playerSelect').style.display = 'none';
          document.getElementById('selectedSkinShow').src = nftElement.src;
          document.getElementById('instructionsCharacter').src = nftElement.src;
          window.skin = nft;
        });

        nftsContainer.appendChild(nftElement);
      }
    })
    .catch(error => console.error('Error retrieving NFTs:', error));
});
