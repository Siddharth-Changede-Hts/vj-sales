const axios = require("axios").default;
var express = require('express');
var router = express.Router();
var Razorpay = require('razorpay');
var QRCode = require('qrcode')
const supabaseUrl = 'https://bcvhdafxyvvaupmnqukc.supabase.co/storage/v1/object/public/'
const { sendSMs_A2P_services, sendSMs_twilio_services } = require('./message');
const { decode } = require("base64-arraybuffer");
const { sendMail } = require("./mail");
var instance = new Razorpay({
    key_id: 'rzp_test_hh7wD7GVmRaEaX',
    key_secret: 'us2o34YBjUEqkF2UqQZXwNap',
});
var supabase = require("../services/supabaseClient").supabase;

function QrTemplate(qrData) {
    // style = "width: 40%;margin: 2rem;padding: 1rem;background: #fffefe;border: 1px solid rgba(0, 0, 0, 0.12);overflow: hidden;box-shadow: 0px 1px 3px rgb(16 24 40 / 10%), 0px 1px 2px rgb(16 24 40 / 6%);border-radius: 0.8rem;flex-direction: column;" >

    return (
        `<div 
        style = "margin: 2rem;padding: 1rem;background: #fffefe;border: 1px solid rgba(0, 0, 0, 0.12);overflow: hidden;border-radius: 0.8rem;flex-direction: column;" >
        <div style="display: block;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;">
      <div style="    width: 25%;
    display: inline-block">
        <img style="width: 5rem;
     height: 5rem;" src=${qrData.eventImg}></img>
      </div>
      <div style="display: inline-block;
    width: 70%;
    vertical-align: top;">
        <span style=" font-family: Roboto;
     font-weight: 700;
     font-size: 1.2rem;
     line-height: 2rem;
     display: flex;
     align-items: center;
  word-break: break-all;
     color: #000000;">${qrData.eventName}</span>
        <span style=" font-family: Roboto;
     font-style: normal;
      word-break: break-all;
     font-size: 1rem;
     line-height: 1.6rem;
     display: flex;
     align-items: center;
     color: #4b5563;">${new Date(qrData.eventDateTime).toDateString()}</span>
      </div>
    </div>
    <div style=" border-bottom: 0.3rem dashed lightslategray;
     transform: rotate(-0.04deg);">
    </div>
    <div style="display: block;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;">
      <div style="  width: 25%;
    display: inline-block">
        <img style=" width: 5rem;
     height: 5rem;" src=${qrData.qrCode}></img>
      </div>
      <div style="display: inline-block;
    width: 70%;
    margin-top: 15px;
    vertical-align: top;">
        <span style=" font-family: Roboto;
     font-weight: 700;
    
     font-size: 1rem;
     line-height: 1.6rem;
     display: flex;
     align-items: center;
  word-break: break-all;
     color: #000000;">${qrData.tokenTitle}</span>

        <span style=" font-family: Roboto;
     font-style: normal;
      word-break: break-all;
     font-size: 1rem;
     line-height: 1.6rem;
     display: flex;
     align-items: center;
     color: #4b5563;">Token Number:${qrData.tokenDisplayNumber}</span>

      </div>
    </div>
    <div style=" border-bottom: 0.3rem dashed lightslategray"></div>
    <div style="display:inline-block;
      background: rgba(220, 240, 255, 0.62);
width: calc(100% - 5rem);
      border-radius: 0.8rem;
      margin: 1.5rem 2rem 0.5rem 2rem;
      padding:0.2rem 1rem 0.5rem 1rem;">
      <div style=" font-family: Roboto;
     font-style: normal;
     font-weight: 700;
     font-size: 1.2rem;
     line-height: 2rem;
     align-items: center;
    display:inline-block;
width:35%;
     color: #000000;">Token Amount</div>
      <div style="
    display:inline-block;
width:62%;
        ">
        <span style="  font-family: Roboto;
      font-style: normal;
      font-weight: 700;
       word-break: break-all;
     font-size: 1rem;
     line-height: 1.6rem;
     margin-right:2rem;
      align-items: center;
      color: #4b5563;">₹${qrData.amount}</span>
        <span style="  font-family: Roboto;
      font-style: normal;
      font-weight: 700;
    
     font-size: 1rem;
     line-height: 1.6rem;
      align-items: center;
       word-break: break-all;
      color: #4b5563;">${new Date(qrData.tokenDate).toDateString()}</span>
      </div>
    </div>
  </div>`
    )
}

router.get("/", async function (req, res, next) {
    res.send({ success: true });
});

// router.post('/create-virtual-acc', function (req, res, next) {
//     if (!req.body.name || req.body.name === '') {
//         res.send({ success: false, message: "Please provide lead name" })
//     } else if (!req.body.contactNumber || req.body.contactNumber === '') {
//         res.send({ success: false, message: "Please provide lead contact number" })
//     } else if (!req.body.email || req.body.email === '') {
//         res.send({ success: false, message: "Please provide lead email" })
//     } else if (!req.body.leadId || req.body.leadId === '') {
//         res.send({ success: false, message: "Please provide lead lead id" })
//     } else {
//         // createVirtualAcc(req.body.name,req.body.contactNumber,req.body.email,"api")
//     }
// })

function createVirtualAcc(name, contactNumber, email, leadId) {
    instance.customers.create({
        name: name,
        contact: contactNumber,
        email: email,
    }).then((customerRes) => {
        instance.virtualAccounts.create({
            receivers: {
                types: [
                    "bank_account",
                    "vpa"
                ]
            },
            customer_id: customerRes.id,
        }).then((accRes) => {
            supabase.from('Leads').update(
                {
                    razorpayCustomerId: customerRes.id,
                    virtualAccDetails: { bankAccountNumber: accRes.receivers[0].account_number, bankIFSCCode: accRes.receivers[0].ifsc, bankUpiId: accRes.receivers[1].address, bankBeneficiaryName: accRes.receivers[0].name }
                }).eq('leadId', leadId).then((personRes) => {
                    // CHANGE CONDITION 
                    if (contactNumber.toString().substr(0, 3) !== '+91') {
                        sendSMs_A2P_services("Hello", contactNumber)
                    } else {
                        sendSMs_twilio_services(`Account Number : ${accRes.receivers[0].account_number} \n IFSC Code : ${accRes.receivers[0].ifsc} \n Beneficiary Name : ${accRes.receivers[0].name} \n UPI Id : ${accRes.receivers[1].address}`, req.body.contactNumber).then((resp) => {
                            // res.send({ success: true, message: "Virtual Account created successfully" })
                        }).catch((err) => {
                            // res.send({ success: false, err })
                        })
                    }
                })
        })
    }).catch((customerErr) => {
        if (customerErr.error.description === 'Customer already exists for the merchant') {
            // res.send({ success: false, errorMsg: "Virtual Account already Exists" })
        }
    })
}

router.post('/webhook', function (req, res, next) {
    if (req.body.event === 'payment_link.paid') {
        if (req.body.payload.payment_link.entity.description.includes('Allotment payment link')) {
            supabase.from('AllotmentTransactions').select('*,allotmentPaymentId(*,inventoryMergedId(*))').eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((allotmentRes) => {
                if (allotmentRes.data[0].status === 'pending') {
                    if (allotmentRes.data[0].allotmentPaymentId.pricingType === 'preselect') {
                        supabase.from('AllotmentTransactions').update({ status: "complete" }).eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((resp) => {
                            supabase.from('AllotmentPayment').update({ preselectConfirmation: "Confirmation pending", paidAmount: parseFloat(allotmentRes.data[0].allotmentPaymentId.paidAmount + parseInt(req.body.payload.payment_link.entity.amount_paid / 100)), }).eq('allotmentPaymentId', allotmentRes.data[0].allotmentPaymentId.allotmentPaymentId).then((_resp) => {
                                supabase.from('LeadStatus').update({ status: "Preselect Confirmation Pending" }).eq('leadId', allotmentRes.data[0].allotmentPaymentId.leadId.leadId).then((res) => {
                                    res.send("success")
                                })
                            })
                        })
                    } else {
                        supabase.from('AllotmentTransactions').update({ status: "complete" }).eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((resp) => {
                            supabase.from('AllotmentPayment').update({ paidAmount: parseFloat(allotmentRes.data[0].allotmentPaymentId.paidAmount + parseInt(req.body.payload.payment_link.entity.amount_paid / 100)), }).eq('allotmentPaymentId', allotmentRes.data[0].allotmentPaymentId.allotmentPaymentId).then((_resp) => {
                                supabase.from('LeadStatus').update({ status: 500000 - allotmentRes.data[0].allotmentPaymentId.paidAmount > parseInt(req.body.payload.payment_link.entity.amount_paid / 100) ? 'Allotment Partial Payment Done' : 'Allotment Payment Complete', }).eq('leadId', allotmentRes.data[0].allotmentPaymentId.leadId.leadId).then((res) => {
                                    // if (500000 - allotmentRes.data[0].allotmentPaymentId.paidAmount <= parseInt(req.body.payload.payment_link.entity.amount_paid / 100)) {
                                    if (allotmentRes.data[0].allotmentPaymentId.paidAmount == 0) {
                                        supabase.from('InventoryStatus').select('*').eq('status', "Alloted").then((statusRes) => {
                                            if (allotmentRes.data[0].inventoryMergedId && allotmentRes.data[0].inventoryMergedId !== '') {
                                                supabase.from('Inventory').update({ inventoryStatusId: statusRes.data[0].inventoryStatusId }).eq('unitId', allotmentRes.data[0].inventoryMergedId.unit1Id).then((updateRes) => {
                                                    supabase.from('Inventory').update({ inventoryStatusId: statusRes.data[0].inventoryStatusId }).eq('unitId', allotmentRes.data[0].inventoryMergedId.unit2Id).then((updateRes) => {
                                                        res.send("success")
                                                    })
                                                })
                                            } else {
                                                supabase.from('Inventory').update({ inventoryStatusId: statusRes.data[0].inventoryStatusId }).eq('unitId', allotmentRes.data[0].allotmentPaymentId.unitId.unitId).then((updateRes) => {
                                                    res.send("success")
                                                })
                                            }
                                        })
                                    } else {
                                        res.send("success")
                                    }
                                })
                            })
                        })
                    }
                }
            })
        } else {
            supabase.from('TokenTransactions').select('*,leadId(*,personId(*)),eventTokenId(*,tokenId(*),eventId(*))').eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((tokenTransaction) => {
                if (tokenTransaction.data[0].status === 'pending') {
                    if (!tokenTransaction.data[0].leadId.razorpayCustomerId || tokenTransaction.data[0].leadId.razorpayCustomerId === '') {
                        createVirtualAcc(tokenTransaction.data[0].leadId.personId.name, tokenTransaction.data[0].leadId.personId.contactNumber, tokenTransaction.data[0].leadId.personId.email, tokenTransaction.data[0].leadId.leadId)
                    }
                    supabase.from('LeadStatus').update({ status: "Token Payment Complete" }).eq('leadId', tokenTransaction.data[0].leadId.leadId).then((leadStatus) => {
                        supabase.from('TokenTransactions').update({ status: "complete", eventDateTime: new Date().getTime() }).eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((resp) => {
                            if (tokenTransaction.data[0].eventTokenId.algoId === '29b30596-9771-4437-807a-097e201395d3') {
                                supabase.rpc('getmaxsrno', { pid: tokenTransaction.data[0].eventTokenId.eventTokenId }).then((rpcRes) => {
                                    supabase.from('EventTokenLeadRelations').update({ qrUrl: `qrcodes/${tokenTransaction.data[0].paymentId}.png`, srno: rpcRes.data[0].num === null ? 1 : parseInt(rpcRes.data[0].num) + 1, bandNumber: rpcRes.data[0].num === null ? 1 : parseInt(rpcRes.data[0].num) + 1, paidAmount: req.body.payload.payment_link.entity.amount_paid / 100 }).eq('paymentId', tokenTransaction.data[0].paymentId).eq('leadId', tokenTransaction.data[0].leadId.leadId).then((leadStatus) => {
                                        QRCode.toDataURL(`${tokenTransaction.data[0].paymentId}`).then(async (resp) => {
                                            resp = resp.split('base64,')[1]
                                            await supabase.storage.from('qrcodes').upload(`${tokenTransaction.data[0].paymentId}.png`, decode(resp), { contentType: 'image/png' }).then((uploadRes) => {
                                                res.send("success")
                                                let qrData = {
                                                    eventImg: `${supabaseUrl}${tokenTransaction.data[0].eventTokenId.eventId.bannerImgUrl}`,
                                                    eventName: tokenTransaction.data[0].eventTokenId.eventId.title,
                                                    eventDateTime: tokenTransaction.data[0].eventTokenId.eventId.startDateTime,
                                                    tokenTitle: tokenTransaction.data[0].eventTokenId.tokenId.name,
                                                    tokenDisplayNumber: tokenTransaction.data[0].eventTokenId.tokenNumber,
                                                    tokenDate: tokenTransaction.data[0].eventTokenId.created_at,
                                                    qrCode: `${supabaseUrl}qrcodes/${tokenTransaction.data[0].paymentId.paymentId}.png`,
                                                    amount: tokenTransaction.data[0].eventTokenId.tokenId.amount,
                                                }
                                                sendMail(QrTemplate(qrData), tokenTransaction.data[0].leadId.personId.email, `Token for ${tokenTransaction.data[0].eventTokenId.eventId.title}`)
                                            }).catch((err) => {
                                                res.send(err)
                                            })
                                        }).catch((err) => {
                                            res.send(err)
                                        })
                                    })
                                })
                            } else {
                                supabase.from('EventTokenLeadRelations').update({ qrUrl: `qrcodes/${tokenTransaction.data[0].paymentId}.png`, paidAmount: req.body.payload.payment_link.entity.amount_paid / 100 }).eq('paymentId', tokenTransaction.data[0].paymentId).eq('leadId', tokenTransaction.data[0].leadId.leadId).then((leadStatus) => {
                                    QRCode.toDataURL(`${tokenTransaction.data[0].paymentId}`).then(async (resp) => {
                                        resp = resp.split('base64,')[1]
                                        await supabase.storage.from('qrcodes').upload(`${tokenTransaction.data[0].paymentId}.png`, decode(resp), { contentType: 'image/png' }).then((uploadRes) => {
                                            res.send("success")
                                            sendMail(`https://bcvhdafxyvvaupmnqukc.supabase.co/storage/v1/object/public/qrcodes/${tokenTransaction.data[0].paymentId}.png`, tokenTransaction.data[0].leadId.personId.email, "Qr Code")
                                        }).catch((err) => {
                                            res.send(err)
                                        })
                                    }).catch((err) => {
                                        res.send(err)
                                    })
                                })
                            }
                        })
                    })
                } else {
                    res.send({ success: true })
                }
            })
        }
    } else if (req.body.event === 'payment_link.expired' || req.body.event === 'payment_link.cancelled') {
        supabase.from('TokenTransactions').select('*,eventTokenId(*)').eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((tokenTransaction) => {
            supabase.from('LeadStatus').update({ status: "Site Visit Done" }).eq('leadId', tokenTransaction.data[0].leadId).then((leadStatus) => {
                supabase.from('EventTokenLeadRelations').delete().eq('paymentId', tokenTransaction.data[0].paymentId).then((relation) => {
                    supabase.from('TokenTransactions').update({ status: "expired" }).eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((resp) => {
                        res.send("success")
                        console.log("success")
                    })
                })
            })
        })
    } else if (req.body.event === 'virtual_account.credited') {
        supabase.from('Leads').select('*').eq('razorpayCustomerId', req.body.payload.virtual_account.entity.customer_id).then((lead) => {
            supabase.from('AllotmentPayment').select('*,unitId(*,inventoryTypeId(*),projectId(*)),inventoryMergedId(*),leadId(*,personId(*)),paymentId(*,eventId(*))').eq('leadId', lead.data[0].leadId).neq('paidAmount', 500000).order('created_at').then(async (payments) => {
                let amount = parseInt(req.body.payload.virtual_account.entity.amount_paid / 100)
                for (let i = 0; i < payments.data.length; i++) {
                    if (amount > 0) {
                        if ((500000 - payments.data[i].paidAmount) >= amount) {
                            await supabase.from('AllotmentPayment').update({ paidAmount: parseFloat(payments.data[i].paidAmount + amount) }).eq('allotmentPaymentId', payments.data[i].allotmentPaymentId).then(async (resp) => {
                                await supabase.from('AllotmentTransactions').insert({ allotmentPaymentId: payments.data[i].allotmentPaymentId, amount: parseFloat(amount), transactionType: 'Allotment', modeOfPayment: 'Virtual acc', leadId: payments.data[i].leadId.leadId, unitId: payments.data[i].unitId.unitId }).then(async (re) => {
                                    await supabase.from('LeadStatus').update({ status: ((500000 - payments.data[i].paidAmount) > amount) ? 'Allotment Partial Payment Done' : 'Allotment Payment Complete' }).eq('leadId', payments.data[i].leadId).then(async (r) => {
                                        if (500000 - payments.data[i].paidAmount <= parseInt(amount)) {
                                            await supabase.from('InventoryStatus').select('*').eq('status', "Alloted").then(async (statusRes) => {
                                                if (payments.data[i].inventoryMergedId && payments.data[i].inventoryMergedId !== '') {
                                                    await supabase.from('Inventory').update({ inventoryStatusId: statusRes.data[0].inventoryStatusId }).eq('unitId', payments.data[i].inventoryMergedId.unit1Id).then(async (updateRes) => {
                                                        await supabase.from('Inventory').update({ inventoryStatusId: statusRes.data[0].inventoryStatusId }).eq('unitId', payments.data[i].inventoryMergedId.unit2Id).then((updateRes) => {
                                                            amount = 0
                                                            console.log("success")
                                                            res.send("success")
                                                        })
                                                    })
                                                } else {
                                                    supabase.from('Inventory').update({ inventoryStatusId: statusRes.data[0].inventoryStatusId }).eq('unitId', payments.data[i].unitId.unitId).then((updateRes) => {
                                                        amount = 0
                                                        console.log("success")
                                                        res.send("success")
                                                    })
                                                }
                                            })
                                        } else {
                                            amount = 0
                                            console.log("success")
                                            res.send("success")
                                        }
                                    })
                                })
                            })
                        } else {
                            amount = amount - (500000 - payments.data[i].paidAmount)
                            await supabase.from('AllotmentPayment').update({ paidAmount: parseFloat(payments.data[i].paidAmount + parseFloat((500000 - payments.data[i].paidAmount))) }).eq('allotmentPaymentId', payments.data[i].allotmentPaymentId).then(async (resp) => {
                                await supabase.from('AllotmentTransactions').insert({ leadId: payments.data[i].leadId, unitId: payments.data[i].unitId, allotmentPaymentId: payments.data[i].allotmentPaymentId, amount: parseFloat((500000 - payments.data[i].paidAmount)), transactionType: 'Allotment', modeOfPayment: 'Virtual acc', leadId: payments.data[i].leadId.leadId, unitId: payments.data[i].unitId.unitId }).then(async (re) => {
                                    await supabase.from('LeadStatus').update({ status: 'Allotment Payment Complete' }).eq('leadId', payments.data[i].leadId).then((r) => {
                                        console.log("success")
                                        // res.send("success")
                                    })
                                })
                            })
                        }
                    } else {
                        break;
                    }
                }
            })
        })
    } else {
        res.send("success")
    }
})

router.get('/sendEmailForQr', function (req, res, next) {
    supabase.from('TokenTransactions').select('*,leadId(*,personId(*)),eventTokenId(*,tokenId(*),eventId(*)),paymentId(*)').eq('paymentLinkId', 'plink_LAobbaX0235zGk').then((tokenTransaction) => {
        QRCode.toDataURL(`584277e3-fe87-4653-9820-3b528c42a213`).then(async (resp) => {
            res.send(`${supabaseUrl}qrcodes/${tokenTransaction.data[0].paymentId.paymentId}.png`)
            resp = resp.split('base64,')[1]
            let qrData = {
                eventImg: `${supabaseUrl}${tokenTransaction.data[0].eventTokenId.eventId.bannerImgUrl}`,
                eventName: tokenTransaction.data[0].eventTokenId.eventId.title,
                eventDateTime: tokenTransaction.data[0].eventTokenId.eventId.startDateTime,
                tokenTitle: tokenTransaction.data[0].eventTokenId.tokenId.name,
                tokenDisplayNumber: tokenTransaction.data[0].paymentId.tokenNumber,
                tokenDate: tokenTransaction.data[0].eventTokenId.created_at,
                qrCode: `${supabaseUrl}qrcodes/${tokenTransaction.data[0].paymentId.paymentId}.png`,
                amount: tokenTransaction.data[0].eventTokenId.tokenId.amount,
            }

            sendMail(QrTemplate(qrData), tokenTransaction.data[0].leadId.personId.email, `Token for ${tokenTransaction.data[0].eventTokenId.eventId.title}`)
        })
    })
})

router.post('/create-payment-link', function (req, res, next) {
    if (!req.body.amount || req.body.amount <= 0) {
        res.send({ success: false, message: "Please provide amount" })
    } else if (!req.body.leadName || req.body.leadName === '') {
        res.send({ success: false, message: "Please provide lead name" })
    } else if (!req.body.leadEmail || req.body.leadEmail === 0) {
        res.send({ success: false, message: "Please provide lead email" })
    } else if (!req.body.leadContactNumber || req.body.leadContactNumber === 0) {
        res.send({ success: false, message: "Please provide lead contact number" })
    } else if (req.body.mode === 'token' && (!req.body.tokenName || req.body.tokenName === '')) {
        res.send({ success: false, message: "Please provide lead token name" })
    } else if (req.body.mode === 'token' && (!req.body.eventName || req.body.eventName === '')) {
        res.send({ success: false, message: "Please provide lead event name" })
    } else if (req.body.mode !== 'token' && (!req.body.allotmentPaymentId || req.body.allotmentPaymentId === '')) {
        res.send({ success: false, message: "Please provide lead event name" })
    } else if (req.body.mode !== 'token' && (!req.body.unitId || req.body.unitId === '')) {
        res.send({ success: false, message: "Please provide lead event name" })
    } else if (req.body.mode !== 'token' && (!req.body.leadId || req.body.leadId === '')) {
        res.send({ success: false, message: "Please provide lead event name" })
    } else {
        instance.paymentLink.create({
            // upi_link: true, NOT IN TEST MODE
            amount: req.body.amount * 100,
            currency: "INR",
            accept_partial: false,
            expire_by: new Date().getTime() + 86400000,
            // expire_by: 1673013266723,
            // first_min_partial_amount: 100,
            description: req.body.mode === 'token' ? `${req.body.tokenName} token payment link for ${req.body.eventName} event for ${req.body.leadName} lead` : `Allotment payment link for ${req.body.leadName} lead`,
            customer: {
                name: `${req.body.leadName}`,
                email: `${req.body.leadEmail}`,
                contact: `${req.body.leadContactNumber}`
            },
            notify: {
                sms: true,
                email: true
            },
            reminder_enable: true,
            // callback_url: "https://example-callback-url.com/",
            // callback_method: "get"
        }).then((resp) => {
            if (req.body.mode === 'token') {
                supabase.from('TokenTransactions').insert({ paymentLinkId: resp.id, paymentId: req.body.paymentId, status: "pending", amount: resp.amount / 100, leadId: req.body.leadId, eventTokenId: req.body.eventTokenId }).then((supabaseRes) => {
                    res.send({ success: true, message: "Payment link shared successfully" })
                })
            } else {
                supabase.from('AllotmentTransactions').insert({ paymentLinkId: resp.id, modeOfPayment: "Razorpay Link", transactionType: "Allotment", allotmentPaymentId: req.body.allotmentPaymentId, unitId: req.body.unitId, status: "pending", amount: resp.amount / 100, leadId: req.body.leadId }).then((supabaseRes) => {
                    res.send({ success: true, message: "Payment link shared successfully" })
                })
            }
        }).catch((err) => {
            res.send({ success: false, err })
        })
    }
})

router.post('/resend-payment-link', function (req, res, nex) {
    if (!req.body.paymentId || req.body.paymentId === '') {
        res.send({ success: false, message: "Please provide paymentId" })
    } else {
        instance.paymentLink.notifyBy(req.body.paymentId, 'sms').then((resp) => {
            res.send({ success: true, message: "payment link send successfully" })
        }).catch((err) => {
            res.send({ success: false, err })
        })
    }
})

router.post('/create-pos-transaction', function (req, res, next) {
    if (!req.body.TransactionNumber) {
        res.send({ success: false, message: "Please provide Transaction Number" })
    } else if (!req.body.amount) {
        res.send({ success: false, message: "Please provide Transaction Amount" })
    } else {
        axios.post('https://www.plutuscloudserviceuat.in:8201/API/CloudBasedIntegration/V1/UploadBilledTransaction',
            {
                TransactionNumber: `${req.body.TransactionNumber}`,
                SequenceNumber: 1,
                AllowedPaymentMode: "1",
                MerchantStorePosCode: "1221258286",
                Amount: `${req.body.amount * 100}`,
                UserID: "Sid",
                MerchantID: 29610,
                SecurityToken: "a4c9741b-2889-47b8-be2f-ba42081a246e",
                IMEI: "VILAS1000286",
                AutoCancelDurationInMinutes: 5
            }).then((resp) => {
                if (resp.data.PlutusTransactionReferenceID === 0) {
                    res.send({ success: false, message: "Please complete previous transaction to continue" })
                } else if (resp.data.PlutusTransactionReferenceID < 0) {
                    res.send({ success: false, message: "Please provide new transaction number" })
                } else {
                    res.send({ success: true, message: "Transaction created successfully", ptrnNo: resp.data.PlutusTransactionReferenceID })
                }
            }).catch((err) => {
                res.send({ success: false, err })
            })
    }
})

router.post('/check-pos-transaction-status', function (req, res, next) {
    if (!req.body.ptrnNo) {
        res.send({ success: false, message: "Please provide PRTN Number" })
    } else {
        axios.post('https://www.plutuscloudserviceuat.in:8201/API/CloudBasedIntegration/V1/GetCloudBasedTxnStatus',
            {
                MerchantID: 29610,
                SecurityToken: "a4c9741b-2889-47b8-be2f-ba42081a246e",
                IMEI: "VILAS1000286",
                MerchantStorePosCode: "1221258286",
                PlutusTransactionReferenceID: req.body.ptrnNo
            }).then((resp) => {
                // console.log(resp)
                // TXN APPROVED
                if (resp.data.ResponseMessage === 'TXN APPROVED') {
                    res.send({ success: true, message: "completed" })
                } else if (resp.data.ResponseMessage === 'TXN UPLOADED') {
                    res.send({ success: true, message: "pending" })
                } else {
                    res.send({ success: false, message: "expired" })
                }
            }).catch((err) => {
                res.send(err)
            })
    }
})

router.post('/get-payment-link', function (req, res, next) {
    if (!req.body.linkId || req.body.linkId === '') {
        res.send({ success: false, message: "Please provide link id" })
    } else {
        instance.paymentLink.fetch(req.body.linkId).then((resp) => {
            res.send({ success: true, link: resp.short_url })
        }).catch((err) => {
            res.send({ success: false, message: err })
        })
    }
})

module.exports = router;
