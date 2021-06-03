// require('dotenv').config({ path: `../.env` });
require('events').EventEmitter.defaultMaxListeners = 15;
const useProxy = require('puppeteer-page-proxy');
const puppeteer = require("puppeteer");
const Service = require('../server/service/service');
var userAgent = require('user-agents');
const axios = require('axios');
var FormData = require('form-data');
const path = require('path');
const moment = require('moment');
const logger = require('../logger/logger');
const orderIdlogger = require('../logger/orderIdLogger');

const captchaSolver = async (page) => {
    try {
        console.log('resolving captcha ----- ')
        await page.setUserAgent(userAgent.toString());
        await page.waitForTimeout(2000);
        if (await page.$('.a-box-inner .a-row.a-text-center')) {
            console.log('captch calling.......');
            const captchaData = await page.evaluate(() => {
                const captchaImgEl = document.querySelectorAll('.a-box-inner .a-row.a-text-center');
                if (captchaImgEl && captchaImgEl.length > 0) {
                    let captchaImgUrl = captchaImgEl[0].children[0].src;
                    return new Promise(res => {
                        fetch(captchaImgUrl).then(res => res.blob()).then(blob => {
                            var reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = function () {
                                var base64data = reader.result;
                                res(base64data);
                            }
                        })
                    })
                }
            })
            console.log(captchaData.substring(1, 30), "....captchaData")
            var bodyFormData = new FormData();
            console.log('captcha API key ----- ','e5b71c604308ec55d002a5dae309bc2c')
            bodyFormData.append('key', 'e5b71c604308ec55d002a5dae309bc2c');
            bodyFormData.append('method', 'base64');
            bodyFormData.append('body', captchaData);
            bodyFormData.append('json', 1);
            const { data: capRequestData } = await axios({
                method: "post",
                url: "http://2captcha.com/in.php",
                data: bodyFormData,
                headers: {
                    ...bodyFormData.getHeaders()
                }
            })
            await page.waitForTimeout(15000);
            console.log('capRequestData--------', capRequestData);
            //const orders=Service.sendPostRequest()
            let captchaResponse
            while (1) {
                await page.waitForTimeout(5000);
                captchaResponse = await axios({
                    url: "http://2captcha.com/res.php",
                    params: {
                        key:'e5b71c604308ec55d002a5dae309bc2c',
                        action: "get",
                        id: capRequestData.request,
                        json: 1
                    }
                })
                captchaResponse = captchaResponse.data
                console.log(captchaResponse, "captchaResponse")
                if (captchaResponse && captchaResponse.request === "CAPCHA_NOT_READY") {
                    continue;
                } else {
                    break;
                }
            }
            //await page.waitForTimeout(5000);
            await page.evaluate((captchaResponse) => {
                let inputSlector = document.querySelectorAll('#captchacharacters');
                inputSlector[0].value = captchaResponse.request;
                let button = document.querySelectorAll('.a-button-text');
                console.log(button.length);
                button[0].click()
            }, captchaResponse);
        } else {
            return;
        }
    } catch (error) {
        console.log('error.captch---', error);
    }
}

const secondCaptchaSolver = async (page) => {
    try {
        await page.setUserAgent(userAgent.toString());
        await page.waitForTimeout(2000);
        if (await page.$('#auth-captcha-image-container')) {
            console.log('captch calling.......');
            const captchaData = await page.evaluate(() => {
                const captchaImgEl = document.querySelectorAll('#auth-captcha-image-container');
                if (captchaImgEl && captchaImgEl.length > 0) {
                    let captchaImgUrl = captchaImgEl[0].children[0].src;
                    return new Promise(res => {
                        fetch(captchaImgUrl).then(res => res.blob()).then(blob => {
                            var reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = function () {
                                var base64data = reader.result;
                                res(base64data);
                            }
                        })
                    })
                }
            })
            console.log(captchaData.substring(1, 30), "....captchaData")
            var bodyFormData = new FormData();
            bodyFormData.append('key', 'e5b71c604308ec55d002a5dae309bc2c');
            bodyFormData.append('method', 'base64');
            bodyFormData.append('body', captchaData);
            bodyFormData.append('json', 1);
            const { data: capRequestData } = await axios({
                method: "post",
                url: "http://2captcha.com/in.php",
                data: bodyFormData,
                headers: {
                    ...bodyFormData.getHeaders()
                }
            })
            await page.waitForTimeout(15000);
            console.log('capRequestData--------', capRequestData);
            let captchaResponse
            while (1) {
                await page.waitForTimeout(5000);
                captchaResponse = await axios({
                    url: "http://2captcha.com/res.php",
                    params: {
                        key: 'e5b71c604308ec55d002a5dae309bc2c',
                        action: "get",
                        id: capRequestData.request,
                        json: 1
                    }
                })
                captchaResponse = captchaResponse.data
                console.log(captchaResponse, "captchaResponse")
                if (captchaResponse && captchaResponse.request === "CAPCHA_NOT_READY") {
                    continue;
                } else {
                    break;
                }
            }
            await page.evaluate((captchaResponse) => {
                let inputSlector = document.querySelectorAll('#auth-captcha-guess');
                inputSlector[0].value = captchaResponse.request;
                let button = document.querySelectorAll('#signInSubmit');
                console.log(button.length);
                button[0].click()
            }, captchaResponse);
        } else {
            return;
        }
    } catch (error) {
        console.log('secondCaptcha------', error);
    }
}

const otpResolver = async (page,result) => {
    try {
        let res = await axios({
            method: 'post',
            url: 'https://otp.opulentdistributionllc.com/sample/getDatas.php',
            data: {
                "secret": result['otp_secret_key']
            }
        });
        if (res && res.data) {
            let optCode = res.data.token;
            console.log('optCode--------', optCode);
            await page.waitForTimeout(4000);
            await page.evaluate(() => {
                //auth-send-code  continue
                let stepVerification = document.querySelectorAll('#auth-send-code');
                if (stepVerification && stepVerification.length > 0) {
                    stepVerification[0].click();

                }
            });
            //await page.waitForTimeout(4000);
            await page.waitForNavigation({ waitUntil: 'load' })
            await page.evaluate(async (optCode) => {
                //.a-input-text.a-span12.cvf-widget-input.cvf-widget-input-code
                let enterOtp = document.querySelectorAll('#auth-mfa-otpcode');
                console.log(enterOtp.length);
                if (enterOtp && enterOtp.length > 0) {
                    enterOtp[0].value = optCode;
                    // document.querySelectorAll('#auth-signin-button')[0].click();
                    document.querySelectorAll('.a-button-input')[0].click();
                }
            }, optCode)
        }

    } catch (error) {
        console.log('opt error----------', error);
    }
}

const saveErrorImg = async (page) => {
    try {
        let date = new Date();
        date = moment(date, "YYYY-MM-DD,hh:mm A").format('YYYY-MM-DD,hh:mm A');
        let imageName = date + ".jpg";
        let imagePath = path.join(__dirname, "..", "/assets", `/${imageName}`);
        await page.screenshot({ path: imagePath });
    } catch (error) {
        console.log('error-----', error);
        logger.error({ message: error })
    }
}

const get_proxy = async (asin, purchaseOrderId, customerOrderId, result, pageIndex, orderPrice) => {
    let valid_curl=''
    console.log('while ip loop ---')
    while(1){
        gimmi_response = await axios({
            method:'get',
            url:'https://gimmeproxy.com/api/getProxy?api_key=514b2f69-76d5-4458-b667-2227c1f7b29e&country=US'
        })
        if(gimmi_response && gimmi_response.data && gimmi_response.data.websites.amazon == true && parseFloat(gimmi_response.data.speed)>200 && gimmi_response.data.supportsHttps == true){
            console.log(gimmi_response.data)
            // if(gimmi_response.data.protocol == 'http'){
            //     valid_curl=gimmi_response.data.ipPort
            // }
            // else{
            //     valid_curl=gimmi_response.data.curl
            // }
            valid_curl=gimmi_response.data.curl
            if(valid_curl.includes('<br>')){
                valid_curl=valid_curl.slice(0,valid_curl.length-4)
            }
            console.log('valid curl ---- ',valid_curl)
            break
        }
        
    }
    purchaseProduct(valid_curl,asin, purchaseOrderId, customerOrderId, result, pageIndex, orderPrice)
}
const purchaseProduct = async (curl,asin, purchaseOrderId, customerOrderId, result, pageIndex, orderPrice) => {
    let amazonProductPrice = 0, details = {}, amazonOrderNumber = '';
    // '--proxy-server='+curl,
    const browser = await puppeteer.launch({
        headless: true,
        timeout: 0,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-web-security',  
            '--proxy-server='+curl,
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-dev-shm-usage'
        ]
    });
    // let productViewPage = 'page_' + pageIndex;
    let productViewPage = await browser.newPage();
    try {
        // await productViewPage.setRequestInterception(true);
        // productViewPage.on('request', (req) => {
        //     if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
        //         req.abort();
        //     }
        //     else {
        //         req.continue();
        //     }
        // });
        //console.log('-result-------------',result);
        productViewPage.setDefaultNavigationTimeout(0);
        await productViewPage.setViewport({ width: 1366, height: 700 });
        let platefromUrl = 'https://www.amazon.com/dp/' + asin;
        console.log('product asin ---- ',asin)
        // try {
        //     await useProxy(productViewPage, curl);
        //     // await productViewPage.setRequestInterception(true);
        //     // productViewPage.on('request', async req => {
        //     //     await useProxy(req, curl);
        //     // });
        //     const data = await useProxy.lookup(productViewPage);
        //     console.log('pageIP ------- ',data.ip);
        // } catch (error) {
        //     console.log(error)
        // }
        //await productViewPage.setRequestInterception(true);
        console.log('url to visit ----- ',platefromUrl)
        await productViewPage.goto(platefromUrl, {
            waitUntil: 'load', timeout: 0
        });
        await captchaSolver(productViewPage);
        await productViewPage.waitForTimeout(3000);
        if (await productViewPage.$('#priceblock_ourprice')) {
            let priceSelector = await productViewPage.$$('#priceblock_ourprice');
            console.log('priceSelector---if----', priceSelector.length);
            price = await (await priceSelector[0].getProperty('innerText')).jsonValue();
            price = price.replace('$', '').trim();
            amazonProductPrice = Number(price);
        } else if (await productViewPage.$('.a-section #price_inside_buybox')) {
            let priceSelector = await productViewPage.$$('.a-section #price_inside_buybox');
            console.log('priceSelector-else if------', priceSelector.length);
            price = await (await priceSelector[0].getProperty('innerText')).jsonValue();
            price = price.replace('$', '').trim();
            amazonProductPrice = Number(price);
        } else {
            if (await productViewPage.$('#priceblock_saleprice_row')) {
                let priceSelector = await productViewPage.$$('#priceblock_saleprice_row');
                console.log('priceSelector--else-----', priceSelector.length);
                price = await (await priceSelector[0].getProperty('innerText')).jsonValue();
                price = price.replace('$', '').trim();
                amazonProductPrice = Number(price);
            }
        }
        console.log('orderPrice------', typeof orderPrice, orderPrice, '..amazonProductPrice.......', typeof amazonProductPrice, amazonProductPrice);
        //await productViewPage.waitForTimeout(3000);
        if ( 1 == 1 && amazonProductPrice>0 ) {
            console.log('if calling-----------');
            //One-time purchase:
            await productViewPage.waitForTimeout(4000);
            await productViewPage.evaluate(() => {
                return new Promise((res, rej) => {
                    let OnetimepurchaseLink = document.querySelectorAll('#buyNew_cbb');
                    if (OnetimepurchaseLink.length > 0) {
                        OnetimepurchaseLink[0].click();
                    }
                    res()
                })
            });
            await productViewPage.waitForTimeout(4000);
            if (await productViewPage.$('#buy-now-button')) {
                //selct qyt
                let SelectedOption = await productViewPage.evaluate((result) => {
                    let isSelected = [];
                    let optionEl = document.getElementsByName("quantity");
                    if (optionEl && optionEl.length > 0) {
                        optionEl = optionEl[0].options;
                        for (let k = 0; k < optionEl.length; k++) {
                            if (optionEl[k].text == result['Sum(aol.orderLineQuantity)']) {
                                isSelected = optionEl[k].value
                            }
                        }
                    }
                    return isSelected;
                }, result);
                console.log('SelectedOption..272...', SelectedOption);
                if(await productViewPage.$('select[name="quantity"]') && SelectedOption){
                    await productViewPage.select('select[name="quantity"]', SelectedOption);
                }
                
                let buyNowButton = await productViewPage.$$('#buy-now-button');
                console.log('buyNowButton-----', buyNowButton.length);
                await buyNowButton[0].click();
                // await productViewPage.waitForSelector("#ap_email", { visible: true, timeout: 0 });
                console.log('enter email...', result['amazon_user_name']);
                // await productViewPage.waitForTimeout(4000);
                await productViewPage.waitForNavigation({ timeout: 0 });
                //email
                await productViewPage.evaluate(async (EMAIL) => {
                    return new Promise(async (res, rej) => {
                        let emailEl = document.getElementById('ap_email');
                        if (emailEl) {
                            emailEl.value = EMAIL;
                            // document.getElementById('continue').click();
                            let continueButton = await document.querySelectorAll('#continue');
                            continueButton[1].click();
                        }

                        res();
                    })
                }, result['amazon_user_name']);
                await productViewPage.waitForTimeout(4000);
                //password
                if(await productViewPage.$('#ap_password')){
                    console.log('enter password...', 'Walmart123!');
                    await productViewPage.evaluate((PASSWORD) => {
                        return new Promise((res, rej) => {
                            let passwordEl = document.getElementById('ap_password');
                            if (passwordEl) {
                                passwordEl.value = PASSWORD;
                                let signInButton = document.getElementById('signInSubmit');
                                signInButton.click();
                                // document.getElementById('#signInSubmit').click();
                            }

                            res();
                        })
                    }, result['password']);
                }

                //
                await productViewPage.waitForTimeout(4000);
                //confirm password
                await productViewPage.evaluate((PASSWORD) => {
                    return new Promise((res, rej) => {
                        let passwordEl = document.getElementById('ap_password');
                        if (passwordEl) {
                            passwordEl.value = PASSWORD;
                        }
                        res();
                    })
                }, 'Walmart123!');
                await secondCaptchaSolver(productViewPage)
                console.log('click to continue');
                await productViewPage.waitForTimeout(4000);
                //confirm password
                // console.log('Confirm password');
                // await productViewPage.evaluate((PASSWORD) => {
                //     return new Promise((res, rej) => {
                //         let passwordEl = document.getElementById('ap_password');
                //         if (passwordEl) {
                //             passwordEl.value = PASSWORD;
                //         }
                //         res();
                //     })
                // }, 'Walmart123!');
                await otpResolver(productViewPage,result);
                //select address for Deliver
                console.log('result--------', result);
                await productViewPage.waitForNavigation({ timeout: 0 });
                //turbo-checkout-pyo-button
                await productViewPage.waitForTimeout(4000);
                await productViewPage.evaluate(() => {
                    return new Promise((res, rej) => {
                        let placeButton = document.querySelectorAll('#turbo-checkout-pyo-button');
                        console.log(placeButton);
                        if (placeButton.length > 0) {
                            placeButton[0].click();
                        }
                        res()
                    })
                });
                //PO check
                if(await productViewPage.$('span.a-button-inner input[value="Continue"]')){
                    console.log('PO found and pressing continue ------ ')
                    await productViewPage.waitForTimeout(4000);
                    await productViewPage.evaluate(()=>{
                        return new Promise((res,rej)=>{
                            let continue_btn=document.querySelector('span.a-button-inner input[value="Continue"]')
                            continue_btn.click()
                            res()
                        })
                    })
                }
                //shipper add
                if(await productViewPage.$$('.a-color-base.clickable-heading.expand-collapsed-panel-trigger').length>0){
                    console.log('adding shipper ------ ')
                    await productViewPage.waitForTimeout(4000);
                    await productViewPage.evaluate(() => {
                        return new Promise((res, rej) => {
                            let addButton = document.querySelectorAll('.a-color-base.clickable-heading.expand-collapsed-panel-trigger');
                            console.log(addButton);
                            if (addButton.length > 0) {
                                addButton[1].click();
                            }
                            res()
                        })
                    });
                }

                await productViewPage.waitForTimeout(4000);
                await productViewPage.evaluate(() => {
                    return new Promise((res, rej) => {
                        let addAddresslink = document.querySelectorAll('#add-new-address-popover-link');
                        console.log(addAddresslink);
                        if (addAddresslink.length > 0) {
                            addAddresslink[0].click();
                        }
                        res()
                    })
                });

                //Add a new address
                await productViewPage.waitForTimeout(4000);
                await productViewPage.evaluate((result) => {
                    return new Promise((res, rej) => {
                        let addAddressEl = document.querySelectorAll('.a-input-text-group.a-spacing-medium.a-spacing-top-medium');
                        if (addAddressEl.length > 0) {
                            let fullNameSelector = document.querySelectorAll('#address-ui-widgets-enterAddressFullName');
                            fullNameSelector[0].value = result.ship_name;
                            let phoneNumberSelector = document.querySelectorAll('#address-ui-widgets-enterAddressPhoneNumber');
                            phoneNumberSelector[0].value = result.ship_phone;
                            let addressSelector = document.querySelectorAll('#address-ui-widgets-enterAddressLine1');
                            addressSelector[0].value = result.ship_address1;
                            let CitySelector = document.querySelectorAll('#address-ui-widgets-enterAddressCity');
                            CitySelector[0].value = result.ship_city;
                            let zipCodeSelector = document.querySelectorAll('#address-ui-widgets-enterAddressPostalCode');
                            zipCodeSelector[0].value = result.ship_postalCode;
                        }
                        res()
                    })
                }, result);

                //select state
                await productViewPage.waitForTimeout(3000)
                let selectedState = await productViewPage.evaluate((result) => {
                    let stateValue = '';
                    let optionEl = document.getElementById("address-ui-widgets-enterAddressStateOrRegion-dropdown-nativeId");
                    if (optionEl) {
                        optionEl = optionEl.options;
                        for (let k = 0; k < optionEl.length; k++) {
                            if (optionEl[k].value == result.ship_state) {
                                stateValue = optionEl[k].value
                            }
                        }
                    }
                    return stateValue;
                }, result);
                console.log(typeof selectedState, 'selectedState------', selectedState);
                if (selectedState) {
                    await productViewPage.select('select[name="address-ui-widgets-enterAddressStateOrRegion"]', selectedState);
                }
                await productViewPage.waitForTimeout(4000);
                await productViewPage.evaluate(() => {
                    return new Promise((res, rej) => {
                        let usethisaddressButton = document.querySelectorAll('#address-ui-widgets-form-submit-button-announce');
                        if (usethisaddressButton.length > 0) {
                            usethisaddressButton[0].click();
                        }
                        res()
                    })
                });
                console.log('product DeliveryAddressButton');
                await productViewPage.waitForTimeout(4000);
                if(await productViewPage.$('span.a-button-inner input[name="address-ui-widgets-saveOriginalOrSuggestedAddress"]')){
                    await productViewPage.evaluate(()=>{
                        return new Promise((res,rej)=>{
                            let save_address_btn = document.querySelector('span.a-button-inner input[name="address-ui-widgets-saveOriginalOrSuggestedAddress"]')
                            save_address_btn.click()
                            res()
                        })
                    })
                }
                // await productViewPage.evaluate(() => {
                //     return new Promise((res, rej) => {
                //         let DeliveryAddressButton = document.querySelectorAll('.ship-to-this-address.a-button a');
                //         console.log(DeliveryAddressButton);
                //         if (DeliveryAddressButton.length > 0) {
                //             DeliveryAddressButton[0].click();

                //         }
                //         res()
                //     })
                // });
                
                //await productViewPage.waitForNavigation({waitUntil : 'domcontentloaded'})
                await productViewPage.waitForTimeout(5000)
                if(await productViewPage.$('input[name="ppw-instrumentRowSelection"')){
                    console.log('payment option found ---- ')
                    await productViewPage.evaluate(()=>{
                        return new Promise((res,rej)=>{
                            let continueButton=document.querySelector('input[name="ppw-instrumentRowSelection"')
                            if(continueButton){
                                continueButton.click()
                            }
                            res()
                        })
                    })
                }

                await productViewPage.waitForTimeout(5000)
                if(await productViewPage.$('input[name="ppw-widgetEvent:SetPaymentPlanSelectContinueEvent"]')){
                    console.log('payment option button found ---- ')
                    await productViewPage.evaluate(()=>{
                        return new Promise((res,rej)=>{
                            let continueBtn = document.getElementsByName('ppw-widgetEvent:SetPaymentPlanSelectContinueEvent')[0]
                            continueBtn.click()
                            res()
                        })
                    })
                }
                
                await productViewPage.waitForTimeout(10000)
                let is_break_even_price_higher = ''
                if(await productViewPage.$('#subtotals-marketplace-table')){
                    console.log('checking break even price --- ')
                    is_break_even_price_higher=await productViewPage.evaluate((result)=>{
                        return new Promise((res,rej)=>{
                            let rows = document.querySelectorAll('#subtotals-marketplace-table tbody tr')
                            let tableData = rows[rows.length-1].querySelector('td.a-color-price.a-size-medium.a-text-right.grand-total-price.aok-nowrap.a-text-bold.a-nowrap')
                            let price = tableData.innerText.replace('$','').trim()
                            if(parseFloat(price) > parseFloat(result['break_even_price'])){
                                //is_break_even_price_lower=true
                                res(false)
                            }
                            else{
                                //is_break_even_price_lower=false
                                res(true)
                            }
                        })
                    },result)
                    console.log('break even price status ----- ',is_break_even_price_higher)
                }
                await productViewPage.waitForTimeout(5000)
                let cart_price = 0
                if(await productViewPage.$('#subtotals-marketplace-table')){
                    console.log('collecting cart price --- ')
                    cart_price=await productViewPage.evaluate(()=>{
                        return new Promise((res,rej)=>{
                            let rows = document.querySelectorAll('#subtotals-marketplace-table tbody tr')
                            let tableData = rows[rows.length-1].querySelector('td.a-color-price.a-size-medium.a-text-right.grand-total-price.aok-nowrap.a-text-bold.a-nowrap')
                            let price = tableData.innerText.replace('$','').trim()
                            //cart_price=Number(price).toFixed(2)
                            res(Number(price).toFixed(2))
                        })
                    })
                }
                console.log('cart price ---- ',cart_price)
                if(1 == 1 && is_break_even_price_higher == true ){
                    await productViewPage.waitForTimeout(5000)
                    console.log('pressing payment continue')
                    if(await productViewPage.$('input[name="ppw-widgetEvent:SetPaymentPlanSelectContinueEvent"')){
                        console.log('payment continue btn found ---- ')
                        await productViewPage.evaluate(()=>{
                            return new Promise((res,rej)=>{
                                let continueButton=document.querySelector('input[name="ppw-widgetEvent:SetPaymentPlanSelectContinueEvent"')
                                if(continueButton){
                                    continueButton.click()
                                }
                                res()
                            })
                        })
                    }
                    
                    //new customer order placing
                    console.log('order button place order ');
                    await productViewPage.waitForTimeout(5000)
                    await productViewPage.evaluate(()=>{
                        return new Promise((res,rej)=>{
                            let element1=document.querySelector('#placeYourOrder span input[name="placeYourOrder1"]')
                            let element2=document.querySelectorAll('#submitOrderButtonId span.a-button-inner input')[0]
                            if(element1){
                                console.log('place order button 1 found ---');
                                element1.click() 
                            }
                            else if(element2){
                                console.log('place order button 2 found ---');
                                element2.click()
                            }
                            res()
                        })
                    })
                    // console.log('ContinueButton click for address');
                    // await productViewPage.waitForNavigation({ waitUntil: 'domcontentloaded' })
                    // await productViewPage.waitForTimeout(3000);
                    // if (await productViewPage.$('.a-button.a-button-span12.a-button-primary.pmts-button-input')) {
                    //     await productViewPage.evaluate(() => {
                    //         return new Promise((res, rej) => {
                    //             //.a-button.a-button-span12.a-button-primary.pmts-button-input
                    //             let ContinueButton = document.querySelectorAll('.a-button.a-button-span12.a-button-primary.pmts-button-input');
                    //             console.log('continue----', ContinueButton);
                    //             if (ContinueButton && ContinueButton.length > 0) {
                    //                 ContinueButton[0].click();
                    //             }
                    //             res();
                    //         })
                    //     })
                    // }
                    //console.log('Place your order page');
                    // Place your order  #placeYourOrder
                    //document.querySelectorAll('.a-button-inner.a-button-span12.buy-button-height-1')[0].click()

                    // await productViewPage.waitForTimeout(3000);
                    //payment button add
                    //console.log('order button ');
                    // await productViewPage.evaluate(() => {
                    //     return new Promise((res, rej) => {
                    //         let ContinueButton = document.querySelectorAll('#orderSummaryPrimaryActionBtn input');
                    //         console.log('continue----', ContinueButton);
                    //         if (ContinueButton && ContinueButton.length > 0) {
                    //             ContinueButton[0].click();
                    //         }
                    //         res();
                    //     })
                    // })
                    
                    // await productViewPage.waitForNavigation({waitUntil:'domcontentloaded'});
                    // await productViewPage.waitForTimeout(4000);
                    // await productViewPage.evaluate(() => {
                    //     return new Promise((res, rej) => {
                    //         //#submitOrderButtonId input
                    //         let ContinueButton = document.querySelectorAll('#submitOrderButtonId span.a-button-inner input');
                    //         console.log('continue----', ContinueButton);
                    //         if (ContinueButton && ContinueButton.length > 0) {
                    //             ContinueButton[0].click();
                    //         }
                    //         res();
                    //     })
                    // })
                    //Place this duplicate order  
                    //a-button-text
                    //console.log('palce orde.duplicate...');
                    // await productViewPage.waitForTimeout(4000);
                    // await productViewPage.evaluate(() => {
                    //     return new Promise((res, rej) => {
                    //         let buttonSelector = document.querySelectorAll('.a-button-text');
                    //         console.log('continue----', buttonSelector);
                    //         if (buttonSelector && buttonSelector.length > 0) {
                    //             buttonSelector[0].click();
                    //         }
                    //         res();
                    //     })
                    // })

                    console.log('order view link show.');
                    //orderId orderlink
                    await productViewPage.waitForNavigation({waitUntil:'domcontentloaded'});
                    await productViewPage.goto('https://www.amazon.com/gp/css/order-history?ref_=abn_bnav_ya_ad_orders')
                    //await productViewPage.waitForNavigation({waitUntil:'domcontentloaded'});
                    await productViewPage.waitForTimeout(4000);
                    // await productViewPage.hover('#nav-link-yourAccount')
                    // await productViewPage.waitForTimeout(4000);
                    // await productViewPage.evaluate(() => {
                    //     return new Promise((res, rej) => {
                    //         //a-link-emphasis
                    //         let yourOrders= document.getElementById('nav_prefetch_yourorders')
                    //         let selector = document.querySelectorAll('#widget-accountLevelActions div.celwidget span.celwidget a.a-link-emphasis');
                    //         console.log('continue----', selector);
                    //         if (selector && selector.length > 0) {
                    //             selector[0].click();
                    //         }
                    //         else if(yourOrders){
                    //             yourOrders.click()
                    //         }
                    //         res();
                    //     })
                    // })

                    console.log('amazonOrderId-----88--');
                    await productViewPage.waitForTimeout(4000)
                    let imagePath = path.join(__dirname, "..", "/assets", `/img1.png`);
                    // await saveErrorImg(productViewPage);
                    await productViewPage.screenshot({ path: imagePath });
                    // await productViewPage.waitForSelector("#ordersContainer .a-box-group.a-spacing-base .a-fixed-right-grid-col.actions.a-col-right", { visible: true });
                    let amazonOrderId = await productViewPage.evaluate(async () => {
                        let id = '';
                        if(document.querySelectorAll('div.a-row.a-size-mini span.a-color-secondary.value').length>0){
                            console.log('html order element',document.querySelector('div.a-row.a-size-mini span.a-color-secondary').textContent)
                            let element= document.querySelectorAll('div.a-row.a-size-mini span.a-color-secondary.value')[0]
                            if(!element.textContent.includes('Order') && !element.textContent.includes('Total') && !element.textContent.includes('Ship to')&& !element.textContent.includes('Placed by')){
                                // order_numbers.push(element.innerText)
                                id=element.innerText
                            }
                        }
                        else if(document.querySelectorAll('span.a-color-secondary.value bdi[dir="ltr"]').length>0){
                            console.log('html order element',document.querySelector('span.a-color-secondary.value bdi[dir="ltr"]').textContent)
                            let element= document.querySelectorAll('span.a-color-secondary.value bdi[dir="ltr"]')[0]
                            if(element.textContent.length==17 && !element.textContent.includes('Order') && !element.textContent.includes('SHIP TO')&& !element.textContent.includes('PLACED BY') && !element.textContent.includes('Total')){
                                // order_numbers.push(element.innerText)
                                id=element.innerText
                            }
                        }
            
                        // return new Promise((res, rej) => {
                        // let element = document.querySelectorAll('#ordersContainer .a-box-group.a-spacing-base .a-fixed-right-grid-col.actions.a-col-right');
                        // console.log(element.length);
                        // if (element && element.length > 0) {
                        //     // id.push({ orderId: element[0].innerText.split("\n")[0].substr(8) })
                        //     id = element[0].innerText.split("\n")[0].substr(8)
                        //     // res(id);
                        // }
                        // });
                        return id;
                    });
                    let imagePath1 = path.join(__dirname, "..", "/assets", `/img2.png`);
                    // await saveErrorImg(productViewPage);
                    await productViewPage.screenshot({ path: imagePath1 });
                    console.log('amazonOrderId-------', amazonOrderId);
                    details = {
                        asin: asin,
                        amazon_order_number: amazonOrderId,
                        purchaseOrderId: purchaseOrderId,
                        customerOrderId: customerOrderId
                    }
                    console.log('details-----', details);
                    if (details.amazon_order_number != '') {
                        Service.update_amazon_order_number_API(result['ref_order_id'],details.amazon_order_number,cart_price);
                        orderIdlogger.info({ asin: asin, purchaseOrderId: purchaseOrderId, amazon_order_number: amazonOrderId })
                    }
                }
                else if(is_break_even_price_higher == false){
                    details = {
                        asin: asin,
                        amazon_order_number: 'loss',
                        purchaseOrderId: purchaseOrderId,
                        customerOrderId: customerOrderId
                    }
                    console.log('details-----', details);
                    if (details.amazon_order_number != '') {
                        Service.update_amazon_order_number_API(result['ref_order_id'],details.amazon_order_number,cart_price);
                        orderIdlogger.info({ asin: asin, purchaseOrderId: purchaseOrderId, amazon_order_number: 'loss' })
                    }
                }

                
            }
        }
        else{
            console.log('item unavailable ------ ')
            details = {
                asin: asin,
                amazon_order_number: 'os',
                purchaseOrderId: purchaseOrderId,
                customerOrderId: customerOrderId
            }
            console.log('details-----', details);
            if (details.amazon_order_number != '') {
                Service.update_amazon_order_number_API(result['ref_order_id'],details.amazon_order_number,'0');
                orderIdlogger.info({ asin: asin, purchaseOrderId: purchaseOrderId, amazon_order_number: 'out of stock' })
            }
        }
        // productViewPage.close();
        return;
    } catch (error) {
        console.log('error 287------', error);
        console.log('url ---- ',productViewPage.url())
        logger.error({ message: error })
        await saveErrorImg(productViewPage);
    }finally{
        //browser.close();
        console.log('browser close-------------');
    }
}

const getProxy = (totalCount, index) => {
    const arr = [1, 2, 3, 4, 6, 7, 8];
    const count = Math.ceil(index / 10);
    return arr[count];
};
function waitForNextOrder(duration) {
    console.log('duration-------', duration);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, duration * 1000)
    })
}
async function fetchDetails(result) {
    // const loopCount = result.length; // 31 - 4 /// 30 - 3 // 29 -- 3
    // for (let j = 0; j < loopCount; j = j + 10) {
    //     let proxy = getProxy(result, j);
    //     console.log('-proxy-----', proxy, j);
    // }
    /*const browser = await puppeteer.launch({
        headless: false,
        timeout: 0,
        ignoreHTTPSErrors: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process']
    });*/

    try {
        // const page = await browser.newPage();
        console.log('--next count----');
        console.log('-total-result---', result.length);
        let start = 0;
        let end = 1;
        let isFetchingDone = 0;
        let indexForPage = 0;
        while (result.length > isFetchingDone) {
            let allPromiseContent = [];
            let filterRecords = result.filter((data, index) => {
                if (start <= index && end > index) {
                    return true;
                } else {
                    return false;
                }
            });
            
            for (let i = 0; i < filterRecords.length; i++) {
                let pageIndex = i + indexForPage;
                let purchaseOrderId = JSON.stringify(result[pageIndex].purchaseOrderId);
                purchaseOrderId = purchaseOrderId.replace(/\"/g, "");
                let asin = JSON.stringify(result[pageIndex].asin)
                asin = asin.replace(/\"/g, "");
                let dbPrice = JSON.stringify(result[pageIndex].selling_price)
                dbPrice = dbPrice.replace(/\"/g, "");
                let orderPrice = JSON.stringify(result[pageIndex].selling_price);
                let customerOrderId = JSON.stringify(result[pageIndex].customerOrderId);
                customerOrderId = customerOrderId.replace(/\"/g, "");
                let amazon_order_number = JSON.stringify(result[pageIndex].amazon_order_number);
                //amazon_order_number = amazon_order_number.replace(/\"/g, "");
                amazon_order_number = '';
                console.log('-check-', asin,orderPrice, amazon_order_number)
                // let platefromUrl = 'https://www.amazon.com/dp/' + asin;
                //    if(orderPrice > 0){
                console.log('if 613----');
                allPromiseContent.push(get_proxy(asin, purchaseOrderId, customerOrderId, result[pageIndex], pageIndex, orderPrice));
                //    }
            }
            if (allPromiseContent && allPromiseContent.length > 0) {
                await Promise.all(allPromiseContent)
                    .then(async res => {
                        console.log('--res--call')
                        // Service.updateAmazonOrderNumber(res);
                    })
                    .catch(err => {
                        console.log('err-103----------', err);
                    });
            }
            // else{
            //     await browser.newPage();
            // }
            // await browser.close();
            //300000=5 min
            await waitForNextOrder(300);
            console.log('stopTime---------');
            indexForPage = indexForPage + 1;
            isFetchingDone = end + 1;
            end = end + 1;
            start = start + 1;
            // break;
        }
    } catch (error) {
        console.log('error--104-------', error);
        logger.error({ message: error })
    } finally {
        // browser.close();
        logger.info({ message: 'browser close process stop' })
        console.log('stop scraping-----------------', new Date().toLocaleTimeString());
    }
}
const amazon = async (count, i) => {
    logger.info({message:'process start------'})
    console.log('calling API ----- ')
    //const getProductAsin = await Service.sendPostRequest();
    axios.post('https://www.opulentdistributionllc.com/api/v1/getAmazonOrderData', {amazon_buyer_account:'mikebuyer8@gmail.com'}).then(async(resp)=>{
        //console.log('total orders from response ----- ',resp.data.data.length);
        const getProductAsin=resp.data.data
        console.log('totaldata.........', getProductAsin.length);
        try {
            let total = getProductAsin;
            let filtered = [];
            let isFetching = true;
            while (isFetching) {
                let start = 0;
                let end = 99;
                let temp = [];
                filtered = total.filter((res, index) => {
                    if (start <= index && end >= index) {
                        return true;
                    } else {
                        temp.push(res);
                        return false;
                    }
                });
                total = temp;
                console.log('total--', total.length);
                console.log('filtered--', filtered.length);
                await fetchDetails(filtered);
                if (total.length === 0) {
                    isFetching = false;
                }
                //break;
            }

        } catch (error) {
            console.log('364..error..........', error);
            logger.error({ message: error })
        }
    });
    // let getProductAsin = [{
    //     asin: 'B071G7Y8J2',
    //     orderPrice: '15.24'
    // }];
    
}
// amazon();
module.exports = amazon;