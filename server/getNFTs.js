const axios = require('axios');

axios.get('https://looppress.io/wp-json/looppress/v1/nfts/123')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });