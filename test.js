const axios=require('axios')
axios.post('https://www.opulentdistributionllc.com/api/v1/getAmazonOrderData', {amazon_buyer_account:'mikebuyer8@gmail.com'}).then((resp)=>{
    console.log('orders from response ----- ',resp.data.data);
});


// res(resp.data.data)