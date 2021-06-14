const { default: axios } = require('axios');
const db = require('../util/db');

class Service {
    static getProductAsin() {
        let connection;
        return new Promise((resolve, reject) => {
            db.getConnection()
                .then(conn => {
                    //SELECT * FROM product where id=356
                    //     let queryStatement = `SELECT 
                    //     aol.asin,
                    //     orders.purchaseOrderId,
                    //     orders.customerOrderId,
                    //     product.price
                    // FROM
                    //     amazon.order_line_items aol
                    //         INNER JOIN
                    //     orders ON aol.ref_order_id = orders.id
                    //         INNER JOIN
                    //     product ON aol.asin = product.asin`;

                    /*let queryStatement = `SELECT aol.asin,orders.purchaseOrderId,orders.customerOrderId,
                    orders.ship_name,orders.ship_address1,orders.ship_city,orders.ship_state,orders.ship_postalCode,
                    orders.ship_country,orders.amazon_order_number,
                product.price FROM order_line_items aol INNER JOIN orders ON aol.ref_order_id = orders.id 
                INNER JOIN product ON aol.asin = product.asin order by orders.orderDate DESC`;*/

                    let queryStatement = `SELECT aol.asin,product.selling_price,aol.ref_order_id,
                    aol.orderLineQuantity,orders.purchaseOrderId, amazon_account.amazon_user_name, amazon_account.password,amazon_account.otp_secret_key,
                    orders.orderDate,orders.customerOrderId, orders.ship_name,orders.ship_phone,
                    orders.ship_address1,orders.ship_city,orders.ship_state,orders.ship_postalCode, 
                    orders.ship_country,orders.amazon_order_number,sum(aol.orderLineQuantity) 
                    FROM order_line_items aol INNER JOIN product ON aol.sku = product.item_sku 
                    INNER JOIN orders ON aol.ref_order_id = orders.id INNER JOIN amazon_account ON orders.ref_amazon_account_id = amazon_account.id where product.BuyBoxPrice IS NOT NULL 
                    and orders.amazon_order_number IS NULL and amazon_account.amazon_user_name='mikebuyer8@gmail.com'
                    GROUP BY orders.id order 
                    by orders.orderDate DESC`;
                    connection = conn;
                    connection.query(queryStatement, (err, results) => {
                        db.releaseConnection(connection);
                        if (err) {
                            console.log('err.14--------', err);
                            reject(err);
                        } else {
                            console.log('results.length...........', results.length);
                            if (results && results.length > 0) {
                                //console.log(results);
                                resolve(results);
                            }
                        }
                    })
                })
                .catch(err => {
                    console.log('err.25--------', err);
                    reject(err);
                })
        })
    }

    static getAllData() {
        let connection;
        return new Promise((resolve, reject) => {
            db.getConnection()
                .then(conn => {
                    let statement = "SELECT * FROM product p LEFT JOIN orders o ON o.user_id = p.user_id where p.user_id=17 limit 10";
                    connection = conn;
                    connection.query(statement, (err, results) => {
                        db.releaseConnection(connection);
                        if (err) {
                            console.log('err.14--------', err);
                            reject(err);
                        } else {
                            console.log('results.length...........', results);
                            if (results && results.length > 0) {
                                resolve(results);
                            }
                        }
                    })
                })
                .catch(err => {
                    console.log('err.25--------', err);
                    reject(err);
                })
        })
    }
    static updateAmazonOrderNumber(payload) {
        let connection;
        return new Promise((resolve, reject) => {
            db.getConnection()
                .then((conn) => {
                    connection = conn;
                    return new Promise((resSelect, rejSelect) => {
                        //`UPDATE orders SET amazon_order_number ='D01-1001696-7887055' WHERE purchaseOrderId=6810300128136`;
                        let updateQueryStatement = `UPDATE orders SET amazon_order_number= ? where purchaseOrderId = ?`
                        connection.query(
                            updateQueryStatement, [payload.amazon_order_number, payload.purchaseOrderId],
                            (err, results) => {
                                if (err) {
                                    console.log('err------', err);
                                    db.rollbackTransaction(connection);
                                    db.releaseConnection(connection);
                                    rejSelect(err);
                                } else {
                                    db.commitTransaction(connection);
                                    db.releaseConnection(connection);
                                    console.log('update amazon_order_number successfully ');
                                    resSelect(results);
                                }
                            }
                        );
                    })
                }).catch(error => {
                    console.log(error);
                    reject(error);
                })
        }).catch(e => {
            console.log('102 error----', e);
        })
    }

    // static get_orders_from_API(){
    //     return new Promise(async(res,rej)=>{
    //         // const { data: orders } = await axios({
    //         //     method: "post",
    //         //     url: "https://www.opulentdistributionllc.com/api/v1/getAmazonOrderData",
    //         //     data: JSON.stringify({amazon_buyer_account:process.env.EMAIL}),
    //         //     // headers: {
    //         //     //     ...bodyFormData.getHeaders()
    //         //     // }
    //         // })
            
    //         if(orders && orders.length>0){
    //             console.log('orders from API ----- ',orders)
    //             res(orders)
    //         }            
    //     })
    // }

    static async sendPostRequest (){
        return new Promise(async(res,rej)=>{
            try {
                const resp = await axios.post('https://www.opulentdistributionllc.com/api/v1/getAmazonOrderData', {amazon_buyer_account:process.env.EMAIL});
                console.log('orders from response ----- ',resp.data.data.length);
                res(resp.data.data)
                //return resp.data.data
            } catch (err) {
                // Handle Error Here
                console.error(err);
            }
        })
    }

    static async update_amazon_order_number_API (order_id,order_number,cart_price){
        try {
            console.log('api post data ---- ',{order_id:order_id,order_number:order_number,purchaseCost:cart_price})
            const resp = await axios.post('https://www.opulentdistributionllc.com/api/v1/order', {order_id:order_id,order_number:order_number,purchaseCost:cart_price});
            if(resp && resp.statusText == "OK" && resp.data.data.order){
                console.log(resp.data.data.order);
            }
        } catch (err) {
            // Handle Error Here
            console.error(err);
        }
    };

}
module.exports = Service;