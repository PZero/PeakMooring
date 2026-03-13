import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

export const initOneSignal = async () => {
  if (!ONESIGNAL_APP_ID) return;
  
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      welcomeNotification: {
        title: "PeakMooring",
        message: "Grazie per esserti iscritto alle notifiche!",
      },
    });
  } catch (error) {
    console.error('OneSignal Init Error:', error);
  }
};

export const sendNotificationToUser = async (userEmail: string, message: string) => {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('OneSignal credentials missing');
    return;
  }

  // Note: In a production app, this should ideally happen via a backend/Edge Function 
  // to keep the REST API Key secure. For this implementation, we use the provided key.
  
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: 'email', value: userEmail }
        ],
        contents: { en: message, it: message },
        headings: { en: 'PeakMooring Update', it: 'Aggiornamento PeakMooring' }
      })
    });

    const data = await response.json();
    console.log('OneSignal Response:', data);
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
