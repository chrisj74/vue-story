'use strict';

const functions = require('firebase-functions');
const axios = require('axios');
const secrets = require('./config')
// Add your Bing Search V7 subscription key to your environment variables.
const subscriptionKey = secrets.bingApiKey; // process.env['BING_SEARCH_V7_SUBSCRIPTION_KEY']

// Add your Bing Search V7 endpoint to your environment variables.
const host = 'https://api.cognitive.microsoft.com'; // process.env['BING_SEARCH_V7_ENDPOINT']
const path = '/bing/v7.0/search';

module.exports.search = functions.https.onCall((data, context) => {

  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
        'while authenticated.');
  }
  const uid = context.auth.uid;
  const name = context.auth.token.name || null;
  const picture = context.auth.token.picture || null;
  const email = context.auth.token.email || null;

  const headers = {
    headers : {
      'Ocp-Apim-Subscription-Key' : subscriptionKey,
    }
  };

  return axios.get(host + path + '?q=' + encodeURIComponent(data.q) + '&safeSearch=Strict', headers).then(result => {
    console.log('result=', result.data);
    return result.data;
  });
});