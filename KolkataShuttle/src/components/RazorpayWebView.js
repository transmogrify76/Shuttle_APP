import React, { useRef, useState } from 'react';
import { Modal, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export default function RazorpayWebView({ visible, onClose, onSuccess, onError, orderData }) {
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef(null);

  const generateHtml = () => {
    const { key, amount, currency, order_id, name, description, prefill } = orderData;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; }
          #loader { color: white; text-align: center; }
        </style>
      </head>
      <body>
        <div id="loader">Loading payment gateway...</div>
        <script>
          var options = {
            key: "${key}",
            amount: "${amount}",
            currency: "${currency}",
            name: "${name}",
            description: "${description}",
            order_id: "${order_id}",
            prefill: {
              email: "${prefill.email || ''}",
              contact: "${prefill.contact || ''}",
              name: "${prefill.name || ''}"
            },
            theme: { color: "#000000" },
            handler: function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'success',
                data: response
              }));
            },
            modal: {
              ondismiss: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'cancel'
                }));
              }
            }
          };
          var rzp = new Razorpay(options);
          rzp.open();
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'success') {
        onSuccess(data.data);
      } else if (data.type === 'cancel') {
        onError('Payment cancelled by user');
      }
      onClose();
    } catch (e) {
      console.error('WebView message error', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        {loading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', zIndex: 1 }}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}
        <WebView
          ref={webviewRef}
          source={{ html: generateHtml() }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>
    </Modal>
  );
}   